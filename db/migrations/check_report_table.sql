-- Check if the reports table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    report_date DATE NOT NULL,
    total_time INTEGER NOT NULL DEFAULT 0,
    completed_tasks INTEGER NOT NULL DEFAULT 0,
    points_earned INTEGER NOT NULL DEFAULT 0,
    task_size_breakdown JSONB,
    time_distribution JSONB,
    completion_time_averages JSONB,
    monthly_points JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_report_date UNIQUE (user_id, report_date)
);

-- Add any missing columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'task_size_breakdown') THEN
        ALTER TABLE reports ADD COLUMN task_size_breakdown JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'time_distribution') THEN
        ALTER TABLE reports ADD COLUMN time_distribution JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'completion_time_averages') THEN
        ALTER TABLE reports ADD COLUMN completion_time_averages JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'monthly_points') THEN
        ALTER TABLE reports ADD COLUMN monthly_points JSONB;
    END IF;
END $$;

-- Update the unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_report_date') THEN
        ALTER TABLE reports ADD CONSTRAINT unique_user_report_date UNIQUE (user_id, report_date);
    END IF;
END $$;

