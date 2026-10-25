# Project rules

- Keep login styling and theme overrides scoped to the authentication screen so visual changes cannot affect other modules or shared authentication behavior.
- Maintain the internal visual identity through global semantic tokens and shared presentation components; keep authentication overrides isolated so visual modernization never changes workflow or permission logic.
- Generate WhatsApp events through transaction-bound database triggers and dispatch a protected outbox with pg_net; arm one retry job only while work remains, so browser and email retries cannot duplicate business notifications.