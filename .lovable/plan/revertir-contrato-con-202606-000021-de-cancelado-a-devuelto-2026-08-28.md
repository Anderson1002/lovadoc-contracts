# Revertir contrato CON-202606-000021 de "Cancelado" a "Devuelto"

## Contexto
El supervisor canceló por error el contrato **CON-202606-000021** (número original 013-07012026, OID 10, auditora administrativa). Actualmente está en estado `cancelado` (state_code `CAN`). Se necesita devolverlo al estado `devuelto` para que el empleado pueda corregirlo.

## Verificación previa (ya realizada)
- El contrato existe y está en `cancelado` / `CAN`.
- No hay ningún trigger de base de datos que bloquee la transición `cancelado → devuelto`; el único trigger sobre `contracts` solo actualiza `updated_at`.
- Los códigos válidos en `contract_states` incluyen `DEV` = Devuelto.
- El trigger `validate_contract_for_billing` impide crear cuentas de cobro salvo que el contrato esté `en_ejecucion`, así que no hay riesgo de cuentas nuevas mientras esté devuelto.

## Cambio propuesto (una sola sentencia UPDATE en la tabla `contracts`)
Para el contrato con id `1443ddfb-dc3b-4552-ba0c-9d79b5a1fa5d`:
- `estado` → `devuelto`
- `state_code` → `DEV`
- `comentarios_devolucion` → `"Devuelto por corrección administrativa: fue cancelado por error por el supervisor."`
- `updated_at` se actualiza automáticamente por el trigger existente.

## Alcance
- Solo cambio de datos en base de datos; no se toca código de la aplicación.
- No se modifica el historial (`contract_state_history`); si se desea, puedo registrar manualmente una entrada de auditoría del cambio — indícame si la quieres.
