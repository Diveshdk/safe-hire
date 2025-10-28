-- Create demo applications for testing
INSERT INTO applications (
  job_id,
  applicant_id,
  company_id,
  status,
  cover_letter,
  resume_text,
  applied_at
) VALUES (
  -- You'll need to replace these UUIDs with actual IDs from your database
  'b9bce5f2-e8f7-4933-a3cb-ba8dde977cf5', -- job_id
  (SELECT user_id FROM profiles WHERE role = 'job_seeker' LIMIT 1), -- applicant_id
  (SELECT id FROM companies LIMIT 1), -- company_id
  'pending',
  'I am very interested in this position and would love to contribute to your team.',
  'https://mock-storage.com/documents/resume_demo.pdf',
  NOW()
);
