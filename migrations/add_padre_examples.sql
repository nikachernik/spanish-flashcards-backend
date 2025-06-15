-- Migration to add examples for the word "padre"

-- Find the word and add examples
DO $$
DECLARE
  v_word_id INTEGER;
BEGIN
  -- Find the word "padre"
  SELECT id INTO v_word_id 
  FROM words 
  WHERE LOWER(spanish) = 'padre'
  LIMIT 1;
  
  -- If word exists and doesn't have examples yet
  IF v_word_id IS NOT NULL THEN
    -- Check if examples already exist
    IF NOT EXISTS (SELECT 1 FROM word_examples WHERE word_id = v_word_id) THEN
      -- Add examples
      INSERT INTO word_examples (word_id, example_spanish, example_russian, order_index) VALUES
      (v_word_id, 'Mi padre trabaja en una oficina.', 'Мой отец работает в офисе.', 0),
      (v_word_id, 'El padre de Juan es médico.', 'Отец Хуана - врач.', 1);
      
      RAISE NOTICE 'Examples added for "padre" (ID: %)', v_word_id;
    ELSE
      RAISE NOTICE 'Examples already exist for "padre"';
    END IF;
  ELSE
    RAISE NOTICE 'Word "padre" not found in database';
  END IF;
END $$;

-- Verify the examples were added
SELECT 
    w.id,
    w.spanish,
    w.russian,
    we.example_spanish,
    we.example_russian,
    we.order_index
FROM words w
LEFT JOIN word_examples we ON w.id = we.word_id
WHERE LOWER(w.spanish) = 'padre'
ORDER BY we.order_index;