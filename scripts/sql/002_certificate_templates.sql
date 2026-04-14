-- Create certificate_templates table
CREATE TABLE IF NOT EXISTS certificate_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    template_name TEXT NOT NULL,
    organization_name TEXT,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(org_user_id, template_name)
);

-- Enable Row Level Security
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own templates" 
    ON certificate_templates FOR SELECT 
    USING (auth.uid() = org_user_id);

CREATE POLICY "Users can insert their own templates" 
    ON certificate_templates FOR INSERT 
    WITH CHECK (auth.uid() = org_user_id);

CREATE POLICY "Users can update their own templates" 
    ON certificate_templates FOR UPDATE 
    USING (auth.uid() = org_user_id)
    WITH CHECK (auth.uid() = org_user_id);

CREATE POLICY "Users can delete their own templates" 
    ON certificate_templates FOR DELETE 
    USING (auth.uid() = org_user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_certificate_templates_updated_at
    BEFORE UPDATE ON certificate_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Note: Ensure uuid-ossp extension is enabled
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Storage Bucket Logic (Optional SQL for reference)
-- insert into storage.buckets (id, name, public) values ('certificates', 'certificates', true) on conflict (id) do nothing;
