-- Drop existing view if exists
DROP VIEW IF EXISTS words_with_examples;

-- Create view with level code
CREATE OR REPLACE VIEW words_with_examples AS
SELECT 
    w.id,
    w.spanish,
    w.russian,
    w.pronunciation,
    w.level_id,
    w.theme_id,
    w.is_user_generated,
    w.created_by,
    w.created_at,
    l.code as level_code,
    l.name as level_name,
    COALESCE(
        json_agg(
            CASE 
                WHEN we.id IS NOT NULL THEN
                    json_build_object(
                        'id', we.id,
                        'spanish', we.example_spanish,
                        'russian', we.example_russian,
                        'order', we.order_index
                    )
                ELSE NULL
            END
        ) FILTER (WHERE we.id IS NOT NULL), 
        '[]'::json
    ) as examples
FROM words w
LEFT JOIN levels l ON w.level_id = l.id
LEFT JOIN word_examples we ON w.id = we.word_id
GROUP BY w.id, l.code, l.name;