-- lovable-cron-fallback-reviewed: Queue processor wakes on enqueue; minute job exists only while sending or retry work remains and unschedules after drain. It collects asynchronous pg_net responses and retries bounded failures.
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

CREATE TABLE public.whatsapp_notification_settings (
 singleton boolean PRIMARY KEY DEFAULT true,
 base_url text NOT NULL DEFAULT 'https://isabella2025-n8n.higmbd.easypanel.host',
 enabled boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.whatsapp_notification_settings TO service_role;
ALTER TABLE public.whatsapp_notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_settings_service ON public.whatsapp_notification_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
INSERT INTO public.whatsapp_notification_settings(singleton) VALUES (true);
CREATE TRIGGER whatsapp_settings_updated BEFORE UPDATE ON public.whatsapp_notification_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.whatsapp_notification_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 event text NOT NULL, entity_type text NOT NULL, entity_id uuid NOT NULL,
 transition_id uuid NOT NULL, recipient_profile_id uuid, recipient_key text NOT NULL,
 payload jsonb NOT NULL, status text NOT NULL DEFAULT 'pending',
 attempts integer NOT NULL DEFAULT 0, next_attempt_at timestamptz DEFAULT now(),
 request_id bigint, http_status integer, last_response text, last_error text,
 whatsapp_message_id text, accepted_at timestamptz, delivered_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(transition_id,event,recipient_key)
);
GRANT ALL ON public.whatsapp_notification_outbox TO service_role;
ALTER TABLE public.whatsapp_notification_outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_outbox_service ON public.whatsapp_notification_outbox FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX whatsapp_outbox_due ON public.whatsapp_notification_outbox(status,next_attempt_at);
CREATE TRIGGER whatsapp_outbox_updated BEFORE UPDATE ON public.whatsapp_notification_outbox FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.whatsapp_notification_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 notification_id uuid NOT NULL REFERENCES public.whatsapp_notification_outbox(id),
 attempt_number integer NOT NULL, request_id bigint, webhook_url text NOT NULL,
 http_status integer, response_body text, error text,
 created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz,
 UNIQUE(notification_id,attempt_number)
);
GRANT ALL ON public.whatsapp_notification_attempts TO service_role;
ALTER TABLE public.whatsapp_notification_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_attempts_service ON public.whatsapp_notification_attempts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE FUNCTION public.khuba_whatsapp_path(p_event text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT CASE p_event
 WHEN 'contract_registered' THEN '/webhook/khuba/contract-registered'
 WHEN 'contract_approved' THEN '/webhook/khuba/contract-approved'
 WHEN 'contract_rejected' THEN '/webhook/khuba/contract-rejected'
 WHEN 'billing_registered' THEN '/webhook/khuba/billing-registered'
 WHEN 'billing_approved' THEN '/webhook/khuba/billing-approved'
 WHEN 'billing_rejected' THEN '/webhook/khuba/billing-rejected'
 WHEN 'supervisor_contract_pending' THEN '/webhook/khuba/supervisor-contract-pending'
 WHEN 'supervisor_billing_pending' THEN '/webhook/khuba/supervisor-billing-pending'
 WHEN 'supervisor_contract_corrected' THEN '/webhook/khuba/supervisor-contract-corrected'
 WHEN 'supervisor_billing_corrected' THEN '/webhook/khuba/supervisor-billing-corrected' END;
$$;
REVOKE ALL ON FUNCTION public.khuba_whatsapp_path(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.khuba_whatsapp_path(text) TO service_role;

CREATE FUNCTION public.khuba_whatsapp_observations(p_text text) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$
DECLARE part text; label text; comment text; result jsonb := '[]'::jsonb;
BEGIN
 IF nullif(btrim(p_text),'') IS NULL THEN RETURN result; END IF;
 -- Split only at document labels, preserving line breaks inside each saved comment.
 FOR part IN SELECT regexp_split_to_table(p_text, E'\\n(?=\\[)') LOOP
  IF part ~ '^\[[^]]+\]' THEN
   label := substring(part FROM '^\[([^]]+)\]');
   comment := regexp_replace(part, '^\[[^]]+\][ ]?', '');
  ELSE label := 'CONTRATO'; comment := part; END IF;
  label := CASE lower(label)
   WHEN 'informe' THEN 'INFORME' WHEN 'informe de actividades' THEN 'INFORME'
   WHEN 'certificacion' THEN 'CERTIFICACION' WHEN 'certificación' THEN 'CERTIFICACION'
   WHEN 'cuenta_cobro' THEN 'CUENTA DE COBRO' ELSE upper(label) END;
  result := result || jsonb_build_array(jsonb_build_object('documentType',label,'comment',comment));
 END LOOP;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.khuba_whatsapp_observations(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.khuba_whatsapp_observations(text) TO service_role;

CREATE FUNCTION public.khuba_enqueue_whatsapp(p_event text,p_kind text,p_entity uuid,p_transition uuid,p_recipient uuid,p_data jsonb,p_resolution_error text DEFAULT NULL) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE recipient public.profiles%ROWTYPE; result uuid; problem text; recipient_key text;
BEGIN
 IF public.khuba_whatsapp_path(p_event) IS NULL THEN RAISE EXCEPTION 'Unsupported notification event'; END IF;
 SELECT * INTO recipient FROM public.profiles WHERE id=p_recipient;
 problem := p_resolution_error;
 IF recipient.id IS NULL THEN problem := coalesce(problem,'recipient_not_found');
 ELSIF nullif(btrim(recipient.phone),'') IS NULL THEN problem := 'recipient_has_no_phone'; END IF;
 recipient_key := coalesce(p_recipient::text,'unresolved');
 INSERT INTO public.whatsapp_notification_outbox(event,entity_type,entity_id,transition_id,recipient_profile_id,recipient_key,payload,status,last_error,next_attempt_at)
 VALUES(p_event,p_kind,p_entity,p_transition,recipient.id,recipient_key,
 jsonb_build_object('event',p_event,'phone',btrim(recipient.phone),'recipient_name',recipient.name,'data',p_data),
 CASE WHEN problem IS NULL THEN 'pending' ELSE 'blocked' END,problem,CASE WHEN problem IS NULL THEN now() ELSE NULL END)
 ON CONFLICT(transition_id,event,recipient_key) DO NOTHING RETURNING id INTO result;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.khuba_enqueue_whatsapp(text,text,uuid,uuid,uuid,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.khuba_enqueue_whatsapp(text,text,uuid,uuid,uuid,jsonb,text) TO service_role;

CREATE FUNCTION public.khuba_capture_whatsapp_transition() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.contracts%ROWTYPE; contractor uuid; supervisor uuid; supervisor_count integer;
 creator_process integer; actor_name text; actor_role public.user_role_type;
 transition uuid:=gen_random_uuid(); d jsonb; operator_name text; initial_state text; new_state text; problem text;
BEGIN
 IF TG_OP='UPDATE' THEN
  IF TG_TABLE_NAME='contracts' AND NEW.estado IS NOT DISTINCT FROM OLD.estado THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME='billing_accounts' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
 END IF;
 IF TG_TABLE_NAME='contracts' THEN c:=NEW; ELSE SELECT * INTO c FROM public.contracts WHERE id=NEW.contract_id; END IF;
 contractor := CASE WHEN TG_TABLE_NAME='contracts' THEN coalesce(c.client_profile_id,c.created_by) ELSE NEW.created_by END;
 SELECT name INTO operator_name FROM public.profiles WHERE id=contractor;
 SELECT p.name,r.name INTO actor_name,actor_role FROM public.profiles p JOIN public.roles r ON r.id=p.role_id WHERE p.user_id=auth.uid();
 IF c.supervisor_id IS NOT NULL THEN
  SELECT id INTO supervisor FROM public.profiles WHERE user_id=c.supervisor_id;
  IF supervisor IS NULL THEN problem:='assigned_supervisor_not_found'; END IF;
 ELSE
  SELECT proceso_id INTO creator_process FROM public.profiles WHERE id=c.created_by;
  SELECT count(*), (array_agg(p.id ORDER BY p.created_at,p.id))[1] INTO supervisor_count,supervisor
  FROM public.profiles p JOIN public.roles r ON r.id=p.role_id WHERE p.proceso_id=creator_process AND r.name='supervisor';
  IF supervisor_count<>1 THEN supervisor:=NULL; problem:=CASE WHEN supervisor_count=0 THEN 'supervisor_not_found' ELSE 'ambiguous_process_supervisor' END; END IF;
 END IF;
 IF TG_TABLE_NAME='contracts' THEN
  d:=jsonb_build_object('contractNumber',coalesce(nullif(c.contract_number_original,''),c.contract_number),
   'contractType',CASE c.contract_type WHEN 'contractor' THEN 'Prestación de servicios' WHEN 'fixed_amount' THEN 'Monto fijo' WHEN 'variable_amount' THEN 'Monto variable' END,'startDate',c.start_date);
  IF TG_OP='INSERT' THEN
   PERFORM public.khuba_enqueue_whatsapp('contract_registered','contract',NEW.id,transition,contractor,d);
   IF NEW.estado='registrado' THEN
    PERFORM public.khuba_enqueue_whatsapp('supervisor_contract_pending','contract',NEW.id,transition,supervisor,d||jsonb_build_object('operatorName',operator_name),problem);
   END IF;
  ELSE
   IF OLD.estado='devuelto' AND NEW.estado='corregido' THEN
    PERFORM public.khuba_enqueue_whatsapp('supervisor_contract_corrected','contract',NEW.id,transition,supervisor,d||jsonb_build_object('operatorName',operator_name),problem);
   ELSIF NEW.estado='registrado' THEN
    PERFORM public.khuba_enqueue_whatsapp('supervisor_contract_pending','contract',NEW.id,transition,supervisor,d||jsonb_build_object('operatorName',operator_name),problem);
   ELSIF actor_role='supervisor' AND OLD.estado IN ('registrado','corregido','devuelto') AND NEW.estado='en_ejecucion' THEN
    PERFORM public.khuba_enqueue_whatsapp('contract_approved','contract',NEW.id,transition,contractor,
     jsonb_build_object('contractNumber',d->'contractNumber','supervisorName',actor_name));
   ELSIF actor_role='supervisor' AND NEW.estado='devuelto' THEN
    PERFORM public.khuba_enqueue_whatsapp('contract_rejected','contract',NEW.id,transition,contractor,
     jsonb_build_object('contractNumber',d->'contractNumber','supervisorName',actor_name,'observations',jsonb_build_array(jsonb_build_object('documentType','CONTRATO','comment',NEW.comentarios_devolucion))));
   END IF;
  END IF;
 ELSE
  d:=jsonb_build_object('accountNumber',NEW.account_number,'contractNumber',coalesce(nullif(c.contract_number_original,''),c.contract_number),
   'billingMonth',(ARRAY['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'])[extract(month FROM NEW.billing_month)::integer]||' de '||extract(year FROM NEW.billing_month)::integer);
  IF TG_OP='INSERT' THEN
   PERFORM public.khuba_enqueue_whatsapp('billing_registered','billing',NEW.id,transition,contractor,d);
   IF NEW.status='pendiente_revision' THEN
    PERFORM public.khuba_enqueue_whatsapp('supervisor_billing_pending','billing',NEW.id,transition,supervisor,d||jsonb_build_object('operatorName',operator_name),problem);
   END IF;
  ELSE
   IF OLD.status='borrador' AND NEW.status='pendiente_revision' THEN
    PERFORM public.khuba_enqueue_whatsapp('supervisor_billing_pending','billing',NEW.id,transition,supervisor,d||jsonb_build_object('operatorName',operator_name),problem);
   ELSIF OLD.status='rechazada' AND NEW.status='pendiente_revision' THEN
    PERFORM public.khuba_enqueue_whatsapp('supervisor_billing_corrected','billing',NEW.id,transition,supervisor,d||jsonb_build_object('operatorName',operator_name),problem);
   ELSIF actor_role='supervisor' AND OLD.status='pendiente_revision' AND NEW.status='aprobada' THEN
    PERFORM public.khuba_enqueue_whatsapp('billing_approved','billing',NEW.id,transition,contractor,d||jsonb_build_object('supervisorName',actor_name));
   ELSIF actor_role='supervisor' AND OLD.status='pendiente_revision' AND NEW.status='rechazada' THEN
    PERFORM public.khuba_enqueue_whatsapp('billing_rejected','billing',NEW.id,transition,contractor,d||jsonb_build_object('supervisorName',actor_name,'observations',public.khuba_whatsapp_observations(NEW.comentario_supervisor)));
   END IF;
  END IF;
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.khuba_capture_whatsapp_transition() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER khuba_contract_notifications AFTER INSERT OR UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.khuba_capture_whatsapp_transition();
CREATE TRIGGER khuba_billing_notifications AFTER INSERT OR UPDATE ON public.billing_accounts FOR EACH ROW EXECUTE FUNCTION public.khuba_capture_whatsapp_transition();

CREATE FUNCTION public.khuba_process_whatsapp_outbox() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n public.whatsapp_notification_outbox%ROWTYPE; r record; config public.whatsapp_notification_settings%ROWTYPE;
 request bigint; target text; dispatched integer:=0; response_json jsonb; retryable boolean; accepted boolean; problem text; job bigint;
BEGIN
 IF NOT pg_try_advisory_xact_lock(734100025) THEN RETURN 0; END IF;
 SELECT * INTO config FROM public.whatsapp_notification_settings WHERE singleton;
 IF NOT coalesce(config.enabled,false) THEN RETURN 0; END IF;
 FOR n IN SELECT * FROM public.whatsapp_notification_outbox WHERE status='sending' FOR UPDATE SKIP LOCKED LOOP
  SELECT * INTO r FROM net._http_response WHERE id=n.request_id;
  IF NOT FOUND AND n.updated_at>now()-interval '2 minutes' THEN CONTINUE; END IF;
  response_json:=NULL;
  IF FOUND THEN
   BEGIN response_json:=r.content::jsonb; EXCEPTION WHEN OTHERS THEN response_json:=NULL; END;
   accepted:=r.status_code BETWEEN 200 AND 299 AND NOT coalesce(r.timed_out,false) AND r.error_msg IS NULL
    AND coalesce(response_json->>'success','true')<>'false' AND coalesce(response_json->>'ok','true')<>'false';
   retryable:=coalesce(r.timed_out,false) OR r.error_msg IS NOT NULL OR r.status_code IS NULL OR r.status_code IN (408,425,429) OR r.status_code>=500;
   problem:=CASE WHEN accepted THEN NULL ELSE coalesce(r.error_msg,r.content,'provider_rejected') END;
   UPDATE public.whatsapp_notification_attempts SET http_status=r.status_code,response_body=r.content,error=problem,completed_at=now() WHERE notification_id=n.id AND attempt_number=n.attempts;
   UPDATE public.whatsapp_notification_outbox SET http_status=r.status_code,last_response=r.content,last_error=problem,
    status=CASE WHEN accepted THEN 'accepted' WHEN retryable AND attempts<5 THEN 'retry' ELSE 'failed' END,
    accepted_at=CASE WHEN accepted THEN now() ELSE NULL END,
    whatsapp_message_id=coalesce(response_json#>>'{messages,0,id}',response_json->>'message_id'),
    next_attempt_at=CASE WHEN NOT accepted AND retryable AND attempts<5 THEN now()+make_interval(secs=>least(3600,(60*power(2,attempts-1))::integer)) ELSE NULL END
   WHERE id=n.id;
  ELSE
   -- Unknown outcome may have reached n8n: require manual reconciliation, never blindly duplicate.
   UPDATE public.whatsapp_notification_attempts SET error='response_missing_delivery_unknown',completed_at=now() WHERE notification_id=n.id AND attempt_number=n.attempts;
   UPDATE public.whatsapp_notification_outbox SET status='uncertain',last_error='response_missing_delivery_unknown',next_attempt_at=NULL WHERE id=n.id;
  END IF;
 END LOOP;
 FOR n IN SELECT * FROM public.whatsapp_notification_outbox WHERE status IN ('pending','retry') AND next_attempt_at<=now() ORDER BY created_at LIMIT 50 FOR UPDATE SKIP LOCKED LOOP
  target:=rtrim(config.base_url,'/')||public.khuba_whatsapp_path(n.event);
  BEGIN
   request:=net.http_post(url:=target,headers:=jsonb_build_object('Content-Type','application/json','Idempotency-Key',n.id::text),body:=n.payload,timeout_milliseconds:=10000);
   INSERT INTO public.whatsapp_notification_attempts(notification_id,attempt_number,request_id,webhook_url) VALUES(n.id,n.attempts+1,request,target);
   UPDATE public.whatsapp_notification_outbox SET status='sending',attempts=attempts+1,request_id=request,next_attempt_at=NULL WHERE id=n.id;
   dispatched:=dispatched+1;
  EXCEPTION WHEN OTHERS THEN
   INSERT INTO public.whatsapp_notification_attempts(notification_id,attempt_number,webhook_url,error,completed_at) VALUES(n.id,n.attempts+1,target,SQLERRM,now());
   UPDATE public.whatsapp_notification_outbox SET attempts=attempts+1,status=CASE WHEN attempts+1<5 THEN 'retry' ELSE 'failed' END,last_error=SQLERRM,next_attempt_at=CASE WHEN attempts+1<5 THEN now()+interval '5 minutes' ELSE NULL END WHERE id=n.id;
  END;
 END LOOP;
 IF EXISTS(SELECT 1 FROM public.whatsapp_notification_outbox WHERE status IN ('pending','retry','sending')) THEN
  IF NOT EXISTS(SELECT 1 FROM cron.job WHERE jobname='khuba-whatsapp-recovery') THEN
   PERFORM cron.schedule('khuba-whatsapp-recovery','* * * * *','SELECT public.khuba_process_whatsapp_outbox();');
  END IF;
 ELSE
  FOR job IN SELECT jobid FROM cron.job WHERE jobname='khuba-whatsapp-recovery' LOOP PERFORM cron.unschedule(job); END LOOP;
 END IF;
 RETURN dispatched;
END; $$;
REVOKE ALL ON FUNCTION public.khuba_process_whatsapp_outbox() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.khuba_process_whatsapp_outbox() TO service_role;
CREATE FUNCTION public.khuba_wake_whatsapp_outbox() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN PERFORM public.khuba_process_whatsapp_outbox(); RETURN NULL; END; $$;
REVOKE ALL ON FUNCTION public.khuba_wake_whatsapp_outbox() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER khuba_wake_whatsapp AFTER INSERT ON public.whatsapp_notification_outbox FOR EACH STATEMENT EXECUTE FUNCTION public.khuba_wake_whatsapp_outbox();