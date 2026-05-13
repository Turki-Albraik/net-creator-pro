import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hashBuf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { email, appUrl } = await req.json()
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const normalizedEmail = email.trim().toLowerCase()

    // Generic success response (avoid leaking which emails exist)
    const genericResponse = new Response(
      JSON.stringify({ success: true, message: 'If that email exists, a reset link has been sent.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

    // Find passenger by email (passengers only — admins must use offline reset)
    const { data: passenger } = await supabase
      .from('passengers')
      .select('id, name, email')
      .ilike('email', normalizedEmail)
      .maybeSingle()

    if (!passenger) {
      console.log('Password reset requested for unknown email:', normalizedEmail)
      return genericResponse
    }

    // Invalidate prior unused tokens for this passenger
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .is('used_at', null)
      .eq('passenger_id', passenger.id)

    // Create new token
    const rawToken = generateToken()
    const tokenHash = await sha256(rawToken)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 60 min

    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        passenger_id: passenger.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      })

    if (insertError) {
      console.error('Failed to insert reset token:', insertError)
      return new Response(JSON.stringify({ error: 'Failed to generate reset link' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const baseUrl = (typeof appUrl === 'string' && appUrl.startsWith('http'))
      ? appUrl.replace(/\/$/, '')
      : 'https://sikkahsa.online'
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`

    // Trigger transactional email via send-transactional-email (uses service role)
    const sendRes = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        templateName: 'password-reset',
        recipientEmail: passenger.email,
        templateData: {
          name: passenger.name,
          resetUrl,
          siteName: 'سِـكَّـة',
        },
      }),
    })

    if (!sendRes.ok) {
      const errText = await sendRes.text()
      console.error('Failed to send reset email:', errText)
      // Still return generic success to caller
    }

    return genericResponse
  } catch (e) {
    console.error('request-password-reset error:', e)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
