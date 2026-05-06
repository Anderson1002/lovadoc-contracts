## Problema confirmado

La BD tiene el contrato correcto:
- Inicio: **2026-01-01**, Fin: **2026-02-28**

Pero la UI muestra: **31 dic 2025 → 27 feb 2026** (un día menos).

**Causa:** las tablas usan `new Date("2026-01-01").toLocaleDateString(...)`. JS interpreta el string como UTC medianoche y al renderizar en hora local Colombia (UTC-5) retrocede 1 día. Ya existe la utilidad `parseLocalDate` en `src/lib/utils.ts` para evitarlo (regla en memoria Core).

## Solución

Reemplazar todos los `new Date(dateString)` aplicados a fechas tipo `YYYY-MM-DD` provenientes de la BD por `parseLocalDate(dateString)` en las vistas afectadas.

### Archivos a corregir (prioridad por contratos/cuentas)

1. `src/components/contracts/ContractTable.tsx` — función `formatDate` (causa visible actual).
2. `src/components/contracts/ContractQueryTable.tsx`
3. `src/components/contracts/ContractDetailPanel.tsx`
4. `src/pages/EditContract.tsx`
5. `src/pages/SupervisorContractReview.tsx`
6. `src/components/dashboard/UpcomingExpirations.tsx`
7. `src/components/billing/BillingAccountsList.tsx`
8. `src/components/billing/BillingAccountActions.tsx`
9. `src/components/billing/BillingReviewList.tsx`
10. `src/components/billing/BillingReviewHistory.tsx`
11. `src/components/billing/CreateBillingAccountDialog.tsx`
12. `src/components/billing/InvoicePreview.tsx`
13. `src/pages/EditBillingAccount.tsx` (revisar usos restantes)
14. `src/pages/Notifications.tsx`, `Users.tsx`, `Procesos.tsx` — solo si formatean fechas tipo `date` de BD (no `created_at` timestamps con hora, que sí son UTC reales).

### Regla aplicada

- Campos `date` puros (`start_date`, `end_date`, `billing_month`, `report_delivery_date`, `invoice_date`, `fecha_cdp`, `fecha_rp`, `*_planilla_fecha`, `certification_date`) → `parseLocalDate`.
- Campos `timestamp with time zone` (`created_at`, `updated_at`, `enviado_el`, `last_login`) → seguir usando `new Date(...)`.

### Verificación post-cambio

Volver a `/contracts?estado=registrado` y confirmar que el contrato OID #1 muestra **1 ene 2026 → 28 feb 2026**.

No requiere migraciones de BD ni cambios de esquema.
