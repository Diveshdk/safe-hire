-- Job Applications and Notifications System
-- This script creates tables for job applications and notification system

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected')),
  cover_letter TEXT,
  resume_text TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_id UUID REFERENCES profiles(user_id),
  rejection_reason TEXT,
  rejection_keywords TEXT[], -- Array of keywords for AI processing
  ai_rejection_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('application_received', 'application_status', 'job_match', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  related_job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS applications_job_id_idx ON applications(job_id);
CREATE INDEX IF NOT EXISTS applications_applicant_id_idx ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS applications_company_id_idx ON applications(company_id);
CREATE INDEX IF NOT EXISTS applications_status_idx ON applications(status);
CREATE INDEX IF NOT EXISTS applications_applied_at_idx ON applications(applied_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications(type);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);

-- Add RLS policies for applications
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Job seekers can view their own applications
CREATE POLICY "Job seekers can view own applications" ON applications
  FOR SELECT USING (applicant_id = auth.uid());

-- Job seekers can create applications
CREATE POLICY "Job seekers can create applications" ON applications
  FOR INSERT WITH CHECK (applicant_id = auth.uid());

-- Recruiters can view applications for their company's jobs
CREATE POLICY "Recruiters can view company applications" ON applications
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies WHERE owner_user_id = auth.uid()
    )
  );

-- Recruiters can update applications for their company's jobs
CREATE POLICY "Recruiters can update company applications" ON applications
  FOR UPDATE USING (
    company_id IN (
      SELECT id FROM companies WHERE owner_user_id = auth.uid()
    )
  );

-- Add RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- System can insert notifications
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_application_id UUID DEFAULT NULL,
  p_job_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, type, title, message, related_application_id, related_job_id
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_application_id, p_job_id
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new applications (create notification for recruiter)
CREATE OR REPLACE FUNCTION handle_new_application()
RETURNS TRIGGER AS $$
DECLARE
  job_record RECORD;
  company_record RECORD;
  applicant_record RECORD;
BEGIN
  -- Get job details
  SELECT title, company_id INTO job_record FROM jobs WHERE id = NEW.job_id;
  
  -- Get company and owner details
  SELECT name, owner_user_id INTO company_record FROM companies WHERE id = job_record.company_id;
  
  -- Get applicant details  
  SELECT aadhaar_full_name, full_name INTO applicant_record FROM profiles WHERE user_id = NEW.applicant_id;
  
  -- Create notification for recruiter
  PERFORM create_notification(
    company_record.owner_user_id,
    'application_received',
    'New Job Application',
    COALESCE(applicant_record.aadhaar_full_name, applicant_record.full_name, 'A candidate') || 
    ' has applied for ' || job_record.title,
    NEW.id,
    NEW.job_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new applications
DROP TRIGGER IF EXISTS new_application_notification ON applications;
CREATE TRIGGER new_application_notification
  AFTER INSERT ON applications
  FOR EACH ROW EXECUTE FUNCTION handle_new_application();

-- Function to handle application status updates (create notification for applicant)
CREATE OR REPLACE FUNCTION handle_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
  job_record RECORD;
  status_message TEXT;
BEGIN
  -- Only create notification if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get job details
  SELECT title INTO job_record FROM jobs WHERE id = NEW.job_id;
  
  -- Create appropriate message based on status
  CASE NEW.status
    WHEN 'accepted' THEN
      status_message := 'Congratulations! Your application for ' || job_record.title || ' has been accepted.';
    WHEN 'rejected' THEN
      status_message := 'Your application for ' || job_record.title || ' was not selected. ';
      IF NEW.ai_rejection_response IS NOT NULL THEN
        status_message := status_message || NEW.ai_rejection_response;
      END IF;
    WHEN 'reviewing' THEN
      status_message := 'Your application for ' || job_record.title || ' is now being reviewed.';
    ELSE
      status_message := 'Your application status for ' || job_record.title || ' has been updated to ' || NEW.status || '.';
  END CASE;
  
  -- Create notification for applicant
  PERFORM create_notification(
    NEW.applicant_id,
    'application_status',
    'Application Status Update',
    status_message,
    NEW.id,
    NEW.job_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for application status changes
DROP TRIGGER IF EXISTS application_status_notification ON applications;
CREATE TRIGGER application_status_notification
  AFTER UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION handle_application_status_change();

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
