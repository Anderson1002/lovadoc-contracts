# KHUBA Pro visual modernization

- [x] Centralize institutional theme and shared tables, forms, dialogs and controls.
- [x] Adapt existing navigation and dashboard to the reference without changing options or data.
- [x] Audit authenticated routes and remaining old branding; retain semantic success/warning/error indicators.
- [x] Check shared presentation at all seven requested sizes and confirm login still renders.
- [ ] Verify full authenticated pages with real data — blocked: external unmanaged authentication provides no test session.

## WhatsApp notification integration
- [x] Audit ten transitions and configure specified production paths.
- [x] Add atomic persistent notification outbox, deduplication, dispatch and retries.
- [x] Retire duplicate legacy WhatsApp calls without changing emails or business rules.
- [x] Run controlled database tests without contacting real recipients and report verification limits.
- [x] Verify actual n8n/WhatsApp acceptance for the two authentic queued events (HTTP 202, provider IDs recorded).
- [x] Audit current dispatcher and authentic queued events, activate authorized production delivery, and report observed results.
- [ ] Inspect remaining eight n8n Webhook nodes/execution IDs and final delivery receipts — blocked: no accessible n8n connection or delivery callback; production sending remains enabled.