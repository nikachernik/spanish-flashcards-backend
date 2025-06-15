require('dotenv').config();
const supabase = require('../services/supabase');

const wordExamples = {
  // A1 Level Examples
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
  ],
  'buenas tardes': [
    { spanish: 'Buenas tardes, ¿cómo está?', russian: 'Добрый день, как поживаете?' },
    { spanish: 'Les doy las buenas tardes.', russian: 'Желаю вам доброго дня.' }
  ],
  'buenas noches': [
    { spanish: 'Buenas noches, que descanses.', russian: 'Спокойной ночи, отдыхай.' },
    { spanish: 'Es hora de dar las buenas noches.', russian: 'Пора желать спокойной ночи.' }
  ],
  'casa': [
    { spanish: 'Mi casa es tu casa.', russian: 'Мой дом - твой дом.' },
    { spanish: 'Voy a casa después del trabajo.', russian: 'Я иду домой после работы.' }
  ],
  'familia': [
    { spanish: 'Mi familia es muy grande.', russian: 'Моя семья очень большая.' },
    { spanish: 'La familia es lo más importante.', russian: 'Семья - это самое важное.' }
  ],
  'amigo': [
    { spanish: 'Juan es mi mejor amigo.', russian: 'Хуан - мой лучший друг.' },
    { spanish: 'Necesito hablar con un amigo.', russian: 'Мне нужно поговорить с другом.' }
  ],
  'agua': [
    { spanish: 'Quiero un vaso de agua.', russian: 'Я хочу стакан воды.' },
    { spanish: 'El agua está fría.', russian: 'Вода холодная.' }
  ],
  'comida': [
    { spanish: 'La comida está deliciosa.', russian: 'Еда восхитительная.' },
    { spanish: 'Es hora de la comida.', russian: 'Время обеда.' }
  ],
  'escuela': [
    { spanish: 'Los niños van a la escuela.', russian: 'Дети идут в школу.' },
    { spanish: 'Mi escuela está cerca de casa.', russian: 'Моя школа находится рядом с домом.' }
  ],
  'trabajo': [
    { spanish: 'Voy al trabajo en metro.', russian: 'Я езжу на работу на метро.' },
    { spanish: 'Mi trabajo es interesante.', russian: 'Моя работа интересная.' }
  ],
  'libro': [
    { spanish: 'Estoy leyendo un libro nuevo.', russian: 'Я читаю новую книгу.' },
    { spanish: 'Este libro es muy bueno.', russian: 'Эта книга очень хорошая.' }
  ],
  
  // A2 Level Examples
  'restaurante': [
    { spanish: 'Cenamos en un restaurante italiano.', russian: 'Мы ужинаем в итальянском ресторане.' },
    { spanish: 'El restaurante abre a las ocho.', russian: 'Ресторан открывается в восемь.' }
  ],
  'viaje': [
    { spanish: 'Mi viaje a España fue increíble.', russian: 'Моя поездка в Испанию была невероятной.' },
    { spanish: 'Estoy planeando un viaje.', russian: 'Я планирую путешествие.' }
  ],
  'película': [
    { spanish: 'Vamos a ver una película.', russian: 'Пойдем смотреть фильм.' },
    { spanish: 'La película empieza a las nueve.', russian: 'Фильм начинается в девять.' }
  ],
  'deporte': [
    { spanish: 'Mi deporte favorito es el fútbol.', russian: 'Мой любимый спорт - футбол.' },
    { spanish: 'Hacer deporte es saludable.', russian: 'Заниматься спортом полезно для здоровья.' }
  ],
  'tiempo': [
    { spanish: 'El tiempo está muy bueno hoy.', russian: 'Сегодня очень хорошая погода.' },
    { spanish: 'No tengo tiempo ahora.', russian: 'У меня сейчас нет времени.' }
  ]
};

async function addExamplesToWords() {
  try {
    console.log('Starting to add examples to existing words...');
    
    // Get all words without examples
    const { data: words, error: wordsError } = await supabase
      .from('words')
      .select(`
        id,
        spanish,
        word_examples (id)
      `);
    
    if (wordsError) {
      console.error('Error fetching words:', wordsError);
      return;
    }
    
    // Filter words that don't have examples
    const wordsWithoutExamples = words.filter(word => !word.word_examples || word.word_examples.length === 0);
    
    console.log(`Found ${wordsWithoutExamples.length} words without examples`);
    
    for (const word of wordsWithoutExamples) {
      const spanishWord = word.spanish.toLowerCase();
      
      if (wordExamples[spanishWord]) {
        console.log(`Adding examples for: ${word.spanish}`);
        
        const examplesData = wordExamples[spanishWord].map((ex, index) => ({
          word_id: word.id,
          example_spanish: ex.spanish,
          example_russian: ex.russian,
          order_index: index
        }));
        
        const { error: insertError } = await supabase
          .from('word_examples')
          .insert(examplesData);
        
        if (insertError) {
          console.error(`Error adding examples for ${word.spanish}:`, insertError);
        } else {
          console.log(`✓ Added ${examplesData.length} examples for ${word.spanish}`);
        }
      } else {
        console.log(`No examples available for: ${word.spanish}`);
      }
    }
    
    console.log('Finished adding examples!');
    
  } catch (error) {
    console.error('Error in script:', error);
  }
  
  process.exit(0);
}

// Run the script
addExamplesToWords();