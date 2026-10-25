-- Simulate n8n responses entirely inside PostgreSQL; never issue HTTP requests.
DO $test$
DECLARE notification uuid:=gen_random_uuid(); transition uuid:=gen_random_uuid(); marker text;
BEGIN
 IF EXISTS(SELECT 1 FROM public.whatsapp_notification_settings WHERE enabled) THEN RAISE EXCEPTION 'Dispatch must be disabled for isolated tests'; END IF;
 IF EXISTS(SELECT 1 FROM public.whatsapp_notification_outbox WHERE status IN ('pending','retry','sending')) THEN RAISE EXCEPTION 'Recovery tests require empty live queue'; END IF;
 BEGIN
  INSERT INTO public.whatsapp_notification_outbox(id,event,entity_type,entity_id,transition_id,recipient_key,payload,status,attempts,request_id)
  VALUES(notification,'billing_registered','billing',gen_random_uuid(),transition,'test','{}','sending',1,-734100025);
  INSERT INTO public.whatsapp_notification_attempts(notification_id,attempt_number,request_id,webhook_url) VALUES(notification,1,-734100025,'https://test.invalid');
  INSERT INTO net._http_response(id,status_code,content,timed_out) VALUES(-734100025,200,'{"messages":[{"id":"test-message"}]}',false);
  UPDATE public.whatsapp_notification_settings SET enabled=true WHERE singleton;
  PERFORM public.khuba_process_whatsapp_outbox();
  IF NOT EXISTS(SELECT 1 FROM public.whatsapp_notification_outbox WHERE id=notification AND status='accepted' AND http_status=200 AND whatsapp_message_id='test-message' AND delivered_at IS NULL) THEN RAISE EXCEPTION 'Acceptance must not imply delivery'; END IF;
  UPDATE net._http_response SET status_code=429,content='{"error":"rate limit"}',headers='{"retry-after":"120"}' WHERE id=-734100025;
  UPDATE public.whatsapp_notification_outbox SET status='sending',attempts=1 WHERE id=notification;
  PERFORM public.khuba_process_whatsapp_outbox();
  IF NOT EXISTS(SELECT 1 FROM public.whatsapp_notification_outbox WHERE id=notification AND status='retry' AND next_attempt_at>now() AND http_status=429) THEN RAISE EXCEPTION '429 must schedule recoverable retry'; END IF;
  IF NOT EXISTS(SELECT 1 FROM cron.job WHERE jobname='khuba-whatsapp-recovery') THEN RAISE EXCEPTION 'Recovery must remain armed'; END IF;
  UPDATE net._http_response SET status_code=400,content='{"error":"invalid payload"}' WHERE id=-734100025;
  UPDATE public.whatsapp_notification_outbox SET status='sending' WHERE id=notification;
  PERFORM public.khuba_process_whatsapp_outbox();
  IF NOT EXISTS(SELECT 1 FROM public.whatsapp_notification_outbox WHERE id=notification AND status='failed' AND next_attempt_at IS NULL) THEN RAISE EXCEPTION 'Permanent 400 must not retry'; END IF;
  IF EXISTS(SELECT 1 FROM cron.job WHERE jobname='khuba-whatsapp-recovery') THEN RAISE EXCEPTION 'Recovery job must stop after drain'; END IF;
  UPDATE net._http_response SET status_code=503,content='unavailable' WHERE id=-734100025;
  UPDATE public.whatsapp_notification_outbox SET status='sending',attempts=5 WHERE id=notification;
  PERFORM public.khuba_process_whatsapp_outbox();
  IF NOT EXISTS(SELECT 1 FROM public.whatsapp_notification_outbox WHERE id=notification AND status='failed') THEN RAISE EXCEPTION 'Retry limit must stop at five attempts'; END IF;
  UPDATE net._http_response SET status_code=200,content='{"success":false}' WHERE id=-734100025;
  UPDATE public.whatsapp_notification_outbox SET status='sending',attempts=1 WHERE id=notification;
  PERFORM public.khuba_process_whatsapp_outbox();
  IF NOT EXISTS(SELECT 1 FROM public.whatsapp_notification_outbox WHERE id=notification AND status='failed') THEN RAISE EXCEPTION 'HTTP 200 with success false must not be accepted'; END IF;
  UPDATE public.whatsapp_notification_outbox SET status='sending',request_id=-734100026,updated_at=now()-interval '5 minutes' WHERE id=notification;
  -- The updated_at trigger resets the timestamp, so use transaction-local time only through response timeout tests.
  UPDATE net._http_response SET status_code=NULL,timed_out=true,error_msg='timeout' WHERE id=-734100025;
  UPDATE public.whatsapp_notification_outbox SET request_id=-734100025,status='sending' WHERE id=notification;
  PERFORM public.khuba_process_whatsapp_outbox();
  IF NOT EXISTS(SELECT 1 FROM public.whatsapp_notification_outbox WHERE id=notification AND status IN ('retry','uncertain')) THEN RAISE EXCEPTION 'Timeout must remain recoverable or uncertain'; END IF;
  RAISE EXCEPTION USING MESSAGE='KHUBA_RECOVERY_ROLLBACK_OK';
 EXCEPTION WHEN raise_exception THEN
  GET STACKED DIAGNOSTICS marker=MESSAGE_TEXT;
  IF marker<>'KHUBA_RECOVERY_ROLLBACK_OK' THEN RAISE; END IF;
 END;
 IF EXISTS(SELECT 1 FROM public.whatsapp_notification_outbox WHERE id=notification) OR EXISTS(SELECT 1 FROM public.whatsapp_notification_settings WHERE enabled) THEN RAISE EXCEPTION 'Recovery test rollback failed'; END IF;
 RAISE NOTICE 'PASS: acceptance vs delivery, 429 retries, permanent 400, five-attempt limit, failed 200 body, timeouts, schedule drain and rollback; zero HTTP requests';
END $test$;