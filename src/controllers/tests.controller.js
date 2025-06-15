const { validationResult } = require('express-validator');
const supabase = require('../services/supabase');

const testsController = {
  async getTests(req, res) {
    try {
      const { limit = 10, offset = 0 } = req.query;

      const { data: tests, error, count } = await supabase
        .from('tests')
        .select('*, test_answers(count)', { count: 'exact' })
        .eq('user_id', req.userId)
        .order('started_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      res.json({
        tests,
        total: count,
        limit,
        offset
      });
    } catch (error) {
      console.error('Get tests error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async startTest(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { levelCode, themeId, wordCount = 10 } = req.body;
      let levelId = null;

      if (levelCode) {
        const { data: level } = await supabase
          .from('levels')
          .select('id')
          .eq('code', levelCode)
          .single();
        
        levelId = level?.id;
      }

      // Get words for the test
      let wordsQuery = supabase
        .from('words')
        .select('*');

      if (levelId) {
        wordsQuery = wordsQuery.eq('level_id', levelId);
      }

      if (themeId) {
        wordsQuery = wordsQuery.eq('theme_id', themeId);
      }

      const { data: allWords, error: wordsError } = await wordsQuery;

      if (wordsError || !allWords || allWords.length === 0) {
        return res.status(400).json({ message: 'Not enough words available for test' });
      }

      // Randomly select words
      const shuffled = allWords.sort(() => 0.5 - Math.random());
      const words = shuffled.slice(0, Math.min(wordCount, allWords.length));

      if (!words || words.length === 0) {
        return res.status(400).json({ message: 'Not enough words available for test' });
      }

      // Create test
      const { data: test, error } = await supabase
        .from('tests')
        .insert([{
          user_id: req.userId,
          level_id: levelId,
          theme_id: themeId,
          test_type: themeId ? 'theme' : (levelId ? 'level' : 'custom'),
          total_words: words.length,
          started_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      res.json({
        testId: test.id,
        words: words.map(w => ({
          id: w.id,
          russian: w.russian,
          level_id: w.level_id,
          theme_id: w.theme_id
        }))
      });
    } catch (error) {
      console.error('Start test error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async submitAnswer(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id: testId } = req.params;
      const { wordId, userAnswer } = req.body;

      // Get the correct answer
      const { data: word } = await supabase
        .from('words')
        .select('spanish')
        .eq('id', wordId)
        .single();

      if (!word) {
        return res.status(404).json({ message: 'Word not found' });
      }

      // Check if answer is correct (case-insensitive)
      const isCorrect = word.spanish.toLowerCase().trim() === userAnswer.toLowerCase().trim();

      // Record the answer
      const { error } = await supabase
        .from('test_answers')
        .insert([{
          test_id: testId,
          word_id: wordId,
          user_answer: userAnswer,
          is_correct: isCorrect,
          answered_at: new Date().toISOString()
        }]);

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      // Update test correct answers count
      if (isCorrect) {
        await supabase.rpc('increment', {
          table_name: 'tests',
          column_name: 'correct_answers',
          row_id: testId
        });
      }

      // Update user word stats
      const { data: existingStats } = await supabase
        .from('user_word_stats')
        .select('*')
        .eq('user_id', req.userId)
        .eq('word_id', wordId)
        .single();

      if (existingStats) {
        const updates = {
          times_seen: existingStats.times_seen + 1,
          last_seen_date: new Date().toISOString()
        };

        if (isCorrect) {
          updates.times_correct = existingStats.times_correct + 1;
          updates.last_correct_date = new Date().toISOString();
        } else {
          updates.times_incorrect = existingStats.times_incorrect + 1;
        }

        await supabase
          .from('user_word_stats')
          .update(updates)
          .eq('user_id', req.userId)
          .eq('word_id', wordId);
      } else {
        // Create new stats
        await supabase
          .from('user_word_stats')
          .insert([{
            user_id: req.userId,
            word_id: wordId,
            times_seen: 1,
            times_correct: isCorrect ? 1 : 0,
            times_incorrect: isCorrect ? 0 : 1,
            last_seen_date: new Date().toISOString(),
            last_correct_date: isCorrect ? new Date().toISOString() : null
          }]);
      }

      res.json({
        isCorrect,
        correctAnswer: word.spanish
      });
    } catch (error) {
      console.error('Submit answer error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async getTestResults(req, res) {
    try {
      const { id } = req.params;

      // Get test details
      const { data: test, error: testError } = await supabase
        .from('tests')
        .select('*')
        .eq('id', id)
        .eq('user_id', req.userId)
        .single();

      if (testError || !test) {
        return res.status(404).json({ message: 'Test not found' });
      }

      // Get test answers with word details
      const { data: answers, error: answersError } = await supabase
        .from('test_answers')
        .select(`
          *,
          words (spanish, russian)
        `)
        .eq('test_id', id)
        .order('answered_at');

      if (answersError) {
        return res.status(400).json({ message: answersError.message });
      }

      // Calculate score
      const correctCount = answers.filter(a => a.is_correct).length;
      const score = (correctCount / test.total_words) * 100;

      res.json({
        test: {
          ...test,
          score: Math.round(score)
        },
        answers,
        summary: {
          totalQuestions: test.total_words,
          correctAnswers: correctCount,
          incorrectAnswers: test.total_words - correctCount,
          score: Math.round(score)
        }
      });
    } catch (error) {
      console.error('Get test results error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async completeTest(req, res) {
    try {
      const { id } = req.params;

      // Calculate final score
      const { data: test } = await supabase
        .from('tests')
        .select('*')
        .eq('id', id)
        .eq('user_id', req.userId)
        .single();

      if (!test) {
        return res.status(404).json({ message: 'Test not found' });
      }

      const score = (test.correct_answers / test.total_words) * 100;

      // Update test as completed
      const { error } = await supabase
        .from('tests')
        .update({
          score: Math.round(score),
          completed_at: new Date().toISOString(),
          is_completed: true
        })
        .eq('id', id);

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      res.json({
        message: 'Test completed successfully',
        score: Math.round(score)
      });
    } catch (error) {
      console.error('Complete test error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = testsController;