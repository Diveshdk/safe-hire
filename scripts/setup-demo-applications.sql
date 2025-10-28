-- Quick setup script for demo applications
-- Run this in your Supabase SQL editor or database

-- First, let's see what we have
SELECT 'Profiles' as table_name, count(*) as count FROM profiles
UNION ALL
SELECT 'Companies', count(*) FROM companies  
UNION ALL
SELECT 'Jobs', count(*) FROM jobs
UNION ALL
SELECT 'Applications', count(*) FROM applications;

-- Create a demo recruiter if doesn't exist
DO $$
DECLARE
    demo_user_id UUID;
    demo_company_id UUID;
    demo_job_id UUID;
    demo_applicant_id UUID;
BEGIN
    -- Insert demo recruiter profile
    INSERT INTO profiles (user_id, role, full_name, email, aadhaar_verified, safe_hire_id)
    VALUES (
        gen_random_uuid(),
        'recruiter',
        'Demo Recruiter',
        'recruiter@demo.com',
        true,
        'SH-REC-' || LPAD(floor(random() * 100000)::text, 5, '0')
    )
    ON CONFLICT (user_id) DO NOTHING
    RETURNING user_id INTO demo_user_id;

    -- Get or create company
    INSERT INTO companies (id, name, owner_user_id, verification_status, industry, description)
    VALUES (
        gen_random_uuid(),
        'Demo Tech Company',
        demo_user_id,
        'verified',
        'Technology',
        'A demo technology company for testing'
    ) 
    ON CONFLICT DO NOTHING
    RETURNING id INTO demo_company_id;

    -- Create demo job
    INSERT INTO jobs (id, title, company_id, description, requirements, salary_min, salary_max, location, employment_type, status)
    VALUES (
        gen_random_uuid(),
        'Software Engineer',
        demo_company_id,
        'Join our team as a software engineer',
        'Experience with React, Node.js, TypeScript',
        80000,
        120000,
        'San Francisco, CA',
        'full_time',
        'open'
    )
    RETURNING id INTO demo_job_id;

    -- Create demo job seeker
    INSERT INTO profiles (user_id, role, full_name, email, aadhaar_verified, safe_hire_id)
    VALUES (
        gen_random_uuid(),
        'job_seeker', 
        'Demo Job Seeker',
        'jobseeker@demo.com',
        true,
        'SH-JS-' || LPAD(floor(random() * 100000)::text, 5, '0')
    )
    RETURNING user_id INTO demo_applicant_id;

    -- Create demo application
    INSERT INTO applications (job_id, applicant_id, company_id, status, cover_letter, resume_text)
    VALUES (
        demo_job_id,
        demo_applicant_id,
        demo_company_id,
        'pending',
        'I am very interested in this software engineer position and have relevant experience.',
        'https://mock-storage.com/documents/resume_demo.pdf'
    );

    RAISE NOTICE 'Demo data created successfully!';
END $$;
