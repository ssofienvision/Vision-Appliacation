-- Check the current structure of the jobs table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'jobs'
ORDER BY ordinal_position;

-- Check if jobs table has a primary key
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'jobs' 
    AND tc.constraint_type = 'PRIMARY KEY';

-- Check if jobs table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'jobs'
); 