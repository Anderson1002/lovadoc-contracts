import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Notify contractors whose contracts expire in N days. Default thresholds: 30, 15, 7, 3, 1.
serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const thresholds = [30, 15, 7, 3, 1];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targets: string[] = thresholds.map((d) => {
      const dt = new Date(today);
      dt.setDate(dt.getDate() + d);
      return dt.toISOString().split('T')[0];
    });

    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('id, contract_number, contract_number_original, end_date, client_profile_id, profiles:profiles!contracts_client_profile_id_fkey(name, phone)')
      .eq('estado', 'en_ejecucion')
      .in('end_date', targets);

    if (error) throw error;

    let sent = 0;
    for (const c of contracts || []) {
      const prof: any = c.profiles;
      if (!prof?.phone) continue;
      const days = Math.ceil((new Date(c.end_date).getTime() - today.getTime()) / 86400000);
      const number = (c as any).contract_number_original || c.contract_number;

      await supabase.functions.invoke('notify-whatsapp', {
        body: {
          event: 'contract_expiring',
          phone: prof.phone,
          recipient_name: prof.name,
          title: `Contrato próximo a vencer (${days} días)`,
          message: `Hola ${prof.name}, tu contrato ${number} vence en ${days} día(s) (${c.end_date}). Gestiona la renovación o cierre con tu supervisor.`,
          data: { contract_number: number, end_date: c.end_date, days_remaining: days },
        },
      });
      sent++;
    }

    return new Response(
      JSON.stringify({ success: true, checked: (contracts || []).length, sent }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  } catch (error: any) {
    console.error('[notify-expiring-contracts] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  }
});