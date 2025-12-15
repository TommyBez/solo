-- Seed sample areas
INSERT INTO areas (name, description, color, expected_hours_per_week) VALUES
  ('Fractional CTO', 'Technical leadership and strategy consulting for startups', '#6366f1', 20),
  ('Mentorship', 'Coaching and mentoring developers and tech leads', '#10b981', 5),
  ('Solo Product Building', 'Building and launching my own products', '#f59e0b', 15);

-- Seed sample projects
INSERT INTO projects (area_id, name, description, status, expected_hours, deadline) VALUES
  (1, 'CTO for XY Agency', 'Leading tech strategy and team for XY Agency', 'active', 80, '2025-03-31'),
  (1, 'CTO for ABC Startup', 'Technical architecture and hiring for ABC', 'active', 60, '2025-06-30'),
  (2, 'Junior Dev Mentoring', 'Weekly sessions with junior developers', 'active', 20, NULL),
  (2, 'Tech Lead Coaching', 'Coaching tech leads on leadership skills', 'active', 10, NULL),
  (3, 'Tic Tac Toe Game', 'Building a multiplayer tic tac toe game', 'completed', 40, '2025-01-15'),
  (3, 'SaaS Boilerplate', 'Creating a reusable SaaS starter template', 'active', 100, '2025-04-30');

-- Seed sample time entries (past week)
INSERT INTO time_entries (project_id, description, start_time, end_time, duration_minutes) VALUES
  (1, 'Architecture review meeting', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days' + INTERVAL '2 hours', 120),
  (1, 'Code review and feedback', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '1.5 hours', 90),
  (2, 'Tech roadmap planning', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '3 hours', 180),
  (3, 'Mentoring session - React patterns', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days' + INTERVAL '1 hour', 60),
  (4, 'Leadership workshop prep', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days' + INTERVAL '45 minutes', 45),
  (6, 'Database schema design', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '2.5 hours', 150),
  (6, 'Auth system implementation', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '4 hours', 240),
  (1, 'Team standup and planning', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '1 hour', 60),
  (6, 'API endpoints development', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '3 hours', 180),
  (3, 'One-on-one mentoring call', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '1 hour', 60);
