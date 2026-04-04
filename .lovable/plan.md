

# Plan: Campos protegidos siempre deshabilitados para empleados

## Problema

Cuando el supervisor devuelve un contrato, `canEdit` se vuelve `true` para el empleado y TODOS los campos se habilitan. Pero los campos CDP, RP, Numero de Contrato, Descripcion y Valor Total deben ser **siempre de solo lectura** para empleados, incluso cuando el contrato esta devuelto. Estos datos vienen de fuentes externas y el empleado no debe modificarlos.

## Que puede editar el empleado cuando el contrato esta devuelto

- Fecha de Inicio
- Fecha de Fin
- Tipo de Contrato
- Subir contrato firmado (PDF)

## Que debe permanecer siempre bloqueado para empleados

- Numero de Contrato
- CDP
- RP
- Descripcion / Objeto del Contrato
- Valor Total
- Cliente (ya esta bloqueado correctamente)

## Cambio

En `src/pages/EditContract.tsx`, cambiar el `disabled` de los 5 campos protegidos de `disabled={!canEdit}` a `disabled={isEmployee || !canEdit}`:

- `contract_number`: siempre disabled si es employee
- `cdp`: siempre disabled si es employee
- `rp`: siempre disabled si es employee
- `description`: siempre disabled si es employee
- `total_amount`: siempre disabled si es employee

Los campos de fechas, tipo de contrato y subida de PDF mantienen `disabled={!canEdit}` para que se habiliten cuando el contrato esta devuelto.

## Archivo afectado

| Archivo | Cambio |
|---------|--------|
| `src/pages/EditContract.tsx` | Cambiar disabled en 5 campos para que sean siempre readonly para employee |

