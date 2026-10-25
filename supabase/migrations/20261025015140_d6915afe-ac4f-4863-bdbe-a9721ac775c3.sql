CREATE OR REPLACE FUNCTION public.khuba_enqueue_whatsapp(p_event text,p_kind text,p_entity uuid,p_transition uuid,p_recipient uuid,p_data jsonb,p_resolution_error text DEFAULT NULL) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE recipient public.profiles%ROWTYPE; result uuid; problem text; v_recipient_key text;
BEGIN
 IF public.khuba_whatsapp_path(p_event) IS NULL THEN RAISE EXCEPTION 'Unsupported notification event'; END IF;
 SELECT * INTO recipient FROM public.profiles WHERE id=p_recipient;
 problem := p_resolution_error;
 IF recipient.id IS NULL THEN problem := coalesce(problem,'recipient_not_found');
 ELSIF nullif(btrim(recipient.phone),'') IS NULL THEN problem := 'recipient_has_no_phone'; END IF;
 v_recipient_key := coalesce(p_recipient::text,'unresolved');
 INSERT INTO public.whatsapp_notification_outbox(event,entity_type,entity_id,transition_id,recipient_profile_id,recipient_key,payload,status,last_error,next_attempt_at)
 VALUES(p_event,p_kind,p_entity,p_transition,recipient.id,v_recipient_key,
 jsonb_build_object('event',p_event,'phone',btrim(recipient.phone),'recipient_name',recipient.name,'data',p_data),
 CASE WHEN problem IS NULL THEN 'pending' ELSE 'blocked' END,problem,CASE WHEN problem IS NULL THEN now() ELSE NULL END)
 ON CONFLICT(transition_id,event,recipient_key) DO NOTHING RETURNING id INTO result;
 RETURN result;
END; $$;
DO $fix$
DECLARE source text;
BEGIN
 SELECT pg_get_functiondef('public.khuba_capture_whatsapp_transition()'::regprocedure) INTO source;
 source:=replace(source,
 'IF TG_TABLE_NAME=''contracts'' AND NEW.estado IS NOT DISTINCT FROM OLD.estado THEN RETURN NEW; END IF;','IF TG_TABLE_NAME=''contracts'' THEN IF NEW.estado IS NOT DISTINCT FROM OLD.estado THEN RETURN NEW; END IF; END IF;');
 source:=replace(source,
 'IF TG_TABLE_NAME=''billing_accounts'' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;','IF TG_TABLE_NAME=''billing_accounts'' THEN IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF; END IF;');
 source:=replace(source,'contractor := CASE WHEN TG_TABLE_NAME=''contracts'' THEN coalesce(c.client_profile_id,c.created_by) ELSE NEW.created_by END;', 'IF TG_TABLE_NAME=''contracts'' THEN contractor:=coalesce(c.client_profile_id,c.created_by); ELSE contractor:=NEW.created_by; END IF;');
 EXECUTE source;
END $fix$;
DO $test$
DECLARE c public.contracts%ROWTYPE; b public.billing_accounts%ROWTYPE;
 supervisor public.profiles%ROWTYPE; contractor public.profiles%ROWTYPE;
 cid uuid:=gen_random_uuid(); bid uuid:=gen_random_uuid(); tid uuid:=gen_random_uuid();
 total integer; got jsonb; marker text;
