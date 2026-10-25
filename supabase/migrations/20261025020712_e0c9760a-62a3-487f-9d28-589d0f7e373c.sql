DO $$
DECLARE s public.whatsapp_notification_settings%ROWTYPE;
BEGIN
 SELECT * INTO s FROM public.whatsapp_notification_settings WHERE singleton FOR UPDATE;
 IF s.base_url IS DISTINCT FROM 'https://isabella2025-n8n.higmbd.easypanel.host' THEN RAISE EXCEPTION 'Unexpected production domain'; END IF;
 IF EXISTS(SELECT 1 FROM public.whatsapp_notification_outbox o WHERE o.status='pending' AND o.attempts=0 AND (o.event NOT IN ('contract_registered','contract_approved','contract_rejected','billing_registered','billing_approved','billing_rejected','supervisor_contract_pending','supervisor_billing_pending','supervisor_contract_corrected','supervisor_billing_corrected') OR nullif(btrim(o.payload->>'phone'),'') IS NULL OR CASE o.entity_type WHEN 'billing' THEN NOT EXISTS(SELECT 1 FROM public.billing_accounts b WHERE b.id=o.entity_id) WHEN 'contract' THEN NOT EXISTS(SELECT 1 FROM public.contracts c WHERE c.id=o.entity_id) ELSE true END)) THEN RAISE EXCEPTION 'Pending event requires review before dispatch'; END IF;
 UPDATE public.whatsapp_notification_settings SET enabled=true WHERE singleton;
 PERFORM public.khuba_process_whatsapp_outbox();
END $$;