-- Create out-of-office day markers
-- Tracks intentional no-work days per user within an organization

CREATE TABLE IF NOT EXISTS out_of_office_days (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  date_key VARCHAR(10) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS out_of_office_days_user_org_date_key_unique
  ON out_of_office_days(user_id, organization_id, date_key);

CREATE INDEX IF NOT EXISTS idx_out_of_office_days_user_org
  ON out_of_office_days(user_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_out_of_office_days_date_key
  ON out_of_office_days(date_key);
