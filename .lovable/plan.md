
# Plan: Super Admin como Auditor / Soporte

## Filosofía del rol
El Super Admin **NO opera** (no crea contratos ni cuentas de cobro). Es:
- **Auditor/soporte**: cuando un usuario reporta "no veo mi contrato", "no carga el PDF", "se perdió la cuenta", entra y diagnostica.
- **Único gestor de usuarios, roles, procesos y configuración**.

## Cambios a implementar

### 1. `src/pages/Dashboard.tsx`

**Header:**
- Quitar `super_admin` del condicional del botón "Nuevo Contrato" (línea 268). Solo `admin` y `employee` lo conservan.
- Título exclusivo: *"Panel Super Administrador — Auditoría y Soporte"*.
- Descripción: *"Visualización global del sistema, gestión de usuarios y soporte"*.

**Carga de datos (`loadDashboardData`):**
Cuando `roleName === 'super_admin'`, agregar consultas globales:
- `totalBillingAccounts` (todas), desglose por estado: `borrador`, `pendiente_revision`, `aprobada`, `rechazada`, `causada`.
- `totalUsers`, `usersWithoutProcess` (profiles con role employee/supervisor sin `proceso_id`).
- `stuckBillingAccounts`: cuentas en `pendiente_revision` con `enviado_el < now() - 15 días`.
- `orphanContracts`: contratos sin `client_profile_id`.
- `recentImports`: count `contract_imports` última semana (si la tabla existe; verificar primero).

**Bloques de UI (rama nueva `userRole === 'super_admin'`)** — colocar antes del bloque actual admin/treasury (línea 560):

**Bloque A — "Consulta y Soporte"** (4 tarjetas):
1. Consultar Contratos → `/contracts/query`
2. Consultar Cuentas de Cobro → **`/billing/all`** (nueva vista)
3. Importaciones → `/contract-imports`
4. Notificaciones → `/notifications`

**Bloque B — "Administración del Sistema"** (4 tarjetas):
1. Usuarios → `/users`
2. Roles y Permisos → `/users/roles`
3. Procesos → `/procesos`
4. Configuración → `/settings`

**Bloque C — "Diagnóstico"** (Card con lista de alertas, cada una linkeable):
- ⚠️ X usuarios sin proceso asignado → `/users?filter=sin_proceso`
- 🕐 X cuentas atascadas >15 días en revisión → `/billing/all?filter=stuck`
- 📋 X contratos sin contratista vinculado → `/contracts/query?filter=sin_cliente`
- Mostrar "Todo en orden" si todas son 0.

**Excluir super_admin** del bloque admin/treasury actual (línea 560): cambiar a `["admin", "treasury"].includes(userRole)`.

### 2. Nueva ruta `/billing/all` — vista global solo lectura

Crear `src/pages/AllBillingAccounts.tsx` y ruta en `App.tsx` con guard `super_admin` only.

Características:
- Tabla con todas las `billing_accounts` (RLS ya permite a super_admin ver todas).
- Columnas: OID, número de cuenta, contratista, contrato, mes, monto, estado (badge), fecha envío, supervisor revisor.
- Filtros: estado, contratista (search), proceso, rango de fechas, filtro `?filter=stuck`.
- Paginación (10/25/50/100, por defecto 10 — patrón ya implementado en ContractImports).
- Acción única por fila: **"Ver"** → abre dialog/sheet con los 3 previews (Informe / Certificación / Cuenta de Cobro) usando los componentes `BillingDocumentPreview`, `CertificationPreview`, `InvoicePreview` ya existentes, en modo solo lectura.
- Sin botones de Editar/Eliminar/Aprobar/Rechazar.

### 3. Bloqueo de rutas de creación/edición para super_admin

Agregar guard en componentes/páginas:
- `src/pages/CreateContract.tsx`: si rol es `super_admin` → redirigir a `/contracts/query` con toast informativo.
- `src/pages/EditContract.tsx`: si `super_admin` → redirigir a `/contracts/:id` (vista lectura).
- `src/pages/EditBillingAccount.tsx`: si `super_admin` → redirigir a `/billing/all` con toast.
- `src/pages/BillingAccounts.tsx` (la actual `/billing` del contratista): si `super_admin` → redirigir a `/billing/all`.
- Patrón a usar: `useEffect` con `getUserRole`, esperar `useRoleLoadingGuard` ya establecido en el proyecto.

### 4. Sidebar (`src/components/ui/app-sidebar.tsx`)

- Ocultar "Nuevo Contrato" (`/contracts/new`) para `super_admin` — quitarlo del array `roles`.
- Cambiar "Informe de Actividades", "Certificación", "Cuenta de Cobro", "Apoyo Supervisor" bajo `/billing` para super_admin: reemplazar por un único item **"Consulta Global Cuentas"** → `/billing/all`.
- Agregar item "Importaciones de Contratos" → `/contract-imports` (solo super_admin / admin).

### 5. Memoria
Guardar `mem://dashboard/super-admin-auditor-role` con la regla:
> "Super Admin no crea ni edita contratos/cuentas. Solo visualiza, gestiona usuarios/roles/procesos/configuración y atiende soporte. Ruta `/billing/all` es exclusiva para vista global solo lectura."

## Detalles técnicos
- RLS ya cumple: `billing_accounts_select_policy` permite a super_admin ver todas.
- Reutilizar componentes existentes: `BillingDocumentPreview`, `CertificationPreview`, `InvoicePreview`, `BillingAccountStatusBadge`.
- Sin migraciones de BD — todos los datos existen.
- Sin nuevas edge functions.
- Mantener tokens semánticos del design system; sin colores hardcoded.

## Archivos a editar/crear
- `src/pages/Dashboard.tsx` (editar)
- `src/pages/AllBillingAccounts.tsx` (crear)
- `src/App.tsx` (agregar ruta `/billing/all`)
- `src/components/ui/app-sidebar.tsx` (editar)
- `src/pages/CreateContract.tsx` (guard)
- `src/pages/EditContract.tsx` (guard)
- `src/pages/EditBillingAccount.tsx` (guard)
- `src/pages/BillingAccounts.tsx` (guard de redirect)
- `mem://dashboard/super-admin-auditor-role` (crear)
- `mem://index.md` (registrar memoria nueva)

## Fuera de alcance (futuro)
- Logs de auditoría detallados por acción.
- Edición masiva de usuarios desde dashboard.
- Exportación de reportes globales en CSV/PDF.
