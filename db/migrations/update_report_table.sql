-- Update the Report table
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS task_size_breakdown JSONB,
ADD COLUMN IF NOT EXISTS time_distribution JSONB,
ADD COLUMN IF NOT EXISTS completion_time_averages JSONB,
ADD COLUMN IF NOT EXISTS monthly_points JSONB;

-- Rename total_time_spent to total_time if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'reports' AND column_name = 'total_time_spent') THEN
        ALTER TABLE reports RENAME COLUMN total_time_spent TO total_time;
    END IF;
END $$;

-- Ensure all necessary columns exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' AND column_name = 'total_time') THEN
        ALTER TABLE reports ADD COLUMN total_time INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' AND column_name = 'completed_tasks') THEN
        ALTER TABLE reports ADD COLUMN completed_tasks INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' AND column_name = 'points_earned') THEN
        ALTER TABLE reports ADD COLUMN points_earned INTEGER;
    END IF;
END $$;

