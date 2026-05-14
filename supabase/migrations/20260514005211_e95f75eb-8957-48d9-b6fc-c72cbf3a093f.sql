ALTER TABLE public.passengers
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verification_token text,
  ADD COLUMN IF NOT EXISTS email_verification_sent_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_passengers_email_verification_token
  ON public.passengers(email_verification_token);