ALTER TABLE public.passengers
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_token text,
  ADD COLUMN IF NOT EXISTS verification_token_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_passengers_verification_token
  ON public.passengers(verification_token)
  WHERE verification_token IS NOT NULL;