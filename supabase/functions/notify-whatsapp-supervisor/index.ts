import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Retired transport: committed business transitions are the sole source of WhatsApp events.
Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  return new Response(JSON.stringify({ error: 'Legacy notification endpoint retired; events are captured by the transactional outbox.' }), {
    status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});