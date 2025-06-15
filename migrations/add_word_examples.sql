-- Migration to add examples to existing words
-- This migration adds example sentences for basic Spanish words

-- First, let's create a temporary function to add examples safely
CREATE OR REPLACE FUNCTION add_word_examples(
  p_spanish TEXT,
  p_examples JSONB
) RETURNS VOID AS $$
DECLARE
  v_word_id INTEGER;
  v_example JSONB;
  v_index INTEGER := 0;
BEGIN
  -- Find the word ID
  SELECT id INTO v_word_id 
  FROM words 
  WHERE LOWER(spanish) = LOWER(p_spanish)
  LIMIT 1;
  
  -- If word exists and doesn't have examples yet
  IF v_word_id IS NOT NULL THEN
    -- Check if examples already exist
    IF NOT EXISTS (SELECT 1 FROM word_examples WHERE word_id = v_word_id) THEN
      -- Add each example
      FOR v_example IN SELECT * FROM jsonb_array_elements(p_examples)
      LOOP
        INSERT INTO word_examples (word_id, example_spanish, example_russian, order_index)
        VALUES (
          v_word_id,
          v_example->>'spanish',
          v_example->>'russian',
          v_index
        );
        v_index := v_index + 1;
      END LOOP;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add examples for A1 level words
SELECT add_word_examples('hola', '[
  {"spanish": "Hola, ¿cómo estás?", "russian": "Привет, как дела?"},
  {"spanish": "Dile hola a tu madre.", "russian": "Передай привет своей маме."}
]'::jsonb);

SELECT add_word_examples('adiós', '[
  {"spanish": "Adiós, nos vemos mañana.", "russian": "Пока, увидимся завтра."},
  {"spanish": "Es hora de decir adiós.", "russian": "Пора прощаться."}
]'::jsonb);

SELECT add_word_examples('por favor', '[
  {"spanish": "Un café por favor.", "russian": "Кофе, пожалуйста."},
  {"spanish": "Ayúdame por favor.", "russian": "Помоги мне, пожалуйста."}
]'::jsonb);

SELECT add_word_examples('gracias', '[
  {"spanish": "Muchas gracias por tu ayuda.", "russian": "Большое спасибо за твою помощь."},
  {"spanish": "Gracias por venir.", "russian": "Спасибо, что пришли."}
]'::jsonb);

SELECT add_word_examples('buenos días', '[
  {"spanish": "Buenos días, señor García.", "russian": "Доброе утро, господин Гарсия."},
  {"spanish": "Te deseo buenos días.", "russian": "Желаю тебе доброго утра."}
]'::jsonb);

SELECT add_word_examples('buenas tardes', '[
  {"spanish": "Buenas tardes, ¿cómo está?", "russian": "Добрый день, как поживаете?"},
  {"spanish": "Les doy las buenas tardes.", "russian": "Желаю вам доброго дня."}
]'::jsonb);

SELECT add_word_examples('buenas noches', '[
  {"spanish": "Buenas noches, que descanses.", "russian": "Спокойной ночи, отдыхай."},
  {"spanish": "Es hora de dar las buenas noches.", "russian": "Пора желать спокойной ночи."}
]'::jsonb);

SELECT add_word_examples('sí', '[
  {"spanish": "Sí, estoy de acuerdo.", "russian": "Да, я согласен."},
  {"spanish": "¿Vienes? - Sí, claro.", "russian": "Ты придёшь? - Да, конечно."}
]'::jsonb);

SELECT add_word_examples('no', '[
  {"spanish": "No, gracias.", "russian": "Нет, спасибо."},
  {"spanish": "No entiendo la pregunta.", "russian": "Я не понимаю вопрос."}
]'::jsonb);

SELECT add_word_examples('disculpe', '[
  {"spanish": "Disculpe, ¿dónde está el baño?", "russian": "Извините, где находится туалет?"},
  {"spanish": "Disculpe la molestia.", "russian": "Извините за беспокойство."}
]'::jsonb);

-- Add examples for basic nouns
SELECT add_word_examples('casa', '[
  {"spanish": "Mi casa es tu casa.", "russian": "Мой дом - твой дом."},
  {"spanish": "Voy a casa después del trabajo.", "russian": "Я иду домой после работы."}
]'::jsonb);

SELECT add_word_examples('familia', '[
  {"spanish": "Mi familia es muy grande.", "russian": "Моя семья очень большая."},
  {"spanish": "La familia es lo más importante.", "russian": "Семья - это самое важное."}
]'::jsonb);

SELECT add_word_examples('amigo', '[
  {"spanish": "Juan es mi mejor amigo.", "russian": "Хуан - мой лучший друг."},
  {"spanish": "Necesito hablar con un amigo.", "russian": "Мне нужно поговорить с другом."}
]'::jsonb);

