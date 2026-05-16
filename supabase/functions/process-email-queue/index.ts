// Email queue infrastructure has been removed. This function is now a no-op stub.
// All email tables, RPC functions, queues, and the cron job have been dropped.

Deno.serve(async (_req) => {
  console.log('process-email-queue invoked — email queue infrastructure is disabled (no-op)')
  return new Response(
    JSON.stringify({ processed: 0, disabled: true }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
