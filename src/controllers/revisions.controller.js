const { validationResult } = require('express-validator');
const supabase = require('../services/supabase');

const revisionsController = {
  async startSession(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { levelCode, themeId } = req.body;
      let levelId = null;

      if (levelCode) {
        const { data: level } = await supabase
          .from('levels')
          .select('id')
          .eq('code', levelCode)
          .single();
        
        levelId = level?.id;
      }

      // Create revision session
      const { data: session, error } = await supabase
        .from('revision_sessions')
        .insert([{
          user_id: req.userId,
          level_id: levelId,
          theme_id: themeId,
          started_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      res.json({
        sessionId: session.id,
        message: 'Revision session started'
      });
    } catch (error) {
      console.error('Start session error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async getNextWord(req, res) {
    try {
      const { levelCode, themeId } = req.query;
      
      // Get the next word to review
      let query = supabase
        .from('words_with_examples')
        .select('*')
        .order('random()')
        .limit(1);

      if (levelCode) {
        const { data: level } = await supabase
          .from('levels')
          .select('id')
          .eq('code', levelCode)
          .single();
        
        if (level) {
          query = query.eq('level_id', level.id);
        }
      }

      if (themeId) {
        query = query.eq('theme_id', themeId);
      }

      // Exclude already mastered words
      const { data: masteredWords } = await supabase
        .from('user_word_stats')
        .select('word_id')
        .eq('user_id', req.userId)
        .eq('is_mastered', true);

      if (masteredWords && masteredWords.length > 0) {
        const masteredIds = masteredWords.map(w => w.word_id);
        query = query.not('id', 'in', `(${masteredIds.join(',')})`);
      }

      const { data: words, error } = await query;

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      if (!words || words.length === 0) {
        return res.json({ 
          word: null,
          message: 'No more words to review'
        });
      }

      res.json({ word: words[0] });
    } catch (error) {
      console.error('Get next word error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async markWord(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { wordId } = req.params;
      const { sessionId, markedAsKnown } = req.body;

      // Record the revision
      const { error: revisionError } = await supabase
        .from('revised_words')
        .insert([{
          session_id: sessionId,
          word_id: wordId,
          marked_as_known: markedAsKnown,
          reviewed_at: new Date().toISOString()
        }]);

      if (revisionError) {
        return res.status(400).json({ message: revisionError.message });
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

        if (markedAsKnown) {
          updates.times_correct = existingStats.times_correct + 1;
          updates.last_correct_date = new Date().toISOString();
          
          // Mark as mastered if correct 3 times in a row
          if (updates.times_correct >= 3) {
            updates.is_mastered = true;
          }
        } else {
          updates.times_incorrect = existingStats.times_incorrect + 1;
          updates.is_mastered = false;
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
            times_correct: markedAsKnown ? 1 : 0,
            times_incorrect: markedAsKnown ? 0 : 1,
            last_seen_date: new Date().toISOString(),
            last_correct_date: markedAsKnown ? new Date().toISOString() : null
          }]);
      }

      // Update session word count
      await supabase
        .from('revision_sessions')
        .update({ words_reviewed: sessionId.words_reviewed + 1 })
        .eq('id', sessionId);

      res.json({ message: 'Word marked successfully' });
    } catch (error) {
      console.error('Mark word error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async endSession(req, res) {
    try {
      const { sessionId } = req.params;

      const { error } = await supabase
        .from('revision_sessions')
        .update({ 
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', req.userId);

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      res.json({ message: 'Session ended successfully' });
    } catch (error) {
      console.error('End session error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async getHistory(req, res) {
    try {
      const { limit = 10, offset = 0 } = req.query;

      const { data: sessions, error, count } = await supabase
        .from('revision_sessions')
        .select('*, revised_words(count)', { count: 'exact' })
        .eq('user_id', req.userId)
        .order('started_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      res.json({
        sessions,
        total: count,
        limit,
        offset
      });
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = revisionsController;