-- Create demo institution account with login credentials
-- This script creates a demo institution user that you can login with

-- First, let's create a demo institution user in auth.users
-- Note: In a real Supabase setup, you would use the Supabase Auth API or dashboard
-- This is a simulation of what the account would look like

-- Demo Institution Login Credentials:
-- Email: demo-university@safehire.com
-- Password: DemoUniversity123!

-- The actual user creation needs to be done through Supabase Auth API
-- But we can prepare the profile and certificates for when the user is created

-- Insert demo institution profile (this will be linked to the auth user)
-- You'll need to replace the user_id with the actual UUID from auth.users after creating the account

DO $$
DECLARE
    demo_user_id UUID := '11111111-1111-1111-1111-111111111111'; -- Placeholder ID
BEGIN
    -- Insert demo institution profile
    INSERT INTO profiles (
        user_id,
        email,
        role,
        institution_name,
        institution_type,
        aadhaar_verified,
        created_at,
        updated_at
    ) VALUES (
        demo_user_id,
        'demo-university@safehire.com',
        'institution',
        'MIT Demo University',
        'University',
        true, -- Skip Aadhaar verification for demo
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        role = EXCLUDED.role,
        institution_name = EXCLUDED.institution_name,
        institution_type = EXCLUDED.institution_type,
        aadhaar_verified = EXCLUDED.aadhaar_verified;

    -- Insert demo certificates for this institution
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
    (
        demo_user_id,
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
        demo_user_id,
        'Master of Science in Data Science',
        'academic',
        'Jane Smith',
        'MIT2024DS002',
        'Master of Science degree in Data Science with thesis on "Predictive Analytics for Healthcare Applications". Graduate Research Assistant.',
        '2023-12-20',
        NULL,
        '{"gpa": "3.95", "thesis": "Predictive Analytics for Healthcare", "role": "Graduate Research Assistant", "publications": 2}',
        true
    ),
    (
        demo_user_id,
        'Professional Certificate in Machine Learning',
        'certification',
        'Alice Johnson',
        'MIT2024ML003',
        'Professional certificate program covering advanced machine learning techniques, deep learning, and practical applications in industry.',
        '2024-08-30',
        '2027-08-30',
        '{"duration": "6 months", "projects": 4, "grade": "A", "skills": ["TensorFlow", "PyTorch", "Scikit-learn", "MLOps"]}',
        true
    ),
    (
        demo_user_id,
        'Advanced Artificial Intelligence Course',
        'course',
        'Bob Wilson',
        'MIT2024AI004',
        'Completed advanced course in Artificial Intelligence covering search algorithms, machine learning, neural networks, and knowledge representation.',
        '2024-05-10',
        NULL,
        '{"grade": "A+", "final_project": "Natural Language Question Answering System", "professor": "Prof. AI Expert"}',
        true
    ),
    (
        demo_user_id,
        'Innovation Competition Winner',
        'competition',
        'Charlie Brown',
        'MIT2024IC005',
        'First place winner in the annual Innovation Competition with IoT solution for smart city infrastructure.',
        '2024-04-20',
        NULL,
        '{"position": "1st Place", "prize": "$25,000", "category": "Smart Cities", "team_size": 4, "judges_score": "95/100"}',
        true
    ),
    (
        demo_user_id,
        'Doctor of Philosophy in Computer Science',
        'academic',
        'Diana Prince',
        'MIT2024PHD006',
        'PhD in Computer Science with dissertation on "Quantum Algorithms for Machine Learning". Published 8 papers in top-tier conferences.',
        '2024-06-01',
        NULL,
        '{"dissertation": "Quantum Algorithms for Machine Learning", "advisor": "Prof. Quantum Expert", "publications": 8, "awards": ["Best Thesis Award", "Research Excellence Award"]}',
        true
    )
    ON CONFLICT (nft_code) DO NOTHING;

END $$;
