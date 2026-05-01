
# Plan: Rol Jurídica — CRUD sobre tabla `contract`

## Contexto

El rol **Jurídica** es quien **digita y mantiene** los registros maestros de contratos en la tabla externa `contract` (no radica cuentas de cobro ni gestiona el flujo interno de `contracts`). Por tanto, el menú actual con 4 opciones está sobredimensionado y debe simplificarse, y la página `/contract-imports` debe convertirse en el verdadero centro de operación con CRUD completo.

## Cambios

### 1. Menú de navegación (Jurídica)

Filtrar `professional-nav.tsx` para que Jurídica solo vea bajo "Control de Contratos":

```text
Control de Contratos
├── Contratos          → /contract-imports        (listar/buscar/editar)
└── Nuevo Contrato     → /contract-imports/new    (formulario de alta)
```

Se ocultan para Jurídica: `/contracts`, `/contracts/new`, `/contracts/query`.

### 2. Base de datos — Permisos RLS sobre tabla `contract`

Actualmente Jurídica solo tiene `SELECT`. Hay que agregar:

```sql
-- INSERT
CREATE POLICY contract_insert_juridica ON public.contract
FOR INSERT WITH CHECK (
  get_user_role(auth.uid()) = ANY (ARRAY['super_admin','admin','juridica']::user_role_type[])
);

-- UPDATE
CREATE POLICY contract_update_juridica ON public.contract
FOR UPDATE USING (
  get_user_role(auth.uid()) = ANY (ARRAY['super_admin','admin','juridica']::user_role_type[])
);
```

(Sin DELETE, para preservar trazabilidad.)

El campo `OID` queda autoincremental (ya lo es vía `nextval('contract_oid_seq')`), no se envía desde el cliente.

### 3. Página `/contract-imports` (renombrada en UI a "Contratos")

Mejoras a `src/pages/ContractImports.tsx`:

- Renombrar título visible: "Contratos" / "Gestión de Contratos" (URL se mantiene).
- Botón **"+ Nuevo Contrato"** en el header → navega a `/contract-imports/new`.
- En cada fila de la tabla agregar acción **Editar** (ícono lápiz) → `/contract-imports/:oid/edit`.
- Mantener búsqueda, KPIs y exportación CSV existentes.
- Mejorar columnas mostradas para reflejar todos los campos relevantes (CONTRATO, CDP, RP, FECHA RP, FECHA CDP, TERCERO, DESCRIP_TERCERO, VALOR_INICIAL, SALDO RP, OBSERVACION RP).

### 4. Nueva página `/contract-imports/new` — Crear

Componente `src/pages/ContractImportCreate.tsx` con formulario que inserta en `contract`:

| Campo formulario | Columna DB | Tipo |
|---|---|---|
| Número de Contrato | `CONTRATO` | text |
| CDP | `CDP` | text |
| Fecha CDP | `FECHA CDP` | date → text |
| RP | `RP` | bigint |
| Fecha RP | `FECHA RP` | date → text |
| Tercero (documento) | `TERCERO` | text |
| Descripción Tercero | `DESCRIP_TERCERO` | text |
| Valor Inicial | `VALOR_INICIAL` | text (numérico) |
| Modificación Crédito | `MODIFIC_CREDITO` | text |
| Modificación Débito | `MODIFIC_DEBITO` | text |
| Valor Ejecutado | `VALOR EJECUTADO` | text |
| Saldo RP | `SALDO RP` | text |
| Observación RP | `OBSERVACION RP` | textarea |

`OID` no se envía (autoincremental). Validación con `zod` + `react-hook-form`.

### 5. Nueva página `/contract-imports/:oid/edit` — Editar

Componente `src/pages/ContractImportEdit.tsx`:
- Carga el registro por `OID`.
- Reutiliza el mismo formulario de creación (componente compartido `ContractImportForm.tsx`).
- Submit ejecuta `UPDATE` filtrando por `OID`.
- `OID` y campo `CONTRATO` se muestran de solo lectura para preservar la identidad del registro.

### 6. Rutas en `src/App.tsx`

Agregar:
```tsx
<Route path="/contract-imports/new" element={<ContractImportCreate />} />
<Route path="/contract-imports/:oid/edit" element={<ContractImportEdit />} />
```

### 7. Dashboard Jurídica (`src/pages/Dashboard.tsx`)

Reemplazar la vista actual del rol Jurídica con métricas calculadas sobre `contract`:

- **KPIs**: Total registros, Valor inicial acumulado, Saldo RP acumulado, Terceros únicos.
- **Tabla de últimos 5 contratos creados** (orden `OID DESC`).
- **Acceso rápido**: botones a "Nuevo Contrato" y "Ver todos".

Se elimina del dashboard de Jurídica cualquier referencia a `contracts`, `billing_accounts` o flujos internos.

### 8. Limpieza UI

- Quitar de `BillingAccounts.tsx` el header de "consulta legal" para Jurídica (ya no aplica acceso por menú).
- Quitar `ContractImports` del menú "Datos Importados" para super_admin/admin (queda solo para Jurídica) **O** mantenerlo accesible — confirmar más adelante si surge la duda; por ahora se mantiene para admins también.

## Detalles técnicos

- Identificador de fila: `OID` (numérico, autoincremental).
- Tipos `text` en DB para campos numéricos como `VALOR_INICIAL` se conservan (formato heredado del sistema externo); el formulario hace `String(number)` antes de insertar.
- `RP` es `bigint`: el formulario lo enviará como número.
- Campos de fecha `FECHA CDP` / `FECHA RP` son `text` con formato `YYYY-MM-DD HH:mm:ss.SSS`; el formulario los enviará en ese formato.
- Guardia de rol con `ALLOWED_ROLES = ['super_admin','admin','juridica']` en las 3 páginas nuevas/modificadas.
- Sin `DELETE` para mantener auditabilidad histórica.

## Resultado esperado

Jurídica entra al sistema y ve:
- Dashboard con métricas reales de `contract`.
- Menú con solo "Contratos" y "Nuevo Contrato".
- En `/contract-imports` puede listar, buscar, exportar y editar.
- En `/contract-imports/new` digita un contrato nuevo que se guarda en la tabla externa con OID autogenerado.
