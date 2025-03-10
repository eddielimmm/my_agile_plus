CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    report_date DATE NOT NULL,
    total_time INTEGER,
    completed_tasks INTEGER,
    points_earned INTEGER,
    task_size_breakdown JSONB,
    time_distribution JSONB,
    completion_time_averages JSONB,
    monthly_points JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a unique constraint on user_id and report_date
ALTER TABLE reports ADD CONSTRAINT unique_user_report_date UNIQUE (user_id, report_date);

-- Create an index on user_id and report_date for faster lookups
CREATE INDEX IF NOT EXISTS idx_reports_user_date ON reports (user_id, report_date);

-- Add a foreign key constraint if you have a users table
-- ALTER TABLE reports ADD CONSTRAINT fk_reports_user FOREIGN KEY (user_id) REFERENCES users(id);

COMMENT ON TABLE reports IS 'Stores daily reports for user productivity and task completion';
COMMENT ON COLUMN reports.id IS 'Unique identifier for each report';
COMMENT ON COLUMN reports.user_id IS 'Foreign key to the users table';
COMMENT ON COLUMN reports.report_date IS 'Date of the report';
COMMENT ON COLUMN reports.total_time IS 'Total time spent on tasks for the day in seconds';
COMMENT ON COLUMN reports.completed_tasks IS 'Number of tasks completed for the day';
COMMENT ON COLUMN reports.points_earned IS 'Total points earned for the day';
COMMENT ON COLUMN reports.task_size_breakdown IS 'JSON object containing breakdown of tasks by size';
COMMENT ON COLUMN reports.time_distribution IS 'JSON object containing time spent on tasks by hour';
COMMENT ON COLUMN reports.completion_time_averages IS 'JSON object containing average completion times by task size';
COMMENT ON COLUMN reports.monthly_points IS 'JSON object containing points earned by day for the current month';
COMMENT ON COLUMN reports.created_at IS 'Timestamp when the report was created';
COMMENT ON COLUMN reports.updated_at IS 'Timestamp when the report was last updated';

