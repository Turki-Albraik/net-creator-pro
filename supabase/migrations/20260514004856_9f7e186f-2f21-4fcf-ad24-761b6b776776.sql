CREATE TABLE public.password_reset_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_email ON public.password_reset_tokens(email);

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert reset tokens"
ON public.password_reset_tokens FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can read reset tokens"
ON public.password_reset_tokens FOR SELECT
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can update reset tokens"
ON public.password_reset_tokens FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');