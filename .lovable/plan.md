

# Plan: Corregir vista de edicion para empleados

## Problemas identificados (segun la imagen)

1. **Faltan campos RP y CDP** en "Informacion Basica" - estos datos existen en la tabla `contracts` pero no se muestran
2. **Descripcion sigue editable** para el empleado - el `disabled` puede no estar funcionando correctamente por timing del rol
3. **Cliente se muestra como dropdown** - para empleados deberia mostrarse como informacion de solo lectura (texto), no como selector desplegable

## Solucion

### En `src/pages/EditContract.tsx`:

**1. Cargar RP y CDP del contrato**
- Agregar `cdp` y `rp` al estado del formulario
- Incluirlos en la consulta `loadContract`
- Mostrarlos como campos de solo lectura en la card "Informacion Basica" (debajo del numero de contrato)

**2. Reemplazar ClientSelector por vista de solo lectura para employee**
- En vez de ocultar la card "Informacion del Cliente", mostrarla siempre
- Para empleados: mostrar los datos del cliente como texto estatico (nombre, documento, email, telefono) sin dropdown
- Para admin/supervisor: mantener el `ClientSelector` actual con dropdown

**3. Asegurar que la descripcion quede deshabilitada**
- Verificar que `disabled={isEmployee}` funcione correctamente esperando a que el rol se cargue antes de renderizar el formulario

### Campos en "Informacion Basica" (para employee, todos read-only):
| Campo | Fuente |
|-------|--------|
| Numero de Contrato | `contract_number` |
| CDP | `cdp` (de contracts) |
| RP | `rp` (de contracts) |
| Tipo de Contrato | editable |
| Descripcion | `description` (read-only) |

### Card "Informacion del Cliente" (employee):
Mostrar `clientData` (nombre, documento, email, telefono) como texto estatico en vez del selector desplegable.

## Archivo afectado

| Archivo | Cambio |
|---------|--------|
| `src/pages/EditContract.tsx` | Agregar CDP/RP, cambiar cliente a solo lectura para employee, verificar disabled en descripcion |

