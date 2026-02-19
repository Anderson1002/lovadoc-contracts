

# Plan: Filtrar cuentas en borrador para supervisores en "Todas las Cuentas"

## Problema

Cuando un supervisor accede a la pestana "Todas las Cuentas", puede ver cuentas de cobro en estado **borrador**. Las cuentas en borrador son trabajo en progreso del empleado y no deben ser visibles para supervisores ni tesoreria hasta que el empleado las envie (estado `pendiente_revision`).

## Logica de negocio

| Rol | Que ve en "Todas las Cuentas" |
|-----|-------------------------------|
| employee | Solo sus propias cuentas (todos los estados) |
| supervisor | Cuentas de su proceso, **excepto borradores** |
| admin / super_admin | Todas las cuentas (todos los estados) |
| treasury | Todas las cuentas, **excepto borradores** |

## Cambio tecnico

### Archivo: `src/components/billing/BillingAccountsList.tsx`

En la funcion `loadBillingAccounts`, dentro del bloque `filterType === 'all'`, agregar un filtro para excluir cuentas en estado `borrador` cuando el usuario es supervisor o treasury:

```
// Linea ~60-65, dentro del else (admin/supervisor/treasury)
if (['supervisor', 'treasury'].includes(userRole)) {
  query = query.neq('status', 'borrador');
}
```

Esto asegura que:
- Los borradores solo son visibles para el empleado que los creo
- Los supervisores solo ven cuentas ya enviadas/radicadas
- Admins y super_admins mantienen visibilidad completa
