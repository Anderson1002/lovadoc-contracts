DO $fix$
DECLARE source text;
BEGIN
 SELECT pg_get_functiondef('public.khuba_process_whatsapp_outbox()'::regprocedure) INTO source;
 source:=replace(source,'IF NOT coalesce(config.enabled,false) THEN RETURN 0; END IF;',
 'IF NOT coalesce(config.enabled,false) THEN FOR job IN SELECT jobid FROM cron.job WHERE jobname=''khuba-whatsapp-recovery'' LOOP PERFORM cron.unschedule(job); END LOOP; RETURN 0; END IF;');
 source:=replace(source,'status=CASE WHEN accepted THEN ''accepted'' WHEN retryable AND attempts<5 THEN ''retry'' ELSE ''failed'' END,',
 'status=CASE WHEN accepted THEN ''accepted'' WHEN coalesce(r.timed_out,false) OR r.error_msg IS NOT NULL THEN ''uncertain'' WHEN retryable AND attempts<5 THEN ''retry'' ELSE ''failed'' END,');
 source:=replace(source,'next_attempt_at=CASE WHEN NOT accepted AND retryable AND attempts<5 THEN now()+make_interval(secs=>least(3600,(60*power(2,attempts-1))::integer)) ELSE NULL END',
 'next_attempt_at=CASE WHEN NOT accepted AND retryable AND attempts<5 AND NOT coalesce(r.timed_out,false) AND r.error_msg IS NULL THEN now()+make_interval(secs=>greatest(least(3600,(60*power(2,attempts-1))::integer),CASE WHEN coalesce(r.headers->>''retry-after'',r.headers->>''Retry-After'','''') ~ ''^[0-9]{1,6}$'' THEN coalesce(r.headers->>''retry-after'',r.headers->>''Retry-After'')::integer ELSE 0 END)) ELSE NULL END');
 EXECUTE source;
END $fix$;
CREATE FUNCTION public.khuba_whatsapp_settings_wake() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.enabled IS DISTINCT FROM OLD.enabled THEN PERFORM public.khuba_process_whatsapp_outbox(); END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.khuba_whatsapp_settings_wake() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER khuba_whatsapp_settings_wake AFTER UPDATE ON public.whatsapp_notification_settings FOR EACH ROW EXECUTE FUNCTION public.khuba_whatsapp_settings_wake();