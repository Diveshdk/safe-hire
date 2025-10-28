-- DEMO INSTITUTION SETUP
-- This creates a working demo institution account with login credentials
-- Run this in your Supabase SQL editor

-- Step 1: Create demo institution user in auth.users
-- Note: You'll need to run this in Supabase Dashboard -> Authentication -> Users
-- Click "Add user" and create:
-- Email: demo-university@safehire.com
-- Password: DemoUniversity123!
-- Email Confirm: true
-- Then copy the user ID and replace it below

-- Step 2: After creating the auth user, run this SQL with the actual user ID:

DO $$
DECLARE
    demo_user_id UUID := 'YOUR_ACTUAL_USER_ID_HERE'; -- Replace with actual user ID from auth.users
BEGIN
    -- Insert institution profile
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
        true,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        role = EXCLUDED.role,
        institution_name = EXCLUDED.institution_name,
        institution_type = EXCLUDED.institution_type,
        aadhaar_verified = EXCLUDED.aadhaar_verified;

    -- Create demo hackathon event
    INSERT INTO institution_events (
        institution_id,
        event_name,
        event_type,
        description,
        event_date,
        location,
        max_participants,
        current_participants,
        status,
        metadata
    ) VALUES (
        demo_user_id,
        'MIT AI Hackathon 2024',
        'hackathon',
        '48-hour AI/ML hackathon with prizes for innovative solutions in healthcare, education, and sustainability.',
        '2024-03-15',
        'MIT Campus, Boston',
        100,
        85,
        'completed',
        '{"prizes": {"1st": "$10000", "2nd": "$5000", "3rd": "$2000"}, "themes": ["Healthcare AI", "EdTech", "Sustainability"]}'
    );

    -- Create demo competition event  
    INSERT INTO institution_events (
        institution_id,
        event_name,
        event_type,
        description,
        event_date,
        location,
        max_participants,
        current_participants,
        status,
        metadata
    ) VALUES (
        demo_user_id,
        'Data Science Championship 2024',
        'competition',
        'Annual data science competition with real-world datasets and industry challenges.',
        '2024-04-20',
        'Online',
        200,
        156,
        'completed',
        '{"dataset": "Healthcare Analytics", "duration": "72 hours", "judges": 5}'
    );

    -- Get the event IDs for certificate creation
    INSERT INTO nft_certificates (
        institution_id,
        event_id,
        certificate_name,
        certificate_type,
        recipient_name,
        nft_code,
        description,
        issue_date,
        metadata,
        is_active,
        is_claimed
    ) 
    SELECT 
        demo_user_id,
        e.id,
        'MIT AI Hackathon 2024 - Winner',
        'competition',
        'John Doe',
        'HACK2024001',
        'First place winner in MIT AI Hackathon 2024 - Healthcare AI track',
        '2024-03-17',
        '{"position": "1st Place", "track": "Healthcare AI", "prize": "$10000", "team": "HealthTech Innovators"}',
        true,
        false
    FROM institution_events e 
    WHERE e.event_name = 'MIT AI Hackathon 2024' AND e.institution_id = demo_user_id;

    INSERT INTO nft_certificates (
        institution_id,
        event_id,
        certificate_name,
        certificate_type,
        recipient_name,
        nft_code,
        description,
        issue_date,
        metadata,
        is_active,
        is_claimed
    ) 
    SELECT 
        demo_user_id,
        e.id,
        'MIT AI Hackathon 2024 - Participant',
        'competition',
        'Jane Smith',
        'HACK2024002',
        'Participant in MIT AI Hackathon 2024 - EdTech track',
        '2024-03-17',
        '{"track": "EdTech", "team": "Learning Revolution", "project": "AI Tutor Platform"}',
        true,
        false
    FROM institution_events e 
    WHERE e.event_name = 'MIT AI Hackathon 2024' AND e.institution_id = demo_user_id;

    -- Add academic certificates
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
        demo_user_id,
        'Bachelor of Science in Computer Science',
        'academic',
        'Alice Johnson',
        'MIT2024CS003',
        'Bachelor of Science degree in Computer Science, Class of 2024',
        '2024-05-15',
        '{"gpa": "3.8", "honors": "Magna Cum Laude", "major": "Computer Science", "graduation_date": "2024-05-15"}',
        true,
        false
    ),
    (
        demo_user_id,
        'Master of Science in Data Science',
        'academic',
        'Bob Wilson',
        'MIT2024DS004',
        'Master of Science degree in Data Science, Class of 2024',
        '2024-05-15',
        '{"gpa": "3.9", "thesis": "Deep Learning for Medical Diagnosis", "advisor": "Prof. Smith"}',
        true,
        false
    );

END $$;

-- Display created data
SELECT 'DEMO INSTITUTION SETUP COMPLETE' as status;

SELECT 
    'Institution Profile' as type,
    institution_name as name,
    role,
    email
FROM profiles 
WHERE email = 'demo-university@safehire.com';

SELECT 
    'Events' as type,
    event_name as name,
    event_type,
    status,
    event_date
FROM institution_events ie
JOIN profiles p ON ie.institution_id = p.user_id
WHERE p.email = 'demo-university@safehire.com';

SELECT 
    'Certificates' as type,
    certificate_name as name,
    recipient_name,
    nft_code,
    is_claimed
FROM nft_certificates nc
JOIN profiles p ON nc.institution_id = p.user_id
WHERE p.email = 'demo-university@safehire.com';
