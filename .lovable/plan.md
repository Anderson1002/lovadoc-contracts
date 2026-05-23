# Mejorar /billing para el rol Empleado

## Diagnóstico

**1. Pestañas redundantes** — Como `employee`, ves 3 pestañas pero `Mis Cuentas` y `Todas las Cuentas` traen exactamente lo mismo (RLS ya filtra a las tuyas). `Comentarios` mezcla observaciones aunque no tengas devoluciones.

**2. "Ejecución 50%" en ambas filas** — No es bug. La columna muestra la ejecución acumulada del **contrato** (no de la cuenta). Ambas cuentas pertenecen al contrato `001-2026` (valor 12M), y como solo hay 1 cuenta aprobada de 6M → contrato al 50%. La borrador hereda visualmente el mismo % porque es del mismo contrato.

---

## Cambios propuestos

### A. Reestructurar pestañas para empleado

Reemplazar las 3 pestañas actuales por una vista mucho más clara, orientada a acciones:

```text
[ Pendientes (2) ]  [ Aprobadas (1) ]  [ Devueltas (0) ]  [ Historial ]
```

- **Pendientes**: estados `borrador` + `pendiente_revision` + `en_revision` → lo que requiere su acción o está en revisión.
- **Aprobadas**: `aprobada` + `causada` + `en_pago` + `pagada` → ya están OK.
- **Devueltas**: `rechazada` → necesitan corrección urgente, con badge rojo y observaciones del supervisor visibles inline.
- **Historial**: todas, igual a la antigua "Todas las Cuentas" (sirve para buscar por período/contrato).

La pestaña `Comentarios` se elimina para empleados (las observaciones ya aparecen inline en las devueltas). Para supervisor/admin/treasury se mantiene la lógica actual sin cambios.

### B. Aclarar columna "Ejecución"

Renombrar la columna `Ejecución` → **`Ejecución contrato`** y añadir un `Tooltip` con texto:

> "Porcentaje acumulado del contrato (suma de cuentas aprobadas y causadas ÷ valor total). No corresponde a esta cuenta individual."

Así se entiende inmediatamente por qué dos filas del mismo contrato comparten el mismo %.

### C. Indicador adicional (opcional, mismo cambio)

Agregar un pequeño badge bajo el % cuando la cuenta está en `borrador` / `pendiente_revision`:

> `+ esta cuenta sumaría al X%` (calculando hipotético total si se aprobara)

Esto da contexto sin confundir.

---

## Archivos a modificar

- `src/pages/BillingAccounts.tsx` — nueva estructura de pestañas para `employee`, contadores por estado.
- `src/components/billing/BillingAccountsList.tsx` — nuevo prop `statusFilter?: string[]`, renombrar columna y agregar tooltip.

## Detalles técnicos

- Contadores: una query agrupada por `status` filtrada por `created_by = userProfile.id` al cargar la página.
- Tooltip: usar `@/components/ui/tooltip` (ya en uso).
- No se tocan RLS, edge functions ni la lógica de cálculo de ejecución.
- Roles supervisor/admin/treasury → comportamiento intacto.
