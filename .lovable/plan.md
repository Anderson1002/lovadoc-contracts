

# Plan: Crear vista independiente para el supervisor

## Problema

El supervisor comparte la ruta `/contracts/:id/edit` con el empleado, lo que causa:
1. El supervisor ve la alerta "Contrato en revision" que es solo para empleados
2. La logica de ambos roles se mezcla en un solo archivo, generando confusiones
3. El historial de estados no se muestra correctamente

## Solucion

Crear una nueva pagina `SupervisorContractReview.tsx` con su propia ruta `/contracts/:id/review`. Esta pagina replica el layout visual del formulario de EditContract pero:
- Todos los campos siempre deshabilitados (sin logica de `canEdit`)
- Sin boton "Guardar"
- Con `ContractStateActions` en el header (Aprobar/Devolver/Cancelar)
- Con `ContractStateHistory` al final
- Sin alertas de empleado

### Cambios:

**1. Crear `src/pages/SupervisorContractReview.tsx`** (nuevo archivo)
- Copia simplificada de EditContract: carga el contrato, muestra los mismos campos en el mismo layout de formulario con Cards
- Todos los campos `disabled` siempre
- Header con titulo "Revision de Contrato" + `ContractStateActions`
- Al final del formulario: `ContractStateHistory`
- Boton solo "Volver", sin "Guardar"
- Sin alertas de "Contrato en revision" ni "Contrato devuelto"

**2. Actualizar `src/App.tsx`**
- Agregar ruta: `/contracts/:id/review` -> `SupervisorContractReview`

**3. Actualizar `src/pages/ContractDetails.tsx`**
- Cambiar redirect del supervisor: de `/contracts/${id}/edit` a `/contracts/${id}/review`

**4. Actualizar `src/pages/EditContract.tsx`**
- Quitar toda la logica de supervisor (isSupervisor, ContractStateActions, ContractStateHistory)
- Si un supervisor intenta acceder a `/edit`, redirigir a `/review`
- Dejar EditContract limpio solo para employee y admin

**5. Actualizar `src/components/contracts/ContractQueryTable.tsx`**
- Para supervisor, "Ver detalles" navega a `/contracts/${id}/review`

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/pages/SupervisorContractReview.tsx` | Nuevo - vista de solo lectura con acciones de estado e historial |
| `src/App.tsx` | Agregar ruta `/contracts/:id/review` |
| `src/pages/ContractDetails.tsx` | Redirect supervisor a `/review` en vez de `/edit` |
| `src/pages/EditContract.tsx` | Quitar logica de supervisor, redirect a `/review` si es supervisor |
| `src/components/contracts/ContractQueryTable.tsx` | Supervisor navega a `/review` |

## Resultado

- Supervisor: `/contracts/:id/review` - formulario bloqueado + acciones + historial, sin mensajes de empleado
- Empleado: `/contracts/:id/edit` - logica limpia sin mezcla de roles
- Admin: `/contracts/:id` (ContractDetails) con opcion de ir a editar

