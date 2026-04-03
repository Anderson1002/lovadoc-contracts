

# Plan: Ocultar secciones redundantes para el rol Employee en CreateContract

## Problema

Cuando el empleado selecciona un contrato en la card "Contrato a Radicar" (linea 402), los datos de cliente, descripcion y valor ya se pre-cargan automaticamente desde la tabla `contract`. Sin embargo, mas abajo aparecen 3 cards editables que repiten esa misma informacion:

1. **Informacion del Cliente** (linea 607-622) - ClientSelector editable
2. **Descripcion del Contrato** (linea 624-645) - Textarea editable
3. **Informacion Financiera** (linea 647-669) - Input editable

Estas secciones son para roles admin/supervisor que crean contratos manualmente. El employee no necesita verlas porque sus datos ya vienen del contrato importado.

## Solucion

Envolver las 3 cards con una condicion `userRole !== "employee"` para que solo sean visibles para admin/supervisor. Para el employee, los datos ya estan en la card "Contrato a Radicar" (campos disabled de solo lectura).

Adicionalmente, cuando el employee tiene un contrato seleccionado, los valores del formulario (`clientProfileId`, `description`, `totalAmount`) ya se setean automaticamente desde el contrato activo, asi que ocultar estas cards no afecta el envio del formulario.

## Archivo afectado

| Archivo | Cambio |
|---------|--------|
| `src/pages/CreateContract.tsx` | Envolver las cards de Cliente (607-622), Descripcion (624-645) e Informacion Financiera (647-669) con `{userRole !== "employee" && (...)}` |

## Resultado

- **Employee**: solo ve la card "Contrato a Radicar" con datos pre-cargados de solo lectura, sin secciones editables redundantes
- **Admin/Supervisor**: sigue viendo todas las secciones editables para crear contratos manualmente

