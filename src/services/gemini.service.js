const { GoogleGenAI, Type } = require('@google/genai');

const geminiService = {
  // Format word with capital letter only at the beginning of first word
  formatWord(word) {
    if (!word) return word;
    
    // Split by spaces to handle multi-word phrases
    const words = word.toLowerCase().split(' ');
    
    // Capitalize only the first word
    if (words.length > 0) {
      words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    }
    
    return words.join(' ');
  },
  async generateWords(theme, level, count = 5, existingWords = [], modelName = 'gemini-2.5-flash-preview-05-20', userApiKey = null) {
    try {
      const apiKey = userApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY not found. Please update your API key in the profile settings.');
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });

      const existingWordsList = existingWords.length > 0 
        ? `\n\nDo NOT include these words that already exist in the database: ${existingWords.join(', ')}`
        : '';

      const prompt = `You are a Spanish language teacher for Russian speakers. Generate ${count} Spanish vocabulary words appropriate for ${level} CEFR level, related to the theme "${theme}".${existingWordsList}

IMPORTANT REQUIREMENTS:
- Words must be appropriate for ${level} level (${level === 'A1' ? 'basic beginner' : level === 'A2' ? 'elementary' : level === 'B1' ? 'intermediate' : level === 'B2' ? 'upper intermediate' : level === 'C1' ? 'advanced' : 'proficient'})
- Include diverse word types (nouns, verbs, adjectives) when relevant to the theme
- Avoid words that are too similar to each other
- Each word must have a proper Russian translation
- Pronunciation must be clear and use standard Latin characters with stress marks

For each word, you MUST provide ALL of the following:
1. spanish: The Spanish word (with proper accents)
2. russian: The accurate Russian translation (in Cyrillic)
3. pronunciation: Clear phonetic pronunciation using Latin characters (mark stressed syllables with CAPS)
4. examples: Exactly 2 example sentences showing the word in context

Return ONLY a valid JSON array, no additional text. Format:
[
  {
    "spanish": "biblioteca",
    "russian": "библиотека",
    "pronunciation": "bee-blee-oh-TEH-kah",
    "examples": [
      {
        "spanish": "Voy a la biblioteca a estudiar.",
        "russian": "Я иду в библиотеку учиться."
      },
      {
        "spanish": "La biblioteca cierra a las ocho.",
        "russian": "Библиотека закрывается в восемь."
      }
    ]
  }
]`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                spanish: {
                  type: Type.STRING,
                },
                russian: {
                  type: Type.STRING,
                },
                pronunciation: {
                  type: Type.STRING,
                },
                examples: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      spanish: {
                        type: Type.STRING,
                      },
                      russian: {
                        type: Type.STRING,
                      },
                    },
                    propertyOrdering: ['spanish', 'russian'],
                  },
                },
              },
              propertyOrdering: ['spanish', 'russian', 'pronunciation', 'examples'],
              required: ['spanish', 'russian', 'pronunciation', 'examples'],
            },
          },
        },
      });
      
      const generatedText = response.text;
      
      // The response is already in JSON format
      const words = JSON.parse(generatedText);
      
      // Format words with proper capitalization
      const formattedWords = words.map(word => ({
        ...word,
        spanish: this.formatWord(word.spanish),
        examples: word.examples?.map(ex => ({
          ...ex,
          spanish: ex.spanish // Keep examples as they are
        })) || []
      }));
      
      return formattedWords.slice(0, count);
    } catch (error) {
      console.error('Gemini API error:', error);
      // Return fallback words if API fails
      return this.getFallbackWords(theme, level, count);
    }
  },

  getFallbackWords(theme, level, count) {
    // Fallback words for common themes
    const fallbackWords = {
      'greetings': [
        {
          spanish: 'Hola',
          russian: 'привет',
          pronunciation: 'OH-lah',
          examples: [
            { spanish: 'Hola, ¿cómo estás?', russian: 'Привет, как дела?' },
            { spanish: 'Dile hola a tu madre.', russian: 'Передай привет своей маме.' }
          ]
        },
        {
          spanish: 'Buenos días',
          russian: 'доброе утро',
          pronunciation: 'BWAY-nohs DEE-ahs',
          examples: [
            { spanish: 'Buenos días, señor.', russian: 'Доброе утро, сеньор.' },
            { spanish: 'Te deseo buenos días.', russian: 'Желаю тебе доброго утра.' }
          ]
        }
      ],
      'family': [
        {
          spanish: 'Familia',
          russian: 'семья',
          pronunciation: 'fah-MEE-lee-ah',
          examples: [
            { spanish: 'Mi familia es grande.', russian: 'Моя семья большая.' },
            { spanish: 'Amo a mi familia.', russian: 'Я люблю свою семью.' }
          ]
        },
        {
          spanish: 'Hermano',
          russian: 'брат',
          pronunciation: 'er-MAH-noh',
          examples: [
            { spanish: 'Mi hermano es médico.', russian: 'Мой брат - врач.' },
            { spanish: 'Tengo dos hermanos.', russian: 'У меня два брата.' }
          ]
        }
      ]
    };

    const themeWords = fallbackWords[theme.toLowerCase()] || fallbackWords['greetings'];
    
    // Format fallback words with proper capitalization
    const formattedWords = themeWords.map(word => ({
      ...word,
      spanish: this.formatWord(word.spanish)
    }));
    
    return formattedWords.slice(0, count);
  },

  async generatePronunciation(text, language = 'es') {
    // This could be enhanced with a text-to-speech API
    return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${language}&client=tw-ob`;
  }
};

module.exports = geminiService;