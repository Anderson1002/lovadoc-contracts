## Objetivo
Mostrar el avance de ejecución acumulado de cada contrato (con base en cuentas de cobro **aprobadas** o **causadas**) en 4 puntos del sistema, visible para todos los roles involucrados.

## Fuente de datos (sin cambios de schema)
Se calcula en el cliente sumando `amount` de `billing_accounts` con `status IN ('aprobada','causada')` por `contract_id`, dividido por `contracts.total_amount + COALESCE(addition_amount,0)`.

Helper nuevo: `src/lib/contractExecution.ts`
- `getContractExecution(contractId)` → `{ totalEjecutado, valorTotal, porcentaje, saldo, cuentasAprobadas }`
- `getMultipleContractsExecution(contractIds[])` → mapa para listas (1 query batch)

## 1. Badge en tabla de contratos (`/contracts/query`)
- Nueva columna **"Ejecución"** en `ContractQueryTable.tsx`
- Mini barra de progreso + `XX%` + tooltip con `$ejecutado / $total`
- Color: verde >80%, ámbar 40-80%, gris <40%

## 2. Panel en detalle del contrato
- Nuevo componente `ContractExecutionPanel.tsx` insertado en:
  - `ContractDetails.tsx` (admin/super_admin/juridica)
  - `EditContract.tsx` (empleado, solo lectura)
  - `SupervisorContractReview.tsx` (supervisor)
- Muestra: barra grande, total ejecutado, saldo, % y lista de cuentas aprobadas (número, mes, monto)

## 3. Card en Dashboard
- Nuevo componente `ContractExecutionSummary.tsx` en `Dashboard.tsx`
- Top 5 contratos con mayor ejecución + alertas de contratos >90%
- Filtrado por rol: empleado ve los suyos, supervisor los de su proceso, admin/jurídica todos

## 4. En lista de cuentas de cobro
- En `BillingAccountsList.tsx` y `BillingReviewList.tsx`: nueva columna o badge debajo del contrato mostrando **"Contrato al XX%"** (acumulado hasta esa cuenta inclusive)

## Detalles técnicos
- Sin migraciones. Todo cálculo client-side respetando RLS existente.
- Performance: una query agregada por vista en lugar de N+1.
- Memorizar resultados con `useMemo`.
- Reutilizar utilidad `formatCurrency` y `Progress` de shadcn.

## Memoria a guardar
Nueva memoria `contracts/execution-visualization` con la fórmula y los 4 puntos de visualización.

## Archivos a crear/editar
- `src/lib/contractExecution.ts` (nuevo)
- `src/components/contracts/ContractExecutionPanel.tsx` (nuevo)
- `src/components/dashboard/ContractExecutionSummary.tsx` (nuevo)
- `src/components/contracts/ContractQueryTable.tsx` (editar)
- `src/pages/ContractDetails.tsx`, `EditContract.tsx`, `SupervisorContractReview.tsx` (editar)
- `src/pages/Dashboard.tsx` (editar)
- `src/components/billing/BillingAccountsList.tsx`, `BillingReviewList.tsx` (editar)