SELECT add_word_examples('agua', '[
  {"spanish": "Quiero un vaso de agua.", "russian": "Я хочу стакан воды."},
  {"spanish": "El agua está fría.", "russian": "Вода холодная."}
]'::jsonb);

SELECT add_word_examples('comida', '[
  {"spanish": "La comida está deliciosa.", "russian": "Еда восхитительная."},
  {"spanish": "Es hora de la comida.", "russian": "Время обеда."}
]'::jsonb);

SELECT add_word_examples('escuela', '[
  {"spanish": "Los niños van a la escuela.", "russian": "Дети идут в школу."},
  {"spanish": "Mi escuela está cerca de casa.", "russian": "Моя школа находится рядом с домом."}
]'::jsonb);

SELECT add_word_examples('trabajo', '[
  {"spanish": "Voy al trabajo en metro.", "russian": "Я езжу на работу на метро."},
  {"spanish": "Mi trabajo es interesante.", "russian": "Моя работа интересная."}
]'::jsonb);

SELECT add_word_examples('libro', '[
  {"spanish": "Estoy leyendo un libro nuevo.", "russian": "Я читаю новую книгу."},
  {"spanish": "Este libro es muy bueno.", "russian": "Эта книга очень хорошая."}
]'::jsonb);

SELECT add_word_examples('tiempo', '[
  {"spanish": "El tiempo está muy bueno hoy.", "russian": "Сегодня очень хорошая погода."},
  {"spanish": "No tengo tiempo ahora.", "russian": "У меня сейчас нет времени."}
]'::jsonb);

SELECT add_word_examples('día', '[
  {"spanish": "Hoy es un día especial.", "russian": "Сегодня особенный день."},
  {"spanish": "Que tengas un buen día.", "russian": "Хорошего тебе дня."}
]'::jsonb);

-- Add examples for A2 level words
SELECT add_word_examples('restaurante', '[
  {"spanish": "Cenamos en un restaurante italiano.", "russian": "Мы ужинаем в итальянском ресторане."},
  {"spanish": "El restaurante abre a las ocho.", "russian": "Ресторан открывается в восемь."}
]'::jsonb);

SELECT add_word_examples('viaje', '[
  {"spanish": "Mi viaje a España fue increíble.", "russian": "Моя поездка в Испанию была невероятной."},
  {"spanish": "Estoy planeando un viaje.", "russian": "Я планирую путешествие."}
]'::jsonb);

SELECT add_word_examples('película', '[
  {"spanish": "Vamos a ver una película.", "russian": "Пойдем смотреть фильм."},
  {"spanish": "La película empieza a las nueve.", "russian": "Фильм начинается в девять."}
]'::jsonb);

SELECT add_word_examples('deporte', '[
  {"spanish": "Mi deporte favorito es el fútbol.", "russian": "Мой любимый спорт - футбол."},
  {"spanish": "Hacer deporte es saludable.", "russian": "Заниматься спортом полезно для здоровья."}
]'::jsonb);

SELECT add_word_examples('calle', '[
  {"spanish": "Vivo en la calle Mayor.", "russian": "Я живу на улице Майор."},
  {"spanish": "Hay mucho tráfico en la calle.", "russian": "На улице много транспорта."}
]'::jsonb);

SELECT add_word_examples('ciudad', '[
  {"spanish": "Madrid es una ciudad hermosa.", "russian": "Мадрид - красивый город."},
  {"spanish": "La ciudad está muy tranquila hoy.", "russian": "Город сегодня очень спокойный."}
]'::jsonb);

SELECT add_word_examples('país', '[
  {"spanish": "España es un país maravilloso.", "russian": "Испания - чудесная страна."},
  {"spanish": "He visitado muchos países.", "russian": "Я посетил много стран."}
]'::jsonb);

SELECT add_word_examples('idioma', '[
  {"spanish": "El español es un idioma hermoso.", "russian": "Испанский - красивый язык."},
  {"spanish": "Hablo tres idiomas.", "russian": "Я говорю на трёх языках."}
]'::jsonb);

SELECT add_word_examples('dinero', '[
  {"spanish": "No tengo dinero suficiente.", "russian": "У меня недостаточно денег."},
  {"spanish": "El dinero no compra la felicidad.", "russian": "За деньги счастье не купишь."}
]'::jsonb);

SELECT add_word_examples('problema', '[
  {"spanish": "Tenemos un pequeño problema.", "russian": "У нас небольшая проблема."},
  {"spanish": "No hay problema, puedo ayudarte.", "russian": "Нет проблем, я могу помочь тебе."}
]'::jsonb);

-- Clean up the temporary function
DROP FUNCTION IF EXISTS add_word_examples(TEXT, JSONB);

-- Add a comment to track this migration
COMMENT ON TABLE word_examples IS 'Examples added via migration on database initialization';