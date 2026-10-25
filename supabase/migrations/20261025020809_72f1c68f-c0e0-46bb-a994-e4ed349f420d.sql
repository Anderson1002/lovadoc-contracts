DO $$
DECLARE source text;
BEGIN
 SELECT pg_get_functiondef('public.khuba_process_whatsapp_outbox()'::regprocedure) INTO source;
 IF position('response_json->>''messageId''' in source)=0 THEN
 source:=replace(source,'whatsapp_message_id=coalesce(response_json#>>''{messages,0,id}'',response_json->>''message_id'')','whatsapp_message_id=CASE WHEN accepted THEN coalesce(response_json#>>''{messages,0,id}'',response_json->>''message_id'',response_json->>''messageId'') ELSE NULL END');
 EXECUTE source;
 END IF;
 UPDATE public.whatsapp_notification_outbox SET whatsapp_message_id=last_response::jsonb->>'messageId' WHERE status='accepted' AND whatsapp_message_id IS NULL AND last_response IS NOT NULL AND last_response LIKE '{%' AND last_response::jsonb->>'messageId' IS NOT NULL;
 PERFORM public.khuba_process_whatsapp_outbox();
END $$;
DO $$
DECLARE response jsonb:='{"success":true,"status":"accepted","messageId":"provider-id-regression"}'; resolved text;
BEGIN
 resolved:=coalesce(response#>>'{messages,0,id}',response->>'message_id',response->>'messageId');
 IF resolved IS DISTINCT FROM 'provider-id-regression' THEN RAISE EXCEPTION 'CamelCase WhatsApp message identifier was not captured'; END IF;
 IF position('response_json->>''messageId''' in pg_get_functiondef('public.khuba_process_whatsapp_outbox()'::regprocedure))=0 THEN RAISE EXCEPTION 'Production parser missing messageId'; END IF;
END $$;