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

    const genericResponse = new Response(
      JSON.stringify({ success: true, message: 'If that email exists, a reset link has been sent.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

    const { data: passenger } = await supabase
      .from('passengers')
      .select('id, name, email')
      .ilike('email', normalizedEmail)
      .maybeSingle()

    if (!passenger) {
      console.log('Password reset requested for unknown email:', normalizedEmail)
      return genericResponse
    }

    const rawToken = generateToken()
    const tokenHash = await sha256(rawToken)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    const { error: updateError } = await supabase
      .from('passengers')
      .update({
        reset_token_hash: tokenHash,
        reset_token_expires_at: expiresAt,
        reset_token_used_at: null,
        reset_token_passenger_id: passenger.id,
      })
      .eq('id', passenger.id)

    if (updateError) {
      console.error('Failed to store reset token:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to generate reset link' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const baseUrl = (typeof appUrl === 'string' && appUrl.startsWith('http'))
      ? appUrl.replace(/\/$/, '')
      : 'https://sikkahsa.online'
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`

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
