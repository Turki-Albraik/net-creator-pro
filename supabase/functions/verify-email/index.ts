import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { token } = await req.json()
    if (!token || typeof token !== 'string') {
      return json({ error: 'Token is required' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: passenger, error } = await supabase
      .from('passengers')
      .select('id, email, email_verified, verification_token_expires_at')
      .eq('verification_token', token)
      .maybeSingle()

    if (error) {
      console.error('Lookup error', error)
      return json({ error: 'Verification failed' }, 500)
    }

    if (!passenger) {
      return json({ error: 'Invalid or expired verification link' }, 400)
    }

    if (passenger.email_verified) {
      return json({ success: true, alreadyVerified: true })
    }

    if (
      passenger.verification_token_expires_at &&
      new Date(passenger.verification_token_expires_at) < new Date()
    ) {
      return json({ error: 'Verification link has expired' }, 400)
    }

    const { error: updateErr } = await supabase
      .from('passengers')
      .update({
        email_verified: true,
        verification_token: null,
        verification_token_expires_at: null,
      })
      .eq('id', passenger.id)

    if (updateErr) {
      console.error('Update error', updateErr)
      return json({ error: 'Failed to verify email' }, 500)
    }

    return json({ success: true })
  } catch (e) {
    console.error('verify-email error', e)
    return json({ error: 'Internal error' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
