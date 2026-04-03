

# Plan: Agregar OID a tablas principales del sistema

## Analisis

De las 17 tablas del sistema, solo 2 tienen OID:
- `contract` (importada) - tiene `"OID"` 
- `contracts` (sistema) - tiene `oid`

Las demas tablas usan solo UUID como identificador, que es largo y dificil de referenciar para los usuarios.

## Tablas que necesitan OID

Las tablas donde el usuario interactua directamente y necesita un numero de referencia corto:

| Tabla | Justificacion | Registros actuales |
|-------|--------------|-------------------|
| `billing_accounts` | El usuario referencia cuentas de cobro constantemente (ej: #1, #2...) | Pocos |
| `profiles` | Identificar usuarios rapidamente en listados | Pocos |

Las siguientes tablas **NO necesitan OID** porque son tablas internas/de auditoria que el usuario no referencia directamente:
- `billing_activities`, `billing_activity_evidence`, `billing_documents` (sub-registros)
- `billing_reviews`, `historial_estado_cuenta` (auditoria)
- `contract_state_history`, `contract_payments`, `documents` (auditoria/soporte)
- `contract_states`, `billing_account_states`, `roles`, `permissions` (catalogos)
- `activities` (log interno)

## Migracion SQL

```sql
-- Agregar OID a billing_accounts
ALTER TABLE public.billing_accounts ADD COLUMN oid SERIAL;

-- Agregar OID a profiles
ALTER TABLE public.profiles ADD COLUMN oid SERIAL;
```

Los registros existentes reciben numeros automaticamente. Nuevos registros continuan la secuencia.

## Cambios en codigo

### 1. `src/components/billing/BillingAccountsList.tsx`
- Mostrar columna OID (#1, #2...) en la tabla de cuentas de cobro junto al account_number
- Incluir `oid` en la query de billing_accounts

### 2. `src/components/billing/BillingReviewList.tsx`
- Mostrar OID de la cuenta en las listas de revision

### 3. `src/pages/Users.tsx`
- Mostrar columna OID (#1, #2...) en la tabla de usuarios

### 4. Cualquier componente que liste billing_accounts o profiles
- Agregar OID como primera columna visible

## Resultado esperado

- Cada cuenta de cobro tendra un numero secuencial facil de referenciar (#1, #2, #3...)
- Cada usuario tendra un numero de identificacion interno
- El OID se asigna automaticamente y es unico
- No reemplaza el UUID (que sigue siendo la PK interna), es un identificador visual

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| Migracion SQL | Agregar columna `oid SERIAL` a `billing_accounts` y `profiles` |
| `src/components/billing/BillingAccountsList.tsx` | Mostrar OID en tabla |
| `src/components/billing/BillingReviewList.tsx` | Mostrar OID en listas de revision |
| `src/pages/Users.tsx` | Mostrar OID en tabla de usuarios |

