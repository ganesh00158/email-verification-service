-- Email Verification Service Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Create email verification table
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'VALID', 'INVALID', 'DISPOSABLE', 'UNKNOWN')),
    reason TEXT,
    syntax_valid BOOLEAN,
    domain_exists BOOLEAN,
    mx_records_exist BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES auth.users(id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_status ON email_verifications(status);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);

-- Enable Row Level Security (RLS)
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own email verifications" ON email_verifications;
DROP POLICY IF EXISTS "Users can insert their own email verifications" ON email_verifications;
DROP POLICY IF EXISTS "Users can update their own email verifications" ON email_verifications;

-- Create RLS policies
CREATE POLICY "Users can view their own email verifications" ON email_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email verifications" ON email_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email verifications" ON email_verifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON email_verifications TO authenticated;
GRANT ALL ON email_verifications TO service_role;