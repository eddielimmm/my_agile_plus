-- Add tasks column to sprints table
ALTER TABLE sprints
ADD COLUMN IF NOT EXISTS tasks TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN sprints.tasks IS 'Array of task IDs associated with this sprint';

