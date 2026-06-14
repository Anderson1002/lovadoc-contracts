import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const N8N_SUPERVISOR_WEBHOOK_URL = 'https://isabella2025-n8n.higmbd.easypanel.host/webhook-test/KhubaSupervisor';

interface SupervisorPayload {
  event: string; // supervisor_billing_pending | supervisor_billing_corrected | supervisor_contract_pending | supervisor_contract_corrected
  phone?: string | null;
  recipient_name?: string | null;
  data?: Record<string, unknown>;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers });

  try {
    const payload: SupervisorPayload = await req.json();

    if (!payload.event) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing event' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...headers } }
      );
    }

    if (!payload.phone || String(payload.phone).trim() === '') {
      console.warn(`[notify-whatsapp-supervisor] No phone for event=${payload.event} recipient=${payload.recipient_name || ''}. Skipping.`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'no_phone' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...headers } }
      );
    }

    const body = {
      event: payload.event,
      phone: String(payload.phone).trim(),
      recipient_name: payload.recipient_name || null,
      data: payload.data || {},
    };

    const res = await fetch(N8N_SUPERVISOR_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    console.log(`[notify-whatsapp-supervisor] event=${payload.event} status=${res.status} response=${text.slice(0, 200)}`);

    return new Response(
      JSON.stringify({ success: res.ok, status: res.status, response: text }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  } catch (error: any) {
    console.error('[notify-whatsapp-supervisor] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  }
});