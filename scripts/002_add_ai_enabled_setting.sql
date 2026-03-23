-- Add aiEnabled column to user_settings table
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT true;
