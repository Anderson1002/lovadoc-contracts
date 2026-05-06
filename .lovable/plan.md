## Confirmado
La cuenta #1 (COB-202605-001) ya está en estado **Rechazada** con la observación del supervisor. El OPS podrá editarla.

## Ajuste pendiente: hacer obligatorio el Desglose de Aportes

Actualmente los 9 campos de Salud / Pensión / ARL (número, valor, fecha) son opcionales. Hay que volverlos obligatorios para poder enviar a revisión.

### 1. `src/components/billing/BillingCompletionProgress.tsx`
Extender props con los 9 campos del desglose y reemplazar la sección **"Planilla de Seguridad Social"** por:
- **Planilla (archivo + datos generales)** — sigue requiriendo `planillaNumero`, `planillaValor`, `planillaFecha`, `planillaFile`.
- **Desglose de Aportes (Salud, Pensión, ARL)** — nueva sección que requiere los 9 campos. Lista de faltantes por bloque (ej. "Salud: número, fecha", "ARL: valor").

### 2. `src/pages/EditBillingAccount.tsx`
- Añadir `desgloseComplete` y sumarlo a `informeComplete` (línea 143–149):
  ```ts
  const desgloseComplete = !!(
    saludNumero && saludValor && saludFecha &&
    pensionNumero && pensionValor && pensionFecha &&
    arlNumero && arlValor && arlFecha
  );
  const informeComplete = ... && desgloseComplete;
  ```
- Cambiar `CardDescription` (línea 1453): `"... (opcional)"` → `"... (obligatorio)"`.
- Marcar los 9 labels con asterisco `*`.
- Pasar las 9 props nuevas al `<BillingCompletionProgress />`.

### 3. `src/components/billing/CreateBillingAccountDialog.tsx`
- Misma validación: bloquear creación/envío si falta cualquier campo del desglose.
- Labels con `*` y quitar "(opcional)".
- Pasar 9 props nuevas al `<BillingCompletionProgress />`.

### 4. `src/components/billing/EditBillingAccountDialog.tsx`
Este diálogo legacy no maneja desglose. Dos opciones:
- **(a)** Dejarlo como está (solo edita campos básicos en `borrador` antes del flujo principal). 
- **(b)** Añadir los 9 campos para consistencia.

Recomiendo **(a)** porque el flujo real de edición/envío vive en `EditBillingAccount.tsx` (página completa). Confirmo si prefieres (b).

### 5. Memoria
Actualizar `mem://billing/social-security-contributions-breakdown` para reflejar que el desglose es **obligatorio** antes de enviar a revisión.

## Resultado
- Botón **"Enviar a Revisión"** queda deshabilitado hasta completar los 9 campos del desglose.
- El indicador de progreso muestra exactamente cuáles faltan, agrupados por Salud/Pensión/ARL.
- El OPS, al editar la cuenta #1 rechazada, no podrá reenviarla sin completar el desglose.
