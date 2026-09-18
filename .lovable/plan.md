# Contrato 001-2026 de Martín Andrés Ortiz Garnica

## Qué encontramos

- Contrato #6 (001-2026), valor $60.000.000, vigencia 1 ene 2026 a 31 dic 2026.
- Estado actual: **Completado**.
- Historial: el 15 jun 2026 pasó de Registrado a En ejecución, y el 17 sep 2026 alguien lo pasó manualmente de En ejecución a Completado.
- Por eso Martín ve el mensaje "solo pueden crearse para contratos aprobados y en ejecución": la pantalla de cuentas de cobro solo lista contratos en ejecución, y este ya no lo está.

El cambio fue manual; el sistema no cierra contratos por fecha.

## Acción pendiente (a la espera de confirmación)

Consultar con el supervisor si el paso a Completado fue correcto.

- Si fue un error: devolver el contrato a **En ejecución** (con registro en el historial indicando el motivo). Martín podrá radicar cuentas de cobro de nuevo.
- Si fue correcto: no se hace nada y el contrato queda cerrado.

No se realiza ningún cambio hasta tener esa confirmación.

## Detalle técnico

- Contrato: `contracts.id = cb51087d-1306-4bf9-bc3c-312fc33d6d95`, `estado = completado`, `state_code = COM`.
- Reversión, si se aprueba: actualizar `estado` a `en_ejecucion` y `state_code` a `EJE`, e insertar la fila correspondiente en `contract_state_history` con el comentario del motivo.
- Filtro que causa el mensaje: `.in('estado', ['en_ejecucion'])` en `src/pages/BillingAccounts.tsx` y `src/components/billing/CreateBillingAccountDialog.tsx` (no requiere cambios).
