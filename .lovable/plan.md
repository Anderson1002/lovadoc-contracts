
# Plan: Crear nuevo rol "Jurídica" con CRUD de contratos

## Análisis de la situación actual

**Roles existentes en BD** (`user_role_type`): `super_admin`, `admin`, `supervisor`, `employee`, `treasury`.

**Tabla `contract`** (datos importados externos, 14 columnas):
- `OID`, `CONTRATO`, `CDP`, `FECHA CDP`, `RP`, `FECHA RP`, `TERCERO`, `DESCRIP_TERCERO`, `VALOR_INICIAL`, `MODIFIC_DEBITO`, `MODIFIC_CREDITO`, `VALOR EJECUTADO`, `SALDO RP`, `OBSERVACION RP`.
- Hoy es solo lectura y se filtra por `TERCERO = profiles.document_number` (employee solo ve los suyos).

**Tabla `contracts`** (registros internos del sistema): es la principal del CRUD ya implementado en `/contracts`, `/contracts/new`, `/contracts/:id/edit`, etc.

## Decisiones de alcance (defaults razonables)

Como no se respondieron las preguntas, asumo lo siguiente — perfil de "abogada corporativa" típico:

1. **Acceso transversal** a todos los contratos del sistema (sin restricción por proceso, como admin pero sin tocar usuarios).
2. **CRUD completo sobre `contracts`**: crear, editar, ver, sin las restricciones de campos del employee.
3. **Gestión de estados**: puede aprobar, devolver y cancelar contratos (igual que un supervisor pero sin filtro de proceso).
4. **Tabla `contract` (importada)**: lectura completa (sin filtro por TERCERO) para soporte legal.
5. **Cuentas de cobro**: solo lectura (no aprueba, eso queda para supervisor/tesorería).
6. **Usuarios y Procesos**: NO accede.
7. **Dashboard**: ve stats globales de contratos (no de cobros).
8. **No requiere `proceso_id`** asignado.

## Cambios en base de datos

### 1. Agregar valor al enum `user_role_type`
```sql
ALTER TYPE user_role_type ADD VALUE 'juridica';
```

### 2. Insertar el rol en `roles`
```sql
INSERT INTO roles (name, display_name) VALUES ('juridica', 'Jurídica');
```

### 3. Actualizar políticas RLS

**`contracts`** — agregar `juridica` a SELECT/INSERT/UPDATE como admin (acceso global):
- `contracts_select_policy`: añadir `'juridica'` al ARRAY de roles con acceso total.
- `contracts_insert_policy`: añadir `'juridica'`.
- `contracts_update_policy`: añadir `'juridica'`.

**`contract`** (importada) — nueva política para que jurídica vea todo:
```sql
CREATE POLICY contract_select_juridica ON contract
FOR SELECT USING (get_user_role(auth.uid()) IN ('super_admin','admin','juridica'));
```

**`contract_state_history`**: añadir `juridica` a SELECT e INSERT para que pueda registrar cambios de estado.

**`billing_accounts`**: añadir `juridica` solo en SELECT (lectura).

**`documents`**: añadir `juridica` para ver documentos contractuales.

**`profiles`**: ajustar `profiles_select_policy` para que jurídica pueda ver perfiles de clientes (necesario al ver detalles de contrato).

### 4. Triggers existentes

Los triggers `enforce_cuenta_update_columns`, `validate_cuenta_transition`, `validate_billing_account_ownership` validan por rol — no requieren cambio porque jurídica NO escribe en billing.

## Cambios de frontend

### A. Navegación (`src/components/ui/professional-nav.tsx`)
`getFilteredMenuItems()` — agregar reglas para `juridica`:
- Ve: Dashboard, Control de Contratos (todas las opciones), Cuentas de Cobro (solo lectura), Notificaciones, Mi Perfil.
- NO ve: Usuarios, Procesos.
- Ítem nuevo opcional: "Datos Importados" → `/contract-imports` (vista de la tabla `contract`).

### B. Routing (`src/App.tsx`)
Nueva ruta `/contract-imports` → nueva página `ContractImports.tsx` (tabla con búsqueda y export CSV de la tabla `contract`).

