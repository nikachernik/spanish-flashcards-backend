-- Migration to add examples to ALL words that don't have any
-- This is a comprehensive migration that covers common Spanish words

-- Create temporary function to add examples safely
CREATE OR REPLACE FUNCTION add_word_examples_safe(
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

-- Common food items
SELECT add_word_examples_safe('pan', '[
  {"spanish": "El pan está fresco y caliente.", "russian": "Хлеб свежий и горячий."},
  {"spanish": "Compro pan todas las mañanas.", "russian": "Я покупаю хлеб каждое утро."}
]'::jsonb);

SELECT add_word_examples_safe('leche', '[
  {"spanish": "La leche está en el refrigerador.", "russian": "Молоко в холодильнике."},
  {"spanish": "Me gusta la leche con café.", "russian": "Мне нравится молоко с кофе."}
]'::jsonb);

SELECT add_word_examples_safe('café', '[
  {"spanish": "Tomo café por la mañana.", "russian": "Я пью кофе по утрам."},
  {"spanish": "Este café es muy fuerte.", "russian": "Этот кофе очень крепкий."}
]'::jsonb);

SELECT add_word_examples_safe('té', '[
  {"spanish": "Prefiero té verde sin azúcar.", "russian": "Я предпочитаю зелёный чай без сахара."},
  {"spanish": "¿Quieres una taza de té?", "russian": "Хочешь чашку чая?"}
]'::jsonb);

SELECT add_word_examples_safe('arroz', '[
  {"spanish": "El arroz es la base de muchos platos.", "russian": "Рис - основа многих блюд."},
  {"spanish": "Me gusta el arroz con pollo.", "russian": "Мне нравится рис с курицей."}
]'::jsonb);

SELECT add_word_examples_safe('carne', '[
  {"spanish": "No como carne, soy vegetariano.", "russian": "Я не ем мясо, я вегетарианец."},
  {"spanish": "La carne está en el horno.", "russian": "Мясо в духовке."}
]'::jsonb);

SELECT add_word_examples_safe('pollo', '[
  {"spanish": "El pollo asado está delicioso.", "russian": "Жареная курица восхитительна."},
  {"spanish": "Compré pollo para la cena.", "russian": "Я купил курицу на ужин."}
]'::jsonb);

SELECT add_word_examples_safe('pescado', '[
  {"spanish": "El pescado fresco es más sabroso.", "russian": "Свежая рыба вкуснее."},
  {"spanish": "Como pescado dos veces por semana.", "russian": "Я ем рыбу два раза в неделю."}
]'::jsonb);

SELECT add_word_examples_safe('fruta', '[
  {"spanish": "La fruta es buena para la salud.", "russian": "Фрукты полезны для здоровья."},
  {"spanish": "Hay mucha fruta en el mercado.", "russian": "На рынке много фруктов."}
]'::jsonb);

SELECT add_word_examples_safe('verdura', '[
  {"spanish": "Las verduras son importantes en la dieta.", "russian": "Овощи важны в рационе."},
  {"spanish": "Compro verduras frescas cada día.", "russian": "Я покупаю свежие овощи каждый день."}
]'::jsonb);

-- Common verbs
SELECT add_word_examples_safe('comer', '[
  {"spanish": "Vamos a comer juntos.", "russian": "Давай поедим вместе."},
  {"spanish": "Me gusta comer temprano.", "russian": "Мне нравится есть рано."}
]'::jsonb);

SELECT add_word_examples_safe('beber', '[
  {"spanish": "Debes beber más agua.", "russian": "Тебе нужно пить больше воды."},
  {"spanish": "No puedo beber alcohol.", "russian": "Я не могу пить алкоголь."}
]'::jsonb);

SELECT add_word_examples_safe('hablar', '[
  {"spanish": "Necesito hablar contigo.", "russian": "Мне нужно поговорить с тобой."},
  {"spanish": "Ella habla tres idiomas.", "russian": "Она говорит на трёх языках."}
]'::jsonb);

SELECT add_word_examples_safe('escuchar', '[
  {"spanish": "Me gusta escuchar música.", "russian": "Мне нравится слушать музыку."},
  {"spanish": "Debes escuchar con atención.", "russian": "Ты должен слушать внимательно."}
]'::jsonb);

SELECT add_word_examples_safe('leer', '[
  {"spanish": "Leo el periódico cada mañana.", "russian": "Я читаю газету каждое утро."},
  {"spanish": "A ella le encanta leer novelas.", "russian": "Она обожает читать романы."}
]'::jsonb);

SELECT add_word_examples_safe('escribir', '[
  {"spanish": "Voy a escribir una carta.", "russian": "Я собираюсь написать письмо."},
  {"spanish": "Él escribe muy bien.", "russian": "Он очень хорошо пишет."}
]'::jsonb);

SELECT add_word_examples_safe('estudiar', '[
  {"spanish": "Estudio español todos los días.", "russian": "Я изучаю испанский каждый день."},
  {"spanish": "Necesitas estudiar más.", "russian": "Тебе нужно больше учиться."}
]'::jsonb);

SELECT add_word_examples_safe('trabajar', '[
  {"spanish": "Trabajo de lunes a viernes.", "russian": "Я работаю с понедельника по пятницу."},
  {"spanish": "Me gusta trabajar en equipo.", "russian": "Мне нравится работать в команде."}
]'::jsonb);

SELECT add_word_examples_safe('dormir', '[
  {"spanish": "Necesito dormir ocho horas.", "russian": "Мне нужно спать восемь часов."},
  {"spanish": "El bebé está durmiendo.", "russian": "Ребёнок спит."}
]'::jsonb);

SELECT add_word_examples_safe('caminar', '[
  {"spanish": "Me gusta caminar por el parque.", "russian": "Мне нравится гулять по парку."},
  {"spanish": "Camino 30 minutos cada día.", "russian": "Я хожу пешком 30 минут каждый день."}
]'::jsonb);

-- Numbers and time
SELECT add_word_examples_safe('uno', '[
  {"spanish": "Solo tengo uno.", "russian": "У меня есть только один."},
  {"spanish": "Uno más uno son dos.", "russian": "Один плюс один равно два."}
]'::jsonb);

SELECT add_word_examples_safe('dos', '[
  {"spanish": "Tengo dos hermanos.", "russian": "У меня два брата."},
  {"spanish": "Necesito dos horas más.", "russian": "Мне нужно ещё два часа."}
]'::jsonb);

SELECT add_word_examples_safe('tres', '[
  {"spanish": "Hay tres libros en la mesa.", "russian": "На столе три книги."},
  {"spanish": "Llegó hace tres días.", "russian": "Он приехал три дня назад."}
]'::jsonb);

SELECT add_word_examples_safe('hora', '[
  {"spanish": "¿Qué hora es?", "russian": "Который час?"},
  {"spanish": "La clase dura una hora.", "russian": "Урок длится один час."}
]'::jsonb);

SELECT add_word_examples_safe('minuto', '[
  {"spanish": "Espera un minuto, por favor.", "russian": "Подожди минуту, пожалуйста."},
  {"spanish": "Llegó hace cinco minutos.", "russian": "Он пришёл пять минут назад."}
]'::jsonb);

SELECT add_word_examples_safe('día', '[
  {"spanish": "Hoy es un día hermoso.", "russian": "Сегодня прекрасный день."},
  {"spanish": "Trabajo todos los días.", "russian": "Я работаю каждый день."}
]'::jsonb);

SELECT add_word_examples_safe('semana', '[
  {"spanish": "La semana tiene siete días.", "russian": "В неделе семь дней."},
  {"spanish": "Nos vemos la próxima semana.", "russian": "Увидимся на следующей неделе."}
]'::jsonb);

SELECT add_word_examples_safe('mes', '[
  {"spanish": "Este mes es mi cumpleaños.", "russian": "В этом месяце мой день рождения."},
  {"spanish": "Pago el alquiler cada mes.", "russian": "Я плачу за квартиру каждый месяц."}
]'::jsonb);

SELECT add_word_examples_safe('año', '[
  {"spanish": "El año tiene doce meses.", "russian": "В году двенадцать месяцев."},
  {"spanish": "Este año viajo a España.", "russian": "В этом году я еду в Испанию."}
]'::jsonb);

-- Common adjectives
SELECT add_word_examples_safe('bueno', '[
  {"spanish": "Es un buen amigo.", "russian": "Он хороший друг."},
  {"spanish": "La comida está muy buena.", "russian": "Еда очень хорошая."}
]'::jsonb);

SELECT add_word_examples_safe('malo', '[
  {"spanish": "Tengo malas noticias.", "russian": "У меня плохие новости."},
  {"spanish": "El tiempo está malo hoy.", "russian": "Сегодня плохая погода."}
]'::jsonb);

SELECT add_word_examples_safe('grande', '[
  {"spanish": "Vive en una casa grande.", "russian": "Он живёт в большом доме."},
  {"spanish": "Es un problema muy grande.", "russian": "Это очень большая проблема."}
]'::jsonb);

SELECT add_word_examples_safe('pequeño', '[
  {"spanish": "Tengo un perro pequeño.", "russian": "У меня маленькая собака."},
  {"spanish": "Es un mundo pequeño.", "russian": "Мир тесен."}
]'::jsonb);

SELECT add_word_examples_safe('nuevo', '[
  {"spanish": "Compré un coche nuevo.", "russian": "Я купил новую машину."},
  {"spanish": "Es mi nuevo trabajo.", "russian": "Это моя новая работа."}
]'::jsonb);

SELECT add_word_examples_safe('viejo', '[
  {"spanish": "Mi abuelo es muy viejo.", "russian": "Мой дедушка очень старый."},
  {"spanish": "Este libro es viejo pero valioso.", "russian": "Эта книга старая, но ценная."}
]'::jsonb);

SELECT add_word_examples_safe('joven', '[
  {"spanish": "Es demasiado joven para trabajar.", "russian": "Он слишком молод для работы."},
  {"spanish": "Los jóvenes tienen mucha energía.", "russian": "У молодых много энергии."}
]'::jsonb);

SELECT add_word_examples_safe('feliz', '[
  {"spanish": "Estoy muy feliz hoy.", "russian": "Я очень счастлив сегодня."},
  {"spanish": "Te deseo un feliz cumpleaños.", "russian": "Желаю тебе счастливого дня рождения."}
]'::jsonb);

SELECT add_word_examples_safe('triste', '[
  {"spanish": "Está triste porque perdió.", "russian": "Он грустный, потому что проиграл."},
  {"spanish": "Es una historia muy triste.", "russian": "Это очень грустная история."}
]'::jsonb);

-- Common places
SELECT add_word_examples_safe('tienda', '[
  {"spanish": "Voy a la tienda a comprar pan.", "russian": "Я иду в магазин купить хлеб."},
  {"spanish": "La tienda cierra a las ocho.", "russian": "Магазин закрывается в восемь."}
]'::jsonb);

SELECT add_word_examples_safe('mercado', '[
  {"spanish": "El mercado tiene frutas frescas.", "russian": "На рынке есть свежие фрукты."},
  {"spanish": "Vamos al mercado los sábados.", "russian": "Мы ходим на рынок по субботам."}
]'::jsonb);

SELECT add_word_examples_safe('hospital', '[
  {"spanish": "Mi madre trabaja en el hospital.", "russian": "Моя мама работает в больнице."},
  {"spanish": "El hospital está cerca de aquí.", "russian": "Больница находится недалеко отсюда."}
]'::jsonb);

SELECT add_word_examples_safe('banco', '[
  {"spanish": "Necesito ir al banco.", "russian": "Мне нужно пойти в банк."},
  {"spanish": "El banco abre a las nueve.", "russian": "Банк открывается в девять."}
]'::jsonb);

SELECT add_word_examples_safe('parque', '[
  {"spanish": "Los niños juegan en el parque.", "russian": "Дети играют в парке."},
  {"spanish": "Hay un parque hermoso cerca.", "russian": "Рядом есть красивый парк."}
]'::jsonb);

SELECT add_word_examples_safe('playa', '[
  {"spanish": "Vamos a la playa en verano.", "russian": "Летом мы ходим на пляж."},
  {"spanish": "La playa está muy limpia.", "russian": "Пляж очень чистый."}
]'::jsonb);

SELECT add_word_examples_safe('aeropuerto', '[
  {"spanish": "El aeropuerto está lejos de la ciudad.", "russian": "Аэропорт далеко от города."},
  {"spanish": "Llegamos al aeropuerto temprano.", "russian": "Мы приехали в аэропорт рано."}
]'::jsonb);

SELECT add_word_examples_safe('estación', '[
  {"spanish": "La estación de tren está cerrada.", "russian": "Железнодорожная станция закрыта."},
  {"spanish": "Te espero en la estación.", "russian": "Я жду тебя на станции."}
]'::jsonb);

-- Body parts
SELECT add_word_examples_safe('cabeza', '[
  {"spanish": "Me duele la cabeza.", "russian": "У меня болит голова."},
  {"spanish": "Usa la cabeza para pensar.", "russian": "Используй голову, чтобы думать."}
]'::jsonb);

SELECT add_word_examples_safe('mano', '[
  {"spanish": "Dame la mano.", "russian": "Дай мне руку."},
  {"spanish": "Tengo las manos frías.", "russian": "У меня холодные руки."}
]'::jsonb);

SELECT add_word_examples_safe('pie', '[
  {"spanish": "Me duele el pie derecho.", "russian": "У меня болит правая нога."},
  {"spanish": "Vamos a pie al trabajo.", "russian": "Мы идём на работу пешком."}
]'::jsonb);

SELECT add_word_examples_safe('ojo', '[
  {"spanish": "Tiene los ojos azules.", "russian": "У него голубые глаза."},
  {"spanish": "Cierra los ojos.", "russian": "Закрой глаза."}
]'::jsonb);

SELECT add_word_examples_safe('oído', '[
  {"spanish": "Tengo buen oído para la música.", "russian": "У меня хороший слух для музыки."},
  {"spanish": "Me duele el oído.", "russian": "У меня болит ухо."}
]'::jsonb);

SELECT add_word_examples_safe('boca', '[
  {"spanish": "Abre la boca.", "russian": "Открой рот."},
  {"spanish": "Tiene una boca grande.", "russian": "У него большой рот."}
]'::jsonb);

SELECT add_word_examples_safe('nariz', '[
  {"spanish": "Tiene la nariz roja.", "russian": "У него красный нос."},
  {"spanish": "Me sangra la nariz.", "russian": "У меня идёт кровь из носа."}
]'::jsonb);

-- Colors
SELECT add_word_examples_safe('rojo', '[
  {"spanish": "El coche rojo es mío.", "russian": "Красная машина моя."},
  {"spanish": "Me gusta el color rojo.", "russian": "Мне нравится красный цвет."}
]'::jsonb);

SELECT add_word_examples_safe('azul', '[
  {"spanish": "El cielo está azul.", "russian": "Небо голубое."},
  {"spanish": "Lleva una camisa azul.", "russian": "Он носит синюю рубашку."}
]'::jsonb);

SELECT add_word_examples_safe('verde', '[
  {"spanish": "La hierba es verde.", "russian": "Трава зелёная."},
  {"spanish": "Prefiero el té verde.", "russian": "Я предпочитаю зелёный чай."}
]'::jsonb);

SELECT add_word_examples_safe('amarillo', '[
  {"spanish": "El sol es amarillo.", "russian": "Солнце жёлтое."},
  {"spanish": "Me gustan las flores amarillas.", "russian": "Мне нравятся жёлтые цветы."}
]'::jsonb);

SELECT add_word_examples_safe('blanco', '[
  {"spanish": "La nieve es blanca.", "russian": "Снег белый."},
  {"spanish": "Lleva un vestido blanco.", "russian": "Она носит белое платье."}
]'::jsonb);

SELECT add_word_examples_safe('negro', '[
  {"spanish": "El café es negro.", "russian": "Кофе чёрный."},
  {"spanish": "Tengo un gato negro.", "russian": "У меня чёрный кот."}
]'::jsonb);

-- Weather
SELECT add_word_examples_safe('sol', '[
  {"spanish": "Hace mucho sol hoy.", "russian": "Сегодня очень солнечно."},
  {"spanish": "El sol sale por el este.", "russian": "Солнце встаёт на востоке."}
]'::jsonb);

SELECT add_word_examples_safe('lluvia', '[
  {"spanish": "La lluvia es buena para las plantas.", "russian": "Дождь полезен для растений."},
  {"spanish": "No me gusta la lluvia.", "russian": "Мне не нравится дождь."}
]'::jsonb);

SELECT add_word_examples_safe('nieve', '[
  {"spanish": "La nieve cubre las montañas.", "russian": "Снег покрывает горы."},
  {"spanish": "Los niños juegan con la nieve.", "russian": "Дети играют со снегом."}
]'::jsonb);

SELECT add_word_examples_safe('viento', '[
  {"spanish": "Hay mucho viento hoy.", "russian": "Сегодня очень ветрено."},
  {"spanish": "El viento mueve las hojas.", "russian": "Ветер шевелит листья."}
]'::jsonb);

SELECT add_word_examples_safe('frío', '[
  {"spanish": "Hace mucho frío en invierno.", "russian": "Зимой очень холодно."},
  {"spanish": "Tengo frío, necesito un abrigo.", "russian": "Мне холодно, мне нужно пальто."}
]'::jsonb);

SELECT add_word_examples_safe('calor', '[
  {"spanish": "En verano hace mucho calor.", "russian": "Летом очень жарко."},
  {"spanish": "No soporto el calor.", "russian": "Я не переношу жару."}
]'::jsonb);

-- Transportation
SELECT add_word_examples_safe('coche', '[
  {"spanish": "Mi coche es nuevo.", "russian": "Моя машина новая."},
  {"spanish": "Voy al trabajo en coche.", "russian": "Я езжу на работу на машине."}
]'::jsonb);

SELECT add_word_examples_safe('autobús', '[
  {"spanish": "El autobús llega en cinco minutos.", "russian": "Автобус придёт через пять минут."},
  {"spanish": "Tomo el autobús todos los días.", "russian": "Я езжу на автобусе каждый день."}
]'::jsonb);

SELECT add_word_examples_safe('tren', '[
  {"spanish": "El tren sale a las ocho.", "russian": "Поезд отправляется в восемь."},
  {"spanish": "Prefiero viajar en tren.", "russian": "Я предпочитаю путешествовать на поезде."}
]'::jsonb);

SELECT add_word_examples_safe('avión', '[
  {"spanish": "El avión despega en una hora.", "russian": "Самолёт взлетает через час."},
  {"spanish": "Tengo miedo de volar en avión.", "russian": "Я боюсь летать на самолёте."}
]'::jsonb);

SELECT add_word_examples_safe('bicicleta', '[
  {"spanish": "Voy a la escuela en bicicleta.", "russian": "Я езжу в школу на велосипеде."},
  {"spanish": "Mi bicicleta es roja.", "russian": "Мой велосипед красный."}
]'::jsonb);

-- Drop the temporary function
DROP FUNCTION IF EXISTS add_word_examples_safe(TEXT, JSONB);

-- Query to check words without examples after migration
DO $$
DECLARE
  words_without_examples INTEGER;
BEGIN
  SELECT COUNT(DISTINCT w.id) INTO words_without_examples
  FROM words w
  LEFT JOIN word_examples we ON w.id = we.word_id
  WHERE we.id IS NULL;
  
  RAISE NOTICE 'Words without examples after migration: %', words_without_examples;
END $$;