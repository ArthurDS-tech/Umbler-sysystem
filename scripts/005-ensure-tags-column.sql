-- Ensure tags column exists in conversations table
-- This script safely adds the tags column if it doesn't exist

DO $$ 
BEGIN
    -- Check if tags column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE conversations ADD COLUMN tags TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added tags column to conversations table';
    ELSE
        RAISE NOTICE 'Tags column already exists in conversations table';
    END IF;
END $$;

-- Create index on tags column for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_tags ON conversations USING GIN(tags);

-- Verify the column was created
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'conversations' 
AND column_name = 'tags';
