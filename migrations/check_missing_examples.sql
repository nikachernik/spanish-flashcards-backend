-- Query to find all words without examples with more details
SELECT 
    w.id,
    w.spanish,
    w.russian,
    w.pronunciation,
    l.code as level,
    w.created_at,
    w.is_user_generated,
    CASE 
        WHEN we.word_id IS NULL THEN 'NO EXAMPLES ❌'
        ELSE 'Has examples ✓'
    END as example_status
FROM words w
LEFT JOIN levels l ON w.level_id = l.id
LEFT JOIN word_examples we ON w.id = we.word_id
WHERE we.word_id IS NULL
ORDER BY w.created_at DESC, l.code, w.spanish;

-- Count by level
SELECT 
    l.code as level,
    COUNT(DISTINCT w.id) as words_without_examples
FROM words w
LEFT JOIN levels l ON w.level_id = l.id
LEFT JOIN word_examples we ON w.id = we.word_id
WHERE we.word_id IS NULL
GROUP BY l.code
ORDER BY l.code;

-- Total count
SELECT COUNT(DISTINCT w.id) as total_words_without_examples
FROM words w
LEFT JOIN word_examples we ON w.id = we.word_id
WHERE we.word_id IS NULL;