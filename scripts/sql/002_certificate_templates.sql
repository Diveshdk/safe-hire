-- Create certificate_templates table
CREATE TABLE IF NOT EXISTS certificate_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    template_name TEXT NOT NULL,
    organization_name TEXT,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
