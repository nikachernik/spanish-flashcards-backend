-- Migration to capitalize first letter of Spanish words
-- Only capitalizes the first letter of the first word in multi-word phrases

UPDATE words
SET spanish = 
  CASE
    -- If the word contains spaces (multi-word phrase)
    WHEN position(' ' in spanish) > 0 THEN
      -- Capitalize first letter of first word only
      upper(substring(spanish from 1 for 1)) || 
      lower(substring(spanish from 2 for position(' ' in spanish) - 1)) ||
      substring(spanish from position(' ' in spanish))
    -- Single word
    ELSE
      -- Capitalize first letter
      upper(substring(spanish from 1 for 1)) || lower(substring(spanish from 2))
  END
WHERE spanish IS NOT NULL;

-- Also update word_examples to ensure consistency
UPDATE word_examples
SET example_spanish = 
  CASE
    -- Keep the first letter as is (sentences should already start with capital)
    WHEN substring(example_spanish from 1 for 1) = upper(substring(example_spanish from 1 for 1)) THEN
      example_spanish
    -- Otherwise capitalize first letter
    ELSE
      upper(substring(example_spanish from 1 for 1)) || substring(example_spanish from 2)
  END
WHERE example_spanish IS NOT NULL;

-- Verify the changes
SELECT spanish, russian, level_id 
FROM words 
ORDER BY spanish 
LIMIT 20;