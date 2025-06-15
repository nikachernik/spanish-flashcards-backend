const { validationResult } = require('express-validator');
const supabase = require('../services/supabase');
const geminiService = require('../services/gemini.service');

const wordsController = {
  async getWords(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { level, theme, limit = 50, offset = 0 } = req.query;
      
      let query = supabase
        .from('words_with_examples')
        .select('*')
        .range(offset, offset + limit - 1);

      if (level) {
        const { data: levelData } = await supabase
          .from('levels')
          .select('id')
          .eq('code', level)
          .single();
        
        if (levelData) {
          query = query.eq('level_id', levelData.id);
        }
      }

      if (theme) {
        query = query.eq('theme_id', theme);
      }

      const { data, error, count } = await query;

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      // Get user stats for these words
      const wordIds = data.map(w => w.id);
      const { data: userStats } = await supabase
        .from('user_word_stats')
        .select('*')
        .eq('user_id', req.userId)
        .in('word_id', wordIds);

      // Merge user stats with words
      const wordsWithStats = data.map(word => {
        const stats = userStats?.find(s => s.word_id === word.id);
        return {
          ...word,
          userStats: stats || null
        };
      });

      res.json({
        words: wordsWithStats,
        total: count,
        limit,
        offset
      });
    } catch (error) {
      console.error('Get words error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async getWordById(req, res) {
    try {
      const { id } = req.params;

      const { data: word, error } = await supabase
        .from('words_with_examples')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !word) {
        return res.status(404).json({ message: 'Word not found' });
      }

      // Get user stats
      const { data: stats } = await supabase
        .from('user_word_stats')
        .select('*')
        .eq('user_id', req.userId)
        .eq('word_id', id)
        .single();

      res.json({
        ...word,
        userStats: stats || null
      });
    } catch (error) {
      console.error('Get word error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async createWord(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { spanish, russian, pronunciation, levelId, themeId, examples } = req.body;

      // Create word
      const { data: word, error } = await supabase
        .from('words')
        .insert([{
          spanish,
          russian,
          pronunciation,
          level_id: levelId,
          theme_id: themeId,
          is_user_generated: true,
          created_by: req.userId
        }])
        .select()
        .single();

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      // Add examples if provided
      if (examples && examples.length > 0) {
        const examplesData = examples.map((ex, index) => ({
          word_id: word.id,
          example_spanish: ex.spanish,
          example_russian: ex.russian,
          order_index: index
        }));

        await supabase
          .from('word_examples')
          .insert(examplesData);
      }

      res.status(201).json({
        message: 'Word created successfully',
        word
      });
    } catch (error) {
      console.error('Create word error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async updateWord(req, res) {
    try {
      const { id } = req.params;
      const { spanish, russian, pronunciation, levelId, themeId } = req.body;

      const { data, error } = await supabase
        .from('words')
        .update({
          spanish,
          russian,
          pronunciation,
          level_id: levelId,
          theme_id: themeId
        })
        .eq('id', id)
        .eq('created_by', req.userId)
        .select()
        .single();

      if (error || !data) {
        return res.status(404).json({ message: 'Word not found or unauthorized' });
      }

      res.json({
        message: 'Word updated successfully',
        word: data
      });
    } catch (error) {
      console.error('Update word error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async deleteWord(req, res) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('words')
        .delete()
        .eq('id', id)
        .eq('created_by', req.userId);

      if (error) {
        return res.status(404).json({ message: 'Word not found or unauthorized' });
      }

      res.json({ message: 'Word deleted successfully' });
    } catch (error) {
      console.error('Delete word error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async generateWords(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { theme, level, model, count = 5, existingWords = [] } = req.body;
      
      console.log('Generating words with:', { theme, level, model, count });

      // Get user's settings
      const settingsRoutes = require('../routes/settings.routes');
      const userApiKey = settingsRoutes.getUserApiKey(req.userId);
      const userTimeout = settingsRoutes.getUserTimeout(req.userId);

      // Generate words using Gemini AI with user's timeout
      const generatePromise = geminiService.generateWords(theme, level, count, existingWords, model, userApiKey);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Gemini API timeout after ${userTimeout} seconds`)), userTimeout * 1000)
      );
      
      let generatedWords;
      try {
        generatedWords = await Promise.race([generatePromise, timeoutPromise]);
      } catch (timeoutError) {
        console.error('Timeout or error generating words:', timeoutError);
        return res.status(500).json({ message: 'Generation timeout. Please try again.' });
      }

      if (!generatedWords || generatedWords.length === 0) {
        return res.status(500).json({ message: 'Failed to generate words' });
      }

      // Return the generated words with their examples
      // The frontend will handle filtering and saving
      res.json({
        message: 'Words generated successfully',
        words: generatedWords
      });
    } catch (error) {
      console.error('Generate words error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async toggleFavorite(req, res) {
    try {
      const { id } = req.params;

      // Check if user stats exist
      const { data: existingStats } = await supabase
        .from('user_word_stats')
        .select('*')
        .eq('user_id', req.userId)
        .eq('word_id', id)
        .single();

      if (existingStats) {
        // Update existing stats
        const { data, error } = await supabase
          .from('user_word_stats')
          .update({ is_favorite: !existingStats.is_favorite })
          .eq('user_id', req.userId)
          .eq('word_id', id)
          .select()
          .single();

        if (error) {
          return res.status(400).json({ message: error.message });
        }

        res.json({ isFavorite: data.is_favorite });
      } else {
        // Create new stats
        const { data, error } = await supabase
          .from('user_word_stats')
          .insert([{
            user_id: req.userId,
            word_id: id,
            is_favorite: true
          }])
          .select()
          .single();

        if (error) {
          return res.status(400).json({ message: error.message });
        }

        res.json({ isFavorite: true });
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async addMissingExamples(req, res) {
    try {
      const wordExamples = {
        'hola': [
          { spanish: 'Hola, ¿cómo estás?', russian: 'Привет, как дела?' },
          { spanish: 'Dile hola a tu madre.', russian: 'Передай привет своей маме.' }
        ],
        'adiós': [
          { spanish: 'Adiós, nos vemos mañana.', russian: 'Пока, увидимся завтра.' },
          { spanish: 'Es hora de decir adiós.', russian: 'Пора прощаться.' }
        ],
        'por favor': [
          { spanish: 'Un café por favor.', russian: 'Кофе, пожалуйста.' },
          { spanish: 'Ayúdame por favor.', russian: 'Помоги мне, пожалуйста.' }
        ],
        'gracias': [
          { spanish: 'Muchas gracias por tu ayuda.', russian: 'Большое спасибо за твою помощь.' },
          { spanish: 'Gracias por venir.', russian: 'Спасибо, что пришли.' }
        ],
        'buenos días': [
          { spanish: 'Buenos días, señor García.', russian: 'Доброе утро, господин Гарсия.' },
          { spanish: 'Te deseo buenos días.', russian: 'Желаю тебе доброго утра.' }
        ]
      };

      // Get words without examples
      const { data: words } = await supabase
        .from('words')
        .select(`
          id,
          spanish,
          word_examples (id)
        `);
      
      const wordsWithoutExamples = words.filter(word => !word.word_examples || word.word_examples.length === 0);
      let addedCount = 0;
      
      for (const word of wordsWithoutExamples) {
        const spanishWord = word.spanish.toLowerCase();
        
        if (wordExamples[spanishWord]) {
          const examplesData = wordExamples[spanishWord].map((ex, index) => ({
            word_id: word.id,
            example_spanish: ex.spanish,
            example_russian: ex.russian,
            order_index: index
          }));
          
          await supabase
            .from('word_examples')
            .insert(examplesData);
          
          addedCount++;
        }
      }
      
      res.json({ 
        message: `Added examples to ${addedCount} words`,
        totalWordsWithoutExamples: wordsWithoutExamples.length
      });
    } catch (error) {
      console.error('Add examples error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = wordsController;