

# Plan: Bloquear edicion de contratos registrados para empleados

## Problema

Actualmente el empleado puede editar su contrato en cualquier momento. El comportamiento correcto es:
- **Estado "registrado"**: el contrato ya fue enviado, NO se puede editar
- **Estado "devuelto"**: el supervisor lo devolvio, SI se puede editar (para corregir)
- **Estado "corregido"**: ya se corrigio, NO se puede editar de nuevo
- Otros estados (en_ejecucion, completado, cancelado): NO se puede editar

## Solucion

En `src/pages/EditContract.tsx`:

1. Despues de cargar el contrato y el rol, evaluar si el empleado puede editar:
   - `canEdit = !isEmployee || contract.estado === 'devuelto'`

2. Si `isEmployee && estado !== 'devuelto'`:
   - Mostrar una alerta informativa: "Este contrato ya fue registrado y esta pendiente de revision. No se puede editar hasta que el supervisor lo devuelva."
   - Deshabilitar TODOS los campos del formulario (no solo los de origen externo)
   - Ocultar el boton "Guardar Cambios"

3. Si `isEmployee && estado === 'devuelto'`:
   - Mostrar la alerta de devolucion con los comentarios del supervisor (ya existe)
   - Permitir editar los campos que el empleado puede modificar (fechas, PDF, tipo de contrato)
   - Boton "Guardar Cambios" visible y funcional

## Archivo afectado

| Archivo | Cambio |
|---------|--------|
| `src/pages/EditContract.tsx` | Agregar variable `canEdit`, condicionar disabled en todos los campos y visibilidad del boton guardar |

## Resultado

- Empleado registra contrato -> va a editarlo -> ve sus datos pero no puede modificar nada
- Supervisor devuelve contrato -> empleado puede editar y corregir
- Admin/supervisor siguen con acceso completo siempre

