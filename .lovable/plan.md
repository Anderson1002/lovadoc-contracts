

# Plan: Redirigir empleados directamente a la vista de edicion

## Problema

Cuando el empleado hace clic en "Ver detalles" desde el Dashboard, va a `/contracts/{id}` (ContractDetails) que es una vista de solo lectura. Luego tiene que hacer clic en "Editar" para ir a `/contracts/{id}/edit` (EditContract). Son dos pantallas para lo mismo: la primera solo muestra datos y la segunda los muestra Y permite editar.

## Solucion

Simplificar el flujo para el empleado: que "Ver detalles" lo lleve directamente a la vista de edicion (`/contracts/{id}/edit`), eliminando el paso intermedio innecesario.

### Cambios

| Archivo | Cambio |
|---------|--------|
| `src/pages/Dashboard.tsx` (~linea 317) | Cambiar el link de "Ver detalles" para que, si el usuario es employee, navegue a `/contracts/{id}/edit` en vez de `/contracts/{id}` |
| `src/pages/ContractDetails.tsx` (~linea 14) | Agregar logica para que si el usuario es employee, redirija automaticamente a `/contracts/{id}/edit` (por si accede directamente a la URL) |

### Detalle tecnico

1. En **Dashboard.tsx**: obtener el `userRole` (ya deberia estar disponible en el componente) y condicionar el href:
   - Employee: `/contracts/${contract.id}/edit`
   - Otros roles: `/contracts/${contract.id}` (sin cambio)

2. En **ContractDetails.tsx**: agregar un `useEffect` que detecte si el usuario es employee y haga `navigate(`/contracts/${id}/edit`, { replace: true })` automaticamente.

## Resultado

El empleado va directo a editar su contrato sin pasar por una vista de solo lectura redundante. Admin y supervisor siguen viendo la vista de detalle con boton "Editar".

