

# Plan: Arreglar boton "Crear Contrato" para empleados

## Problema

El schema Zod exige `clientProfileId`, `description` y `totalAmount` como obligatorios, pero esos campos estan ocultos para el rol employee. Al hacer click en "Crear Contrato", la validacion falla silenciosamente y no pasa nada.

## Solucion

En `src/pages/CreateContract.tsx`:

1. **Auto-asignar valores ocultos cuando el empleado selecciona un contrato activo**: al seleccionar un contrato de la tabla `contract`, ya se tienen los datos pre-cargados. Usar `setValue()` de react-hook-form para asignar automaticamente:
   - `clientProfileId` = profile.id del empleado logueado
   - `description` = `OBSERVACION RP` del contrato seleccionado
   - `totalAmount` = `VALOR_INICIAL` del contrato seleccionado
   - `contractType` = `"contractor"` (por defecto para empleados)

2. **Agregar handler de errores de validacion**: agregar segundo parametro a `handleSubmit` para mostrar un toast con los errores, facilitando depuracion futura:
   ```tsx
   <form onSubmit={handleSubmit(onSubmit, (errors) => {
     console.log("Errores de validacion:", errors);
     toast({ title: "Campos faltantes", description: "Revise los campos requeridos", variant: "destructive" });
   })}>
   ```

## Archivo afectado

| Archivo | Cambio |
|---------|--------|
| `src/pages/CreateContract.tsx` | Auto-asignar campos ocultos con `setValue` al seleccionar contrato; agregar onError en handleSubmit |

## Resultado

El empleado selecciona contrato, fechas, y el boton "Crear Contrato" funciona correctamente sin necesidad de llenar campos ocultos.

