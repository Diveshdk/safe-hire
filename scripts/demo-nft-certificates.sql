-- Demo NFT certificates for testing
-- Run this in your Supabase SQL Editor after setting up the main tables

-- First, create a demo institution user if it doesn't exist
-- You'll need to replace this with an actual institution user_id from your auth.users table
DO $$
DECLARE
    demo_institution_id UUID;
BEGIN
    -- Try to find an existing institution user, or use a placeholder
    SELECT user_id INTO demo_institution_id 
    FROM profiles 
    WHERE role = 'institution' 
    LIMIT 1;
    
    -- If no institution found, we'll create demo certificates anyway
    -- You can update the institution_id later
    IF demo_institution_id IS NULL THEN
        demo_institution_id := gen_random_uuid();
    END IF;

    -- Insert demo NFT certificates
    INSERT INTO nft_certificates (
        institution_id,
        certificate_name,
        certificate_type,
        recipient_name,
        nft_code,
        description,
        issue_date,
        metadata,
        is_active,
        is_claimed
    ) VALUES 
    (
        demo_institution_id,
        'Full Stack Web Development Bootcamp',
        'course',
        'Demo Student 1',
        'DEMO123ABC',
        'Comprehensive full-stack web development program covering React, Node.js, and databases',
        '2024-01-15',
        '{"skills": ["JavaScript", "React", "Node.js", "PostgreSQL", "Git"], "duration": "12 weeks", "grade": "A+"}',
        true,
        false
    ),
    (
        demo_institution_id,
        'Data Science Certification',
        'certification',
        'Demo Student 2', 
        'DATA456XYZ',
        'Advanced data science certification covering machine learning and analytics',
        '2024-02-20',
        '{"skills": ["Python", "Machine Learning", "Data Analysis", "SQL", "Statistics"], "duration": "16 weeks", "grade": "A"}',
        true,
        false
    ),
    (
        demo_institution_id,
        'Cybersecurity Fundamentals',
        'course',
        'Demo Student 3',
        'CYBER789DEF',
        'Foundational cybersecurity course covering network security and ethical hacking',
        '2024-03-10',
        '{"skills": ["Network Security", "Ethical Hacking", "Risk Assessment", "Incident Response"], "duration": "8 weeks", "grade": "B+"}',
        true,
        false
    ),
    (
        demo_institution_id,
        'Mobile App Development',
        'bootcamp',
        'Demo Student 4',
        'MOBILE321GHI',
        'Comprehensive mobile app development using React Native and Flutter',
        '2024-04-05',
        '{"skills": ["React Native", "Flutter", "Mobile UI/UX", "App Store Deployment"], "duration": "10 weeks", "grade": "A-"}',
        true,
        false
    ),
    (
        demo_institution_id,
        'Cloud Computing Certification',
        'certification',
        'Available Certificate',
        'CLOUD555JKL',
        'AWS and cloud computing certification program',
        '2024-05-15',
        '{"skills": ["AWS", "Cloud Architecture", "DevOps", "Docker", "Kubernetes"], "duration": "14 weeks", "grade": "A+"}',
        true,
        false
    )
    ON CONFLICT (nft_code) DO NOTHING;

    RAISE NOTICE 'Demo NFT certificates created successfully!';
    RAISE NOTICE 'Test NFT Codes: DEMO123ABC, DATA456XYZ, CYBER789DEF, MOBILE321GHI, CLOUD555JKL';
END $$;
