-- Create AI suggestion dismissals table
-- Tracks dismissed suggestions to avoid re-surfacing them

CREATE TABLE IF NOT EXISTS ai_suggestion_dismissals (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  suggestion_type VARCHAR(50) NOT NULL,
  -- Values: 'missing_entry' | 'description_enhancement' | 'gap_audit'
  suggestion_hash VARCHAR(255) NOT NULL,
  -- Format: 'type:sourceId:date' for deduplication
  source_event_id VARCHAR(255),
  -- Google Calendar event ID if applicable
  dismissed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_ai_dismissals_user_org 
  ON ai_suggestion_dismissals(user_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_ai_dismissals_hash 
  ON ai_suggestion_dismissals(suggestion_hash);

CREATE INDEX IF NOT EXISTS idx_ai_dismissals_dismissed_at 
  ON ai_suggestion_dismissals(dismissed_at);
