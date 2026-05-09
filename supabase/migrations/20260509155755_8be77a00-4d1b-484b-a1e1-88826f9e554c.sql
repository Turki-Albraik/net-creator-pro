DELETE FROM public.passengers a
USING public.passengers b
WHERE a.email = b.email
  AND a.email IS NOT NULL
  AND a.created_at < b.created_at;

ALTER TABLE public.passengers ADD COLUMN IF NOT EXISTS password text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_passengers_email_unique ON public.passengers(email) WHERE email IS NOT NULL;