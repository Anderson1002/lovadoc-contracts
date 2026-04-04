

# Plan: "Ver detalles" debe llevar al empleado a editar su contrato

## Problema

Actualmente, "Ver detalles" en `/contracts/query` abre un panel lateral (`setSelectedContract`) con informacion de solo lectura. Para el empleado esto es redundante — ya se decidio que los empleados van directo a la vista de edicion (`/contracts/{id}/edit`).

## Solucion

En `src/components/contracts/ContractQueryTable.tsx`:

1. Agregar una prop `userRole` al componente
2. En el click de "Ver detalles": si `userRole === 'employee'`, hacer `navigate(/contracts/${contract.id}/edit)` en vez de `setSelectedContract(contract)`
3. Mismo cambio en el boton de la columna de acciones rapidas (linea 457)

En `src/pages/ContractQuery.tsx`:

4. Pasar `userRole` como prop al componente `ContractQueryTable`

## Archivo afectado

| Archivo | Cambio |
|---------|--------|
| `src/components/contracts/ContractQueryTable.tsx` | Agregar prop `userRole`, condicionar navegacion en "Ver detalles" |
| `src/pages/ContractQuery.tsx` | Pasar `userRole` a `ContractQueryTable` |

## Resultado

El empleado hace clic en "Ver detalles" y va directo a `/contracts/{id}/edit` donde puede ver sus datos y editar lo permitido.

