-- Add context field to goal_points table
ALTER TABLE goal_points 
ADD COLUMN context VARCHAR(50) NOT NULL DEFAULT 'general';

-- Create an index for faster queries by context
CREATE INDEX idx_goal_points_context ON goal_points(context);

-- Add comment for documentation
COMMENT ON COLUMN goal_points.context IS 'The context of the goal (general, sprint, etc.)';

