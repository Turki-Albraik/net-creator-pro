ALTER TABLE public.passengers
  ADD COLUMN IF NOT EXISTS verification_token text,
  ADD COLUMN IF NOT EXISTS verification_token_expires_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_passengers_verification_token
  ON public.passengers(verification_token)
  WHERE verification_token IS NOT NULL;