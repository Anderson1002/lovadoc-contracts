
# Plan: Indicador de Re-envío + Historial de Auditoría de Cuentas de Cobro

## Contexto del problema

La imagen muestra que la cuenta **COB-202512-001** regresó a "Pendientes Revisión" después de ser devuelta y corregida. El supervisor no tiene manera de saber que esta cuenta ya fue revisada antes, ni cuántas veces fue devuelta.

La base de datos **ya cuenta** con la tabla `billing_reviews` que almacena cada acción del supervisor (approved/rejected), el comentario, la fecha y el reviewer. Solo necesitamos aprovecharla.

## Estados disponibles en `billing_account_states`

| Código | Nombre | Descripción |
|--------|--------|-------------|
| BOR | borrador | Cuenta creada, pendiente de completar |
| PEN | pendiente_revision | Cuenta enviada para revisión del supervisor |
| APR | aprobada | Cuenta aprobada por el supervisor |
| REC | rechazada | Cuenta rechazada por el supervisor |
| CAU | causada | Cuenta causada/pagada por tesorería |

No se requieren nuevos estados. El indicador de re-envío se muestra visualmente en la UI sin cambiar el estado de la base de datos.

## Cambios propuestos

### 1. Indicador "Re-enviada" en la tabla de Pendientes de Revisión

**Archivo:** `src/components/billing/BillingReviewList.tsx`

Al cargar las cuentas pendientes, también se consulta `billing_reviews` para obtener el conteo de devoluciones previas. Si `rejection_count > 0`, se muestra junto al número de cuenta un badge naranja/ámbar: **"Re-enviada · N devoluciones"**.

Esto le indica claramente al supervisor que esta cuenta ya pasó por el proceso antes.

```text
Número           | Contrato | Contratista | ...
COB-202512-001   | 1745-25  | UsuarioOPS  | ...
[Re-enviada · 1 devolución]
```

### 2. Botón "Ver Historial" en la fila de revisión

**Archivo:** `src/components/billing/BillingReviewList.tsx`

Junto al botón de vista previa (FileText), agregar un botón de historial (History icon) que abre un Dialog con el historial completo de revisiones de esa cuenta.

### 3. Nuevo componente: `BillingReviewHistory.tsx`

Crear un componente reutilizable que muestra el historial de auditoría de una cuenta de cobro, con el mismo estilo visual que `ContractStateHistory.tsx` (timeline con íconos, fechas, badges).

Cada entrada del historial mostrará:
- Ícono de la acción (✅ Aprobado / ❌ Devuelto)
- Fecha y hora
- Nombre del supervisor revisor
- Observaciones por documento con los badges de colores (usando `SupervisorObservations`)
- Badge "Más reciente" en la primera entrada

### 4. Integrar el historial en la vista previa de 3 documentos

**Archivo:** `src/components/billing/BillingReviewList.tsx`

En el Dialog de vista previa (con las 3 pestañas), agregar una cuarta pestaña **"Historial"** que muestre el `BillingReviewHistory` de esa cuenta.

### 5. Historial también visible para el EMPLOYEE en su vista de edición

**Archivo:** `src/pages/EditBillingAccount.tsx`

Ya se muestra la alerta de observaciones cuando la cuenta está rechazada. Agregar un acordeón/sección "Ver historial completo" debajo de la alerta, que muestre el `BillingReviewHistory` para que el empleado pueda ver el historial completo de devoluciones.

## Resumen de archivos a crear/modificar

| Archivo | Operación | Descripción |
|---------|-----------|-------------|
| `src/components/billing/BillingReviewHistory.tsx` | Crear | Componente de timeline de auditoría de revisiones |
| `src/components/billing/BillingReviewList.tsx` | Modificar | Añadir conteo de devoluciones previas, badge "Re-enviada", botón historial, y pestaña "Historial" en preview |
| `src/pages/EditBillingAccount.tsx` | Modificar | Añadir historial colapsable debajo de la alerta de rechazo |

## No se requieren cambios en la base de datos

La tabla `billing_reviews` ya registra cada acción y ya tiene datos. Solo se necesita consultarla correctamente.

## Resultado esperado para el Supervisor

- Ve en la lista de pendientes si una cuenta es una re-envío (badge ámbar)
- Puede abrir el historial con un clic para ver todas las devoluciones anteriores y sus observaciones
- Al abrir la vista previa de documentos, la pestaña "Historial" muestra la auditoría completa

## Resultado esperado para el Empleado

- Al abrir una cuenta rechazada, ve la alerta de observaciones actuales (ya implementado)
- Debajo, puede expandir el historial completo para ver el contexto de todas las devoluciones
