

# Plan: Usar la vista tipo formulario (EditContract) para el supervisor, totalmente bloqueada

## Problema

La vista actual de ContractDetails para el supervisor (imagen 1) muestra los datos en cards separadas con estilo de "ficha informativa" que no es visualmente agradable. El usuario prefiere la vista tipo formulario de EditContract (imagen 2) que ya tiene el estilo consistente con el resto de la app, pero totalmente bloqueada.

## Solucion

En lugar de redirigir al supervisor a ContractDetails, dejarlo en EditContract pero con todo deshabilitado y sin boton "Guardar". Agregar las acciones de gestion de estado (Aprobar/Devolver/Cancelar) y el historial de estados directamente en EditContract.

### Cambios en `src/pages/EditContract.tsx`:

1. **Quitar la redireccion del supervisor** a `/contracts/{id}` (lineas 72-74). Dejarlo permanecer en la vista de edicion.

2. **Agregar logica de bloqueo para supervisor**: todos los campos disabled, sin boton "Guardar". Variable `canEdit` ya existe, ajustarla:
   - `const canEdit = !isEmployee && userRole !== 'supervisor' || (isEmployee && formData.status === 'devuelto');`
   - Simplificado: el supervisor nunca puede editar, el employee solo si esta devuelto, admin/super_admin siempre.

3. **Agregar ContractStateActions en el header** para el supervisor (y admin), al lado del titulo, para que pueda Aprobar/Devolver/Cancelar desde ahi.

4. **Agregar ContractStateHistory al final del formulario** para supervisor (y admin), despues de la seccion de "Contrato Firmado".

5. **Cambiar el mensaje de alerta**: para supervisor no mostrar "Contrato en revision" (ese es para employee). El supervisor no necesita alerta informativa, solo las acciones.

### Cambios en `src/pages/ContractDetails.tsx`:

6. **Redirigir supervisor a edit**: invertir la logica. Ahora el supervisor tambien va a `/contracts/{id}/edit`. Solo admin y super_admin se quedan en ContractDetails.

   Actualizar el useEffect: si `roleName === 'employee' || roleName === 'supervisor'`, redirigir a edit.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/pages/EditContract.tsx` | Quitar redirect de supervisor, agregar ContractStateActions + ContractStateHistory, ajustar canEdit |
| `src/pages/ContractDetails.tsx` | Redirigir supervisor a /edit tambien |

## Resultado

- Supervisor ve el formulario tipo EditContract con todos los campos bloqueados + botones de gestion de estado + historial
- Misma visual consistente que ve el empleado cuando su contrato esta bloqueado
- Admin/super_admin siguen en ContractDetails con opcion de ir a editar

