-- Read-only regression for the actual n8n camelCase response; no network requests.
DO $$
DECLARE response jsonb:='{"success":true,"status":"accepted","messageId":"provider-id-regression"}'; resolved text;
BEGIN
 resolved:=coalesce(response#>>'{messages,0,id}',response->>'message_id',response->>'messageId');
 IF resolved IS DISTINCT FROM 'provider-id-regression' THEN RAISE EXCEPTION 'CamelCase WhatsApp message identifier was not captured'; END IF;
 IF position('response_json->>''messageId''' in pg_get_functiondef('public.khuba_process_whatsapp_outbox()'::regprocedure))=0 THEN RAISE EXCEPTION 'Production parser missing messageId'; END IF;
END $$;