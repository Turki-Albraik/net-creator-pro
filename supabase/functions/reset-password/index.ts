import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hashBuf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function isPasswordValid(pw: string): string | null {
  if (typeof pw !== 'string' || pw.length < 6) return 'Password must be at least 6 characters'
  if (!/[0-9]/.test(pw)) return 'Password must contain at least one number'
  if (!/[!@#$%^&*]/.test(pw)) return 'Password must contain at least one special character'
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json()
    const { token, newPassword, validateOnly } = body

    if (!token || typeof token !== 'string') {
      return new Response(JSON.stringify({ error: 'Token is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const tokenHash = await sha256(token)

    const { data: tokenRow } = await supabase
      .from('password_reset_tokens')
      .select('id, passenger_id, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .maybeSingle()

    if (!tokenRow) {
      return new Response(JSON.stringify({ error: 'Invalid or expired reset link' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (tokenRow.used_at) {
      return new Response(JSON.stringify({ error: 'This reset link has already been used' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: 'This reset link has expired' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (validateOnly) {
      return new Response(JSON.stringify({ success: true, valid: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const pwError = isPasswordValid(newPassword)
    if (pwError) {
      return new Response(JSON.stringify({ error: pwError }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const newHash = await sha256(newPassword)

    const { error: updateError } = await supabase
      .from('passengers')
      .update({ password: newHash })
      .eq('id', tokenRow.passenger_id)

    if (updateError) {
      console.error('Password update failed:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to update password' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenRow.id)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('reset-password error:', e)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
