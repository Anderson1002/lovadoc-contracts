import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

const Input = z.discriminatedUnion('action', [
  z.object({ action: z.literal('status') }).strict(),
  z.object({ action: z.literal('process') }).strict(),
  z.object({ action: z.literal('configure'), enabled: z.boolean() }).strict(),
]);

const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const anon = Deno.env.get('SUPABASE_ANON_KEY');
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const baseUrl = Deno.env.get('KHUBA_N8N_BASE_URL');
    if (!url || !anon || !service || !baseUrl) return respond({ error: 'Notification configuration missing' }, 503);
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return respond({ error: 'Authentication required' }, 401);
    const client = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
    const { data: auth, error: authError } = await client.auth.getUser(authorization.slice(7));
    if (authError || !auth.user) return respond({ error: 'Invalid session' }, 401);
    const admin = createClient(url, service, { auth: { persistSession: false } });
    // Resolve trusted roles from the database, never from request metadata or browser storage.
    const { data: role, error: roleError } = await admin.rpc('get_user_role', { user_uuid: auth.user.id });
    if (roleError || !['admin', 'super_admin'].includes(role ?? '')) return respond({ error: 'Administrator access required' }, 403);
    const parsed = Input.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return respond({ error: parsed.error.flatten() }, 400);
    const input = parsed.data;
    if (input.action === 'configure') {
      const domain = new URL(baseUrl);
      if (domain.protocol !== 'https:' || domain.pathname !== '/' || domain.username || domain.password) {
        return respond({ error: 'Invalid configured production domain' }, 503);
      }
      const { error } = await admin.from('whatsapp_notification_settings').update({
        enabled: input.enabled, base_url: domain.origin,
      }).eq('singleton', true);
      if (error) throw error;
      if (input.enabled) {
        const { error: processError } = await admin.rpc('khuba_process_whatsapp_outbox');
        if (processError) throw processError;
      }
      return respond({ enabled: input.enabled });
    }
    if (input.action === 'process') {
      const { data, error } = await admin.rpc('khuba_process_whatsapp_outbox');
      if (error) throw error;
      return respond({ dispatched: data });
    }
    const { data: settings, error: settingsError } = await admin.from('whatsapp_notification_settings').select('enabled').single();
    if (settingsError) throw settingsError;
    const { data: rows, error } = await admin.from('whatsapp_notification_outbox')
      .select('id,event,entity_type,entity_id,status,attempts,http_status,last_error,accepted_at,delivered_at,created_at')
      .order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return respond({ enabled: settings.enabled, notifications: rows });
  } catch (error) {
    console.error('Notification administration failed', error instanceof Error ? error.message : 'Database error');
    return respond({ error: 'Notification administration failed' }, 500);
  }
});