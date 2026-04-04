

# Plan: Restaurar visual de "Información del Cliente" para empleados

## Problema

La seccion "Información del Cliente" para empleados se cambio a texto plano simple (labels + texto), pero el usuario quiere que se vea como en la imagen: con el mismo estilo visual que tiene el `ClientSelector` (el cuadro con borde mostrando Nombre, Documento, Email, Teléfono), pero sin que sea editable.

## Solucion

En `src/pages/EditContract.tsx`, lineas 542-560, reemplazar los labels planos por una version que imite el estilo visual del `ClientSelector`:

1. Mostrar un input/trigger deshabilitado con el nombre del cliente (similar al SelectTrigger)
2. Debajo, mostrar el cuadro con borde (Alert) con los datos: Nombre, Documento, Email, Teléfono — igual que lo hace el `ClientSelector` cuando hay un perfil seleccionado

Basicamente replicar la vista del `ClientSelector` en modo solo lectura, con:
- Label "Cliente / Contratista" con icono User
- Un div estilo trigger deshabilitado mostrando nombre y documento
- Un Alert con los datos detallados

## Archivo afectado

| Archivo | Cambio |
|---------|--------|
| `src/pages/EditContract.tsx` | Reemplazar vista plana de empleado por vista estilizada que replica el look del ClientSelector |

