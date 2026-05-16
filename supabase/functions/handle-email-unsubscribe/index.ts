// Unsubscribe token tables have been removed. This endpoint now logs and returns OK.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  console.log('Unsubscribe request received (no-op — unsubscribe tables removed)', { has_token: !!token })

  if (req.method === 'GET') return jsonResponse({ valid: true })
  return jsonResponse({ success: true })
})
