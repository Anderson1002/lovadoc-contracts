

# Plan: Separar las vistas de Supervisor y Empleado en la gestion de contratos

## Problemas identificados

1. **Supervisor y empleado usan la misma ruta** (`/contracts/{id}/edit`). El supervisor NO deberia estar en una vista de "Editar Contrato" — su funcion es **revisar y gestionar estados** (aprobar, devolver, poner en ejecucion), no editar datos.

2. **Imagen 1** (ContractDetails): Esta es la vista correcta para el supervisor — muestra los datos de solo lectura. Pero el boton "Editar" no deberia aparecer para supervisores porque no les corresponde editar lo que registro el empleado.

3. **Imagen 2** (EditContract como supervisor): El mensaje "Contrato en revision" NO aplica para supervisores — ese mensaje es para empleados. El supervisor no deberia ver este formulario de edicion.

## Funcion del Supervisor

El supervisor debe:
- **Ver** los detalles del contrato (vista de solo lectura, ContractDetails)
- **Gestionar estados**: Aprobar (pasar a "en_ejecucion"), Devolver (con comentarios), Cancelar
- **NO editar** los datos que registro el empleado (numero, descripcion, fechas, PDF, etc.)

## Solucion

### 1. ContractDetails.tsx — Quitar boton "Editar" para supervisor

Actualmente el boton "Editar" aparece para todos. Cambiarlo para que solo sea visible para `admin` y `super_admin`. El supervisor ve los datos pero no edita — solo gestiona estados.

- Agregar deteccion de rol (similar a como se hizo en EditContract)
- Condicionar el boton: `{['admin', 'super_admin'].includes(userRole) && <Button>Editar</Button>}`
- Agregar el componente `ContractStateActions` para que el supervisor pueda aprobar/devolver/cambiar estado directamente desde esta vista

### 2. EditContract.tsx — Redirigir supervisor a ContractDetails

Si el supervisor intenta acceder a `/contracts/{id}/edit` directamente (por URL), redirigirlo a `/contracts/{id}` porque esa es su vista correcta.

- En el `useEffect` de carga de rol, si `userRole === 'supervisor'`, hacer `navigate(`/contracts/${id}`, { replace: true })`

### 3. ContractQueryTable.tsx — Supervisor usa "Ver detalles" hacia ContractDetails

Actualmente ya funciona asi para no-employees. Verificar que el supervisor va a `/contracts/{id}` (ContractDetails) y no a edit.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/pages/ContractDetails.tsx` | Agregar deteccion de rol, ocultar boton Editar para supervisor, agregar ContractStateActions |
| `src/pages/EditContract.tsx` | Redirigir supervisor a ContractDetails si intenta acceder a /edit |

## Resultado

- **Empleado**: va a `/contracts/{id}/edit` (ve datos, edita solo si devuelto)
- **Supervisor**: va a `/contracts/{id}` (ve datos de solo lectura + botones de gestion de estado)
- **Admin**: va a `/contracts/{id}` (ve datos + boton Editar + gestion de estado)

