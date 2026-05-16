
-- 1. Add reset token columns to passengers
ALTER TABLE public.passengers
  ADD COLUMN IF NOT EXISTS reset_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reset_token_used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reset_token_passenger_id UUID;

CREATE INDEX IF NOT EXISTS idx_passengers_reset_token_hash ON public.passengers(reset_token_hash);

-- 2. Drop tables
DROP TABLE IF EXISTS public.password_reset_tokens CASCADE;
DROP TABLE IF EXISTS public.email_send_log CASCADE;
DROP TABLE IF EXISTS public.email_send_state CASCADE;
DROP TABLE IF EXISTS public.suppressed_emails CASCADE;
DROP TABLE IF EXISTS public.email_unsubscribe_tokens CASCADE;

-- 3. Drop RPC functions
DROP FUNCTION IF EXISTS public.enqueue_email(TEXT, JSONB);
DROP FUNCTION IF EXISTS public.read_email_batch(TEXT, INT, INT);
DROP FUNCTION IF EXISTS public.delete_email(TEXT, BIGINT);
DROP FUNCTION IF EXISTS public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB);

-- 4. Drop pgmq queues
DO $$ BEGIN
  PERFORM pgmq.drop_queue('auth_emails');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  PERFORM pgmq.drop_queue('transactional_emails');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  PERFORM pgmq.drop_queue('auth_emails_dlq');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  PERFORM pgmq.drop_queue('transactional_emails_dlq');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 5. Unschedule cron job
DO $$ BEGIN
  PERFORM cron.unschedule('process-email-queue');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 6. Delete vault secret
DO $$ BEGIN
  DELETE FROM vault.secrets WHERE name = 'email_queue_service_role_key';
EXCEPTION WHEN OTHERS THEN NULL; END $$;
