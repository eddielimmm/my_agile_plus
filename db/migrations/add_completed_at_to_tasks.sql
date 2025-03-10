-- Add completed_at column to tasks table
ALTER TABLE tasks
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;

-- Add an index for faster queries
CREATE INDEX idx_tasks_completed_at ON tasks(completed_at);

-- Add a comment for documentation
COMMENT ON COLUMN tasks.completed_at IS 'Timestamp when the task was marked as completed';

