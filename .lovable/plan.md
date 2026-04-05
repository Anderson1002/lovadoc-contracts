

# Plan: Reorganizar pestanas y header de /billing para el supervisor

## Situacion actual

El supervisor ve en `/billing`:
- Header: "Registro Cuenta de Cobro" + texto del empleado (incorrecto)
- 5 pestanas: Mis Cuentas, Pendientes Revision, Cuentas por Pagar, Todas las Cuentas, Comentarios
- El supervisor NO ve "Mis Cuentas" ni "Cuentas por Pagar" (correcto), pero las pestanas visibles no estan bien organizadas

## Cambios propuestos

### 1. Header dinamico segun rol

| Rol | Titulo | Descripcion |
|-----|--------|-------------|
| Employee | Registro Cuenta de Cobro | Para radicar exitosamente se requieren 3 documentos... |
| Supervisor | Revision de Cuentas de Cobro | Revisa, aprueba o devuelve las cuentas de cobro de los contratistas |
| Treasury | Gestion de Pagos | Gestiona los pagos de las cuentas aprobadas |
| Admin/Super Admin | Gestion de Cuentas de Cobro | Administracion completa de cuentas de cobro |

### 2. Pestanas del supervisor (solo 2)

Actualmente el supervisor ve: "Pendientes Revision", "Todas las Cuentas", "Comentarios". La propuesta:

- **Pendientes de Revision** — Cuentas en estado `pendiente_revision` (las que necesitan accion: aprobar o devolver). Usa el componente `BillingReviewList` que ya existe y funciona
- **Historial de Cuentas** — Todas las demas cuentas que ya fueron procesadas (aprobadas, rechazadas, causadas). Usa `BillingAccountsList` con `filterType="all"` que ya excluye borradores para supervisor

Se elimina la pestana "Comentarios" para supervisor (los comentarios ya se ven dentro de cada cuenta en el historial y en el flujo de revision).

### 3. Observaciones adicionales de mejora

- El `TabsList` usa `grid-cols-5` fijo aunque no todos los roles ven 5 pestanas — cambiar a `grid-cols` dinamico segun la cantidad real de tabs visibles
- El badge de conteo pendiente ya funciona correctamente

## Archivo afectado

| Archivo | Cambio |
|---------|--------|
| `src/pages/BillingAccounts.tsx` | Header condicional por rol, reorganizar tabs del supervisor a solo 2, grid-cols dinamico |

## Resultado

- Supervisor ve "Revision de Cuentas de Cobro" con descripcion adecuada
- Solo 2 pestanas claras: lo que necesita accion vs lo ya procesado
- No se rompe la logica existente de los componentes internos

