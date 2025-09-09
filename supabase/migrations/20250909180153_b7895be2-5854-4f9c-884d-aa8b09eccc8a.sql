-- Create email_verifications table and RLS policies
-- Using best practices: no FK to auth.users, enable RLS, indices

CREATE TABLE IF NOT EXISTS public.email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  status text NOT NULL CHECK (status IN ('PENDING','VALID','INVALID','DISPOSABLE','UNKNOWN')),
  reason text,
  syntax_valid boolean,
  domain_exists boolean,
  mx_records_exist boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  user_id uuid NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS email_verifications_user_id_idx ON public.email_verifications(user_id);
CREATE INDEX IF NOT EXISTS email_verifications_status_idx ON public.email_verifications(status);
CREATE INDEX IF NOT EXISTS email_verifications_email_idx ON public.email_verifications(email);

-- Enable RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own email verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "Users can insert their own email verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "Users can update their own email verifications" ON public.email_verifications;

-- Select own rows
CREATE POLICY "Users can view their own email verifications"
ON public.email_verifications
FOR SELECT
USING (auth.uid() = user_id);

-- Insert own rows
CREATE POLICY "Users can insert their own email verifications"
ON public.email_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update own rows
CREATE POLICY "Users can update their own email verifications"
ON public.email_verifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.email_verifications TO authenticated;
GRANT ALL ON public.email_verifications TO service_role;