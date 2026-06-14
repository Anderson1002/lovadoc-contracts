import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const N8N_WEBHOOK_URL = 'https://isabella2025-n8n.higmbd.easypanel.host/webhook/Khuba';

interface WhatsAppPayload {
  event: string;        // e.g. 'billing_submitted' | 'billing_approved' | 'billing_rejected' | 'contract_created' | 'contract_expiring'
  phone?: string | null;
  recipient_name?: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers });

  try {
    const payload: WhatsAppPayload = await req.json();

    if (!payload.event || !payload.title || !payload.message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing event, title or message' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...headers } }
      );
    }

    if (!payload.phone || String(payload.phone).trim() === '') {
      console.warn(`[notify-whatsapp] No phone for event=${payload.event} recipient=${payload.recipient_name || ''}. Skipping.`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'no_phone' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...headers } }
      );
    }

    const body = {
      event: payload.event,
      phone: String(payload.phone).trim(),
      recipient_name: payload.recipient_name || null,
      title: payload.title,
      message: payload.message,
      data: payload.data || {},
      timestamp: new Date().toISOString(),
    };

    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    console.log(`[notify-whatsapp] event=${payload.event} status=${res.status} response=${text.slice(0, 200)}`);

    return new Response(
      JSON.stringify({ success: res.ok, status: res.status, response: text }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  } catch (error: any) {
    console.error('[notify-whatsapp] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  }
});