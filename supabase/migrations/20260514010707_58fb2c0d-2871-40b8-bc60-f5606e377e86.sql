ALTER TABLE public.password_reset_tokens
  ADD COLUMN IF NOT EXISTS passenger_id uuid REFERENCES public.passengers(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS token_hash text;

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_passenger_id
  ON public.password_reset_tokens(passenger_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash
  ON public.password_reset_tokens(token_hash);

ALTER TABLE public.password_reset_tokens
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN token DROP NOT NULL;