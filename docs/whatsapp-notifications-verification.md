# KHUBA WhatsApp integration — verification report

## Implemented
- Ten production event paths centrally mapped by `public.khuba_whatsapp_path`.
- Transactional AFTER triggers on `contracts` and `billing_accounts` persist each confirmed event and its database-derived recipient and payload before network dispatch.
- No historical backfill. Contract `registrado` is reviewable in the existing workflow; saving a returned contract already transitions to `corregido` as formal resubmission. Billing creation is a draft and notifies only its owner; supervisor notification waits for radication.
- Explicit assigned supervisor first; a single same-process supervisor is the fallback. Missing phones, missing recipients and ambiguous supervisors produce visible-to-administration blocked records rather than arbitrary sends.
- Protected outbox plus per-attempt audit; unique transition/event/recipient keys; row locks and advisory lock prevent concurrent claims.
- Server-side `pg_net` POST, JSON content type, stable Idempotency-Key header, fixed event paths, configurable production domain. No browser webhook requests.
- Five maximum automatic attempts for explicit recoverable HTTP errors. Exponential wait and numeric Retry-After are respected. Timeout/network-unknown outcomes are retained as uncertain for reconciliation instead of risking duplicate delivery.
- HTTP acceptance is not WhatsApp delivery. Message ID is captured only when returned; `delivered_at` is never inferred from HTTP 200. No provider callback has been connected because none was supplied.
- Immediate wake on enqueue; one minute-based response/retry job only while work remains, removed after drain or pause. Maximum 1,440 checks/day if continuously busy; otherwise none while idle. Responses normally become visible within one minute.
- Admin-only `whatsapp-notifications` endpoint supports status, pause/enable, and processing; trusted role checked server-side. No UI, permission assignment or business workflow changes.

## Files changed
- `src/pages/CreateContract.tsx`, `src/pages/EditContract.tsx`: removed direct legacy WhatsApp calls, leaving operations and presentation unchanged.
- `supabase/functions/notify-billing-submission/index.ts`, `notify-billing-approval/index.ts`, `notify-billing-rejection/index.ts`: preserved SMTP; removed duplicate WhatsApp dispatch.
- `supabase/functions/notify-whatsapp-supervisor/index.ts`: retired unused legacy business endpoint.
- `supabase/functions/notify-whatsapp/index.ts`: rejects legacy business events; preserves the independent existing expiry notification.
- `supabase/functions/whatsapp-notifications/index.ts`: authenticated administration and environment configuration.
- Tool-managed `supabase/migrations/20261025*.sql`: tables, explicit grants/RLS, triggers, dispatch, fixes and controlled rollback tests.
- `scripts/test-whatsapp-outbox.sql`, `scripts/test-whatsapp-recovery.sql`: retained reproducible regression tests.
- `AGENTS.md`, `roadmap.md`: architecture rule and outstanding verification gates.

## Actual test results
Database tests executed through the migration service, with all fixture mutations reverted inside subtransactions:
- PASS: all ten events generated for registration, approval, return, correction and radication.
- PASS: contractor/supervisor recipient resolution; original contract number; October 2026 month text; actor name.
- PASS: exact saved observations including multiline comments.
- PASS: no duplicate from unchanged state, draft save or repeated enqueue.
- PASS: fixtures and their events rolled back; no test HTTP sends.
- PASS: simulated HTTP 200 acceptance and message ID without delivered timestamp.
- PASS: simulated 429 respects 120-second Retry-After; recovery job stays armed.
- PASS: simulated 400 and fifth 503 attempt stop retries; schedule stops after drain.
- PASS: simulated 200 with `success:false` is rejected; timeout becomes uncertain with no automatic resend.
- Edge functions deployed successfully; application preview build reported OK.

## Not verified / activation gate
Delivery is intentionally disabled pending a controlled authorized end-to-end check. Real business events continue to be durably queued, not dropped. The ten supplied paths are configured, but were not checked against Webhook nodes because no accessible n8n connection exists. No production POST or real WhatsApp test was sent. No authenticated browser test is available for this external Supabase project.

Next requirement: authorize one controlled recipient and provide access to inspect existing n8n workflow URLs/response contracts. Confirm whether n8n deduplicates the Idempotency-Key header; exactly-once external delivery cannot be guaranteed solely by KHUBA if a workflow partially sends before returning an error. Then enable through the authenticated administration endpoint. Unknown/blocked/failed events must be reconciled before any manual resend.

Seven pre-existing Supabase warnings were reported, unrelated to these migrations: public/signed-in execution of older security-definer functions, long OTP expiry, disabled leaked-password protection and available PostgreSQL security patches. They were not changed because authentication and permissions were outside scope.