-- Create demo university credentials
-- First, we'll need to create a demo institution user and then add some sample certificates

-- Insert demo institution user (you'll need to replace this UUID with a real user ID from your auth.users table)
-- For now, let's create sample certificates that can be used by any institution

-- Demo certificates from MIT (Massachusetts Institute of Technology)
INSERT INTO nft_certificates (
  institution_id, 
  certificate_name, 
  certificate_type, 
  recipient_name, 
  nft_code, 
  description, 
  issue_date, 
  expiry_date, 
  metadata, 
  is_active
) VALUES 
-- Bachelor's Degrees
(
  '00000000-0000-0000-0000-000000000001', -- Demo institution ID
  'Bachelor of Science in Computer Science',
  'academic',
  'John Doe',
  'MIT2024CS001',
  'Bachelor of Science degree in Computer Science with specialization in Artificial Intelligence and Machine Learning. Graduated Summa Cum Laude with GPA 3.9/4.0.',
  '2024-05-15',
  NULL,
  '{"gpa": "3.9", "honors": "Summa Cum Laude", "specialization": "AI/ML", "thesis": "Deep Learning Applications in Natural Language Processing"}',
  true
),
(
  '00000000-0000-0000-0000-000000000001',
  'Bachelor of Science in Electrical Engineering',
  'academic',
  'Jane Smith',
  'MIT2024EE002',
  'Bachelor of Science degree in Electrical Engineering with focus on Robotics and Control Systems. Dean''s List for 6 semesters.',
  '2024-05-15',
  NULL,
  '{"gpa": "3.8", "honors": "Magna Cum Laude", "focus": "Robotics", "projects": ["Autonomous Drone Navigation", "Smart Grid Optimization"]}',
  true
),

-- Master's Degrees
(
  '00000000-0000-0000-0000-000000000001',
  'Master of Science in Data Science',
  'academic',
  'Alice Johnson',
  'MIT2023DS003',
  'Master of Science degree in Data Science with thesis on "Predictive Analytics for Healthcare Applications". Graduate Research Assistant.',
  '2023-12-20',
  NULL,
  '{"gpa": "3.95", "thesis": "Predictive Analytics for Healthcare", "role": "Graduate Research Assistant", "publications": 2}',
  true
),

-- Professional Certifications
(
  '00000000-0000-0000-0000-000000000001',
  'MIT Professional Certificate in Machine Learning',
  'certification',
  'Bob Wilson',
  'MIT2024ML004',
  'Professional certificate program covering advanced machine learning techniques, deep learning, and practical applications in industry.',
  '2024-08-30',
  '2027-08-30',
  '{"duration": "6 months", "projects": 4, "grade": "A", "skills": ["TensorFlow", "PyTorch", "Scikit-learn", "MLOps"]}',
  true
),

-- Course Completions
(
  '00000000-0000-0000-0000-000000000001',
  '6.034 Artificial Intelligence',
  'course',
  'Charlie Brown',
  'MIT2024AI005',
  'Completed advanced undergraduate course in Artificial Intelligence covering search algorithms, machine learning, neural networks, and knowledge representation.',
  '2024-05-10',
  NULL,
  '{"grade": "A+", "final_project": "Natural Language Question Answering System", "professor": "Prof. Patrick Winston"}',
  true
),

-- Competition/Achievement
(
  '00000000-0000-0000-0000-000000000001',
  'MIT Entrepreneurship Competition Winner',
  'competition',
  'Diana Prince',
  'MIT2024EC006',
  'First place winner in the annual MIT Entrepreneurship Competition with innovative IoT solution for smart city infrastructure.',
  '2024-04-20',
  NULL,
  '{"position": "1st Place", "prize": "$50,000", "category": "Smart Cities", "team_size": 4, "judges_score": "95/100"}',
  true
),

-- PhD
(
  '00000000-0000-0000-0000-000000000001',
  'Doctor of Philosophy in Computer Science',
  'academic',
  'Eva Rodriguez',
  'MIT2024PhD007',
  'PhD in Computer Science with dissertation on "Quantum Algorithms for Machine Learning". Published 12 papers in top-tier conferences.',
  '2024-06-01',
  NULL,
  '{"dissertation": "Quantum Algorithms for Machine Learning", "advisor": "Prof. Seth Lloyd", "publications": 12, "awards": ["Best Thesis Award", "Google PhD Fellowship"]}',
  true
);

-- Note: The institution_id used here is a placeholder. In a real scenario, you would:
-- 1. Create an actual institution user account through the sign-up process
-- 2. Use that user's actual UUID from auth.users table
-- 3. Or update these records with the correct institution_id after creating the account

-- Display the created certificates
SELECT 
  certificate_name,
  certificate_type,
  recipient_name,
  nft_code,
  issue_date,
  expiry_date,
  is_active
FROM nft_certificates 
WHERE institution_id = '00000000-0000-0000-0000-000000000001'
ORDER BY issue_date DESC;
