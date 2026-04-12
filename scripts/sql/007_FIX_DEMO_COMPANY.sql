-- Fix Demo Employer Account: Add a demo company to the demo user

DO $$ 
DECLARE 
  demo_user_id UUID;
BEGIN
  -- Find the user_id of the demo employer
  SELECT user_id INTO demo_user_id FROM public.profiles WHERE safe_hire_id = 'SH-DEMO999' LIMIT 1;
  
  IF demo_user_id IS NOT NULL THEN
    -- Check if a company already exists for them
    IF NOT EXISTS (SELECT 1 FROM public.companies WHERE owner_user_id = demo_user_id) THEN
      -- Insert a dummy company for this user
      INSERT INTO public.companies (
        owner_user_id, 
        name, 
        registration_number,
        verification_status, 
        verifier_source,
        verification_method,
        verified_at
      )
      VALUES (
        demo_user_id, 
        'Acme Demo Corp', 
        'DEMO12345',
        'verified', 
        'demo_script',
        'manual',
        now()
      );
    END IF;
  END IF;
END $$;
