# Plan: Dashboard dedicado para rol Supervisor

## Problema
El supervisor actualmente comparte el bloque de "Acciones Rápidas" con admin/treasury en `src/pages/Dashboard.tsx`, lo que produce inconsistencias con su rol de auditor:

- Ve "Crear Contrato" (`/contracts/new`) — no tiene permiso.
- Ve "Administrar Usuarios" (`/users`) — no tiene permiso.
- "Cuentas de Cobro" apunta a `/billing-accounts` — ruta inexistente (404). La correcta es `/billing`.
- No tiene acceso directo a las tareas centrales: revisar contratos en estado `registrado` y cuentas en estado `enviada` / `re-enviada`.

## Cambios a implementar

### 1. Separar el bloque del Supervisor en `src/pages/Dashboard.tsx`
Añadir una rama dedicada `userRole === "supervisor"` (antes del bloque actual de admin/treasury) con tarjeta "Acciones de Supervisión":

- **Revisar Contratos Pendientes** → `/contracts?estado=registrado` (badge con `stats.pendingReview`).
- **Revisar Cuentas de Cobro** → `/billing?estado=enviada` (mostrar contador de cuentas enviadas/re-enviadas).
- **Consultar Contratos** → `/contracts/query` (auditoría histórica).
- **Notificaciones** → `/notifications` (alertas del proceso).

### 2. Corregir ruta `/billing-accounts` → `/billing`
Reemplazar todas las ocurrencias de `/billing-accounts` por `/billing` en:
- `src/pages/Dashboard.tsx` (bloques employee y admin/treasury).
- `src/components/dashboard/BillingSummaryCard.tsx` (botón "Ver todas").

### 3. Cargar contador de cuentas pendientes para Supervisor
En `loadDashboardData()` agregar consulta cuando `userRole === 'supervisor'`:
- Contar `billing_accounts` con estado `enviada` o `re-enviada` filtradas por proceso del supervisor.
- Guardar en un nuevo campo `pendingBillingReview` del estado.

### 4. Excluir al Supervisor del bloque admin/treasury
Cambiar la condición actual `["super_admin", "admin", "supervisor", "treasury"].includes(userRole)` para que NO incluya `supervisor`.

## Detalles técnicos
- Mantener el patrón visual de tarjetas existente (Card + grid 4 columnas).
- Reusar `ContractStatusBadge` / iconos `Clock`, `FileText`, `DollarSign`, `Bell`.
- No modificar lógica de carga de stats existentes — solo extender.
- Sin cambios de DB ni edge functions.

## Archivos a editar
- `src/pages/Dashboard.tsx`
- `src/components/dashboard/BillingSummaryCard.tsx`