### C. Dashboard (`src/pages/Dashboard.tsx`)
Para `juridica` mostrar las mismas tarjetas que ve un admin: stats globales de contratos por estado, contratos por vencer, gráficas. Ocultar widgets de cuentas de cobro o dejarlos como info de contexto.

### D. Lista de contratos (`src/pages/Contracts.tsx` y `ContractTable.tsx`)
- `canEdit` actual = `["super_admin","admin"]`. Agregar `"juridica"` para habilitar el botón Editar.
- En el filtro de fetch: jurídica debe consultar sin filtro `created_by` ni filtro de proceso (como admin).

### E. Crear/Editar contrato (`CreateContract.tsx`, `EditContract.tsx`)
- Quitar las restricciones de "interfaz simplificada" del employee (cliente, descripción, financiero).
- Quitar el bloqueo de campos read-only (Contract Number, CDP, RP, Description, Total Amount).
- Permitir editar en cualquier estado (no solo `devuelto`).
- En el guard de carga de rol, `juridica` se trata como admin.

### F. Routing por rol (`navigation/role-specific-contract-routing`)
Añadir `juridica` al grupo que va al details view (`/contracts/:id`) con botón a editar — igual que admin.

### G. Acciones de estado (`ContractStateActions.tsx`)
Habilitar botones de aprobar/devolver/cancelar para `juridica` (mismas acciones que supervisor, sin filtro de proceso).

### H. Formulario de usuarios (`UserForm.tsx`)
Agregar `juridica` a `getAvailableRoles()` para super_admin y admin (no para supervisor). El rol `juridica` NO requiere `proceso_id` (se añade al `if (!['supervisor','employee'].includes(formData.role))`).

### I. Página Cuentas de Cobro (`BillingAccounts.tsx`)
Para `juridica`: mostrar solo la pestaña "Todas las Cuentas" en modo lectura (sin acciones de aprobar/devolver/pagar). Reutilizar el componente listado.

### J. Nueva página `ContractImports.tsx`
Tabla con todos los registros de `contract` (importados): búsqueda por TERCERO/CDP/RP/CONTRATO, paginación, export a CSV. Solo visible para `juridica`, `admin`, `super_admin`.

## Identidad de marca

Se mantiene 100%: mismos componentes UI (`Card`, `Table`, `Tabs`, `Badge`), mismo header "Maktub Pro", paleta y tipografía actuales. Solo se agregan ítems al menú existente sin cambiar layout ni colores. El nuevo rol usa los mismos `Badge` de estado y los mismos iconos de lucide ya en uso.

## Archivos afectados

| Archivo | Cambio |
|---|---|
| Migración SQL nueva | Enum + rol + RLS policies |
| `src/components/ui/professional-nav.tsx` | Reglas de visibilidad para juridica |
| `src/App.tsx` | Ruta `/contract-imports` |
| `src/pages/ContractImports.tsx` | **NUEVO** — listado tabla `contract` |
| `src/pages/Dashboard.tsx` | Tratar juridica como admin |
| `src/pages/Contracts.tsx` | Fetch sin filtros para juridica |
| `src/components/contracts/ContractTable.tsx` | `canEdit` incluye juridica |
| `src/components/contracts/ContractStateActions.tsx` | Acciones de estado para juridica |
| `src/pages/CreateContract.tsx` | Sin restricciones de UI para juridica |
| `src/pages/EditContract.tsx` | Sin lock de campos / estados para juridica |
| `src/pages/ContractDetails.tsx` | Routing y permisos juridica |
| `src/pages/SupervisorContractReview.tsx` | (revisar) acceso opcional juridica |
| `src/components/users/UserForm.tsx` | Rol juridica disponible, sin proceso |
| `src/pages/BillingAccounts.tsx` | Vista lectura para juridica |

## Resultado esperado

- Nuevo rol "Jurídica" disponible al crear usuarios (visible solo para admin / super_admin).
- Usuario con rol jurídica entra y ve: Dashboard global, Control de Contratos completo (crear, editar, aprobar, devolver), Cuentas de Cobro en solo lectura, Datos Importados (tabla contract), Notificaciones y Perfil.
- No puede acceder a Usuarios ni a Procesos.
- Toda la estética (header, navegación, colores, badges, tipografía) se conserva.
- Las RLS garantizan que jurídica solo ejecuta lo permitido aunque alguien manipule el cliente.
