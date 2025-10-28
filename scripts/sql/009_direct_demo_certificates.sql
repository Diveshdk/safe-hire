-- Direct SQL Demo Setup (Bypasses Email Confirmation)
-- This script manually creates demo certificates that can be used for testing

-- Insert demo certificates directly into the database
-- These will work with any job seeker account for testing NFT verification

INSERT INTO nft_certificates (
  id,
  institution_id,
  certificate_name,
  certificate_type,
  recipient_name,
  nft_code,
  description,
  issue_date,
  expiry_date,
  metadata,
  is_active,
  created_at,
  updated_at
) VALUES 
-- Bachelor's Degree
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001', -- Placeholder institution ID
  'Bachelor of Science in Computer Science',
  'academic',
  'John Doe',
  'MIT2024CS001',
  'Bachelor of Science degree in Computer Science with specialization in Artificial Intelligence and Machine Learning. Graduated Summa Cum Laude with GPA 3.9/4.0.',
  '2024-05-15',
  NULL,
  '{"gpa": "3.9", "honors": "Summa Cum Laude", "specialization": "AI/ML", "thesis": "Deep Learning Applications in Natural Language Processing"}',
  true,
  NOW(),
  NOW()
),
-- Master's Degree
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'Master of Science in Data Science',
  'academic',
  'Jane Smith',
  'MIT2024DS002',
  'Master of Science degree in Data Science with thesis on "Predictive Analytics for Healthcare Applications". Graduate Research Assistant.',
  '2023-12-20',
  NULL,
  '{"gpa": "3.95", "thesis": "Predictive Analytics for Healthcare", "role": "Graduate Research Assistant", "publications": 2}',
  true,
  NOW(),
  NOW()
),
-- Professional Certificate
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'Professional Certificate in Machine Learning',
  'certification',
  'Alice Johnson',
  'MIT2024ML003',
  'Professional certificate program covering advanced machine learning techniques, deep learning, and practical applications in industry.',
  '2024-08-30',
  '2027-08-30',
  '{"duration": "6 months", "projects": 4, "grade": "A", "skills": ["TensorFlow", "PyTorch", "Scikit-learn", "MLOps"]}',
  true,
  NOW(),
  NOW()
),
-- Course Completion
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'Advanced Artificial Intelligence Course',
  'course',
  'Bob Wilson',
  'MIT2024AI004',
  'Completed advanced course in Artificial Intelligence covering search algorithms, machine learning, neural networks, and knowledge representation.',
  '2024-05-10',
  NULL,
  '{"grade": "A+", "final_project": "Natural Language Question Answering System", "professor": "Prof. AI Expert"}',
  true,
  NOW(),
  NOW()
),
-- Competition Winner
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'Innovation Competition Winner',
  'competition',
  'Charlie Brown',
  'MIT2024IC005',
  'First place winner in the annual Innovation Competition with IoT solution for smart city infrastructure.',
  '2024-04-20',
  NULL,
  '{"position": "1st Place", "prize": "$25,000", "category": "Smart Cities", "team_size": 4, "judges_score": "95/100"}',
  true,
  NOW(),
  NOW()
),
-- PhD Degree
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'Doctor of Philosophy in Computer Science',
  'academic',
  'Diana Prince',
  'MIT2024PHD006',
  'PhD in Computer Science with dissertation on "Quantum Algorithms for Machine Learning". Published 8 papers in top-tier conferences.',
  '2024-06-01',
  NULL,
  '{"dissertation": "Quantum Algorithms for Machine Learning", "advisor": "Prof. Quantum Expert", "publications": 8, "awards": ["Best Thesis Award", "Research Excellence Award"]}',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (nft_code) DO NOTHING;

-- Display the created certificates
SELECT 
  certificate_name as "Certificate",
  recipient_name as "Recipient", 
  nft_code as "NFT Code",
  certificate_type as "Type",
  issue_date as "Issue Date"
FROM nft_certificates 
WHERE nft_code LIKE 'MIT2024%'
ORDER BY issue_date DESC;

-- Instructions for testing:
-- 1. Run this SQL script in your Supabase SQL editor or psql
-- 2. Create a job seeker account normally (with your email)
-- 3. In academic verification form, use:
--    - Name: "John Doe" + NFT Code: "MIT2024CS001" = ✅ Instant verification
--    - Name: "Jane Smith" + NFT Code: "MIT2024DS002" = ✅ Instant verification  
--    - Name: "Wrong Name" + NFT Code: "MIT2024CS001" = ❌ Name mismatch error
--    - No NFT Code = Regular verification process
