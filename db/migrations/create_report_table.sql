-- Create the Report table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    total_time_spent INTEGER NOT NULL,
    completed_tasks INTEGER NOT NULL,
    points_earned INTEGER NOT NULL,
    task_size_breakdown JSONB,
    time_distribution JSONB,
    completion_time_averages JSONB,
    monthly_points JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on user_id and report_date for faster queries
CREATE INDEX idx_reports_user_date ON reports(user_id, report_date);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_report_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_report_timestamp
BEFORE UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION update_report_timestamp();

