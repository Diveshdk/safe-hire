-- Create storage bucket for documents (resumes, certificates, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true);

-- Create policy to allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own files" ON storage.objects
FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy to allow users to view public files
CREATE POLICY "Public files are viewable by everyone" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');
