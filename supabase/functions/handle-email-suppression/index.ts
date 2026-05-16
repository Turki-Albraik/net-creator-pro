// Suppression tracking tables have been removed. This webhook now just logs events.
import { WebhookError, verifyWebhookRequest } from 'npm:@lovable.dev/webhooks-js'

interface SuppressionPayload {
  email: string
  reason: 'bounce' | 'complaint' | 'unsubscribe'
  message_id?: string
  metadata?: Record<string, unknown>
  is_retry: boolean
  retry_count: number
}

function parseSuppressionPayload(body: string): SuppressionPayload {
  const parsed = JSON.parse(body)
  if (!parsed.data) throw new Error('Missing data field in payload')
  const data = parsed.data as SuppressionPayload
  if (!data.email || !data.reason) throw new Error('Missing required fields: email, reason')
  return data
}

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!apiKey) return jsonResponse({ error: 'Server configuration error' }, 500)

  let payload: SuppressionPayload
  try {
    const verified = await verifyWebhookRequest({ req, secret: apiKey, parser: parseSuppressionPayload })
    payload = verified.payload
  } catch (error) {
    if (error instanceof WebhookError) {
      const status = error.code === 'invalid_payload' || error.code === 'invalid_json' ? 400 : 401
      return jsonResponse({ error: error.code }, status)
    }
    return jsonResponse({ error: 'Internal error' }, 500)
  }

  const normalizedEmail = payload.email.toLowerCase()
  console.log('Suppression event received (logging only — suppression table removed)', {
    email_redacted: normalizedEmail[0] + '***@' + normalizedEmail.split('@')[1],
    reason: payload.reason,
    is_retry: payload.is_retry,
    retry_count: payload.retry_count,
  })

  return jsonResponse({ success: true })
})
