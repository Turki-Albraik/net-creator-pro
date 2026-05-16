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

    const { data: passenger } = await supabase
      .from('passengers')
      .select('id, reset_token_expires_at, reset_token_used_at')
      .eq('reset_token_hash', tokenHash)
      .maybeSingle()

    if (!passenger) {
      return new Response(JSON.stringify({ error: 'Invalid or expired reset link' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (passenger.reset_token_used_at) {
      return new Response(JSON.stringify({ error: 'This reset link has already been used' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!passenger.reset_token_expires_at || new Date(passenger.reset_token_expires_at).getTime() < Date.now()) {
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
      .update({
        password: newHash,
        reset_token_used_at: new Date().toISOString(),
        reset_token_hash: null,
      })
      .eq('id', passenger.id)

    if (updateError) {
      console.error('Password update failed:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to update password' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

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