BEGIN
 IF EXISTS(SELECT 1 FROM public.whatsapp_notification_settings WHERE enabled) THEN
  RAISE EXCEPTION 'Tests require dispatch disabled; no real notifications are permitted';
 END IF;
 SELECT p.* INTO supervisor FROM public.profiles p JOIN public.roles r ON r.id=p.role_id WHERE r.name='supervisor' ORDER BY p.created_at LIMIT 1;
 SELECT * INTO c FROM public.contracts WHERE estado='en_ejecucion' ORDER BY created_at LIMIT 1;
 IF c.id IS NULL OR supervisor.id IS NULL THEN RAISE EXCEPTION 'Existing fixture contract and supervisor required'; END IF;
 SELECT * INTO contractor FROM public.profiles WHERE id=c.created_by;
 BEGIN
  PERFORM set_config('request.jwt.claim.sub',supervisor.user_id::text,true);
  c.id:=cid; c.contract_number:='TEST-NOTIFICATION-'||cid; c.estado:='registrado'; c.state_code:='REG';
  c.supervisor_id:=supervisor.user_id; c.client_profile_id:=contractor.id;
  c.contract_number_original:='TEST-002-Eje'; c.oid:=2000000000;
  INSERT INTO public.contracts SELECT c.*;
  SELECT count(*) INTO total FROM public.whatsapp_notification_outbox WHERE entity_id=cid;
  IF total<>2 THEN RAISE EXCEPTION 'Registration expected 2 events, got %',total; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.whatsapp_notification_outbox WHERE entity_id=cid AND event='contract_registered' AND recipient_profile_id=contractor.id AND payload#>>'{data,contractNumber}'='TEST-002-Eje') THEN RAISE EXCEPTION 'Contract registration payload/recipient mismatch'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.whatsapp_notification_outbox WHERE entity_id=cid AND event='supervisor_contract_pending' AND recipient_profile_id=supervisor.id) THEN RAISE EXCEPTION 'Pending supervisor recipient mismatch'; END IF;
  UPDATE public.contracts SET description=description WHERE id=cid;
  IF (SELECT count(*) FROM public.whatsapp_notification_outbox WHERE entity_id=cid)<>2 THEN RAISE EXCEPTION 'Repeated save emitted an event'; END IF;
  UPDATE public.contracts SET estado='devuelto',state_code='DEV',comentarios_devolucion=E'Documento incorrecto\nRevisar firma' WHERE id=cid;
  IF NOT EXISTS(SELECT 1 FROM public.whatsapp_notification_outbox WHERE entity_id=cid AND event='contract_rejected' AND payload#>>'{data,observations,0,comment}'=E'Documento incorrecto\nRevisar firma') THEN RAISE EXCEPTION 'Saved contract observations not preserved'; END IF;
  UPDATE public.contracts SET estado='corregido',state_code='COR' WHERE id=cid;
  IF (SELECT count(*) FROM public.whatsapp_notification_outbox WHERE entity_id=cid AND event='supervisor_contract_corrected')<>1 THEN RAISE EXCEPTION 'Corrected contract must emit once'; END IF;
  UPDATE public.contracts SET estado='en_ejecucion',state_code='EJE' WHERE id=cid;
  IF NOT EXISTS(SELECT 1 FROM public.whatsapp_notification_outbox WHERE entity_id=cid AND event='contract_approved' AND payload#>>'{data,supervisorName}'=supervisor.name) THEN RAISE EXCEPTION 'Contract approval missing'; END IF;
  PERFORM set_config('request.jwt.claim.sub',contractor.user_id::text,true);
  INSERT INTO public.billing_accounts(id,contract_id,account_number,amount,billing_month,status,created_by,informe_complete,certificacion_complete,cuenta_cobro_complete)
  VALUES(bid,cid,'TEST-COB-'||bid,1,'2026-10-01','borrador',contractor.id,true,true,true);
  IF (SELECT count(*) FROM public.whatsapp_notification_outbox WHERE entity_id=bid)<>1 THEN RAISE EXCEPTION 'Draft registration must not notify supervisor'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.whatsapp_notification_outbox WHERE entity_id=bid AND event='billing_registered' AND payload#>>'{data,billingMonth}'='octubre de 2026') THEN RAISE EXCEPTION 'Billing registration month mismatch'; END IF;
  UPDATE public.billing_accounts SET notes='Draft save' WHERE id=bid;
  IF (SELECT count(*) FROM public.whatsapp_notification_outbox WHERE entity_id=bid)<>1 THEN RAISE EXCEPTION 'Draft save emitted duplicate'; END IF;
  UPDATE public.billing_accounts SET status='pendiente_revision' WHERE id=bid;
  IF (SELECT count(*) FROM public.whatsapp_notification_outbox WHERE entity_id=bid AND event='supervisor_billing_pending')<>1 THEN RAISE EXCEPTION 'Initial billing submission missing'; END IF;
  UPDATE public.billing_accounts SET notes='No status transition' WHERE id=bid;
  IF (SELECT count(*) FROM public.whatsapp_notification_outbox WHERE entity_id=bid AND event='supervisor_billing_pending')<>1 THEN RAISE EXCEPTION 'Repeated submission duplicated'; END IF;
  PERFORM set_config('request.jwt.claim.sub',supervisor.user_id::text,true);
  UPDATE public.billing_accounts SET status='rechazada',comentario_supervisor=E'[informe] Documento incorrecto\nSegunda línea\n[certificacion] Fecha incorrecta' WHERE id=bid;
  SELECT payload INTO got FROM public.whatsapp_notification_outbox WHERE entity_id=bid AND event='billing_rejected';
  IF got#>>'{data,observations,0,comment}' IS DISTINCT FROM E'Documento incorrecto\nSegunda línea' OR got#>>'{data,observations,1,comment}' IS DISTINCT FROM 'Fecha incorrecta' THEN RAISE EXCEPTION 'Billing observations not preserved: %',got->'data'; END IF;
  PERFORM set_config('request.jwt.claim.sub',contractor.user_id::text,true);
  UPDATE public.billing_accounts SET notes='Correction draft' WHERE id=bid;
  IF EXISTS(SELECT 1 FROM public.whatsapp_notification_outbox WHERE entity_id=bid AND event='supervisor_billing_corrected') THEN RAISE EXCEPTION 'Correction draft notified supervisor'; END IF;
  UPDATE public.billing_accounts SET status='pendiente_revision' WHERE id=bid;
  IF (SELECT count(*) FROM public.whatsapp_notification_outbox WHERE entity_id=bid AND event='supervisor_billing_corrected')<>1 THEN RAISE EXCEPTION 'Billing resubmission missing'; END IF;
  PERFORM set_config('request.jwt.claim.sub',supervisor.user_id::text,true);
  UPDATE public.billing_accounts SET status='aprobada' WHERE id=bid;
  IF NOT EXISTS(SELECT 1 FROM public.whatsapp_notification_outbox WHERE entity_id=bid AND event='billing_approved' AND recipient_profile_id=contractor.id) THEN RAISE EXCEPTION 'Billing approval missing'; END IF;
  IF (SELECT count(DISTINCT event) FROM public.whatsapp_notification_outbox WHERE entity_id IN(cid,bid))<>10 THEN RAISE EXCEPTION 'Expected all ten events'; END IF;
  PERFORM public.khuba_enqueue_whatsapp('contract_registered','contract',cid,tid,contractor.id,'{}');
  PERFORM public.khuba_enqueue_whatsapp('contract_registered','contract',cid,tid,contractor.id,'{}');
  IF (SELECT count(*) FROM public.whatsapp_notification_outbox WHERE transition_id=tid)<>1 THEN RAISE EXCEPTION 'Idempotency failed'; END IF;
  IF EXISTS(SELECT 1 FROM public.whatsapp_notification_attempts a JOIN public.whatsapp_notification_outbox o ON o.id=a.notification_id WHERE o.entity_id IN(cid,bid)) THEN RAISE EXCEPTION 'Test must not dispatch messages'; END IF;
  RAISE EXCEPTION USING MESSAGE='KHUBA_TEST_ROLLBACK_OK';
 EXCEPTION WHEN raise_exception THEN
  GET STACKED DIAGNOSTICS marker=MESSAGE_TEXT;
  IF marker<>'KHUBA_TEST_ROLLBACK_OK' THEN RAISE; END IF;
 END;
 IF EXISTS(SELECT 1 FROM public.contracts WHERE id=cid) OR EXISTS(SELECT 1 FROM public.whatsapp_notification_outbox WHERE entity_id IN(cid,bid)) THEN RAISE EXCEPTION 'Fixture rollback failed'; END IF;
 RAISE NOTICE 'PASS: ten events, recipients, months, exact observations, draft suppression, idempotency and transactional rollback; zero sends';
END $test$;