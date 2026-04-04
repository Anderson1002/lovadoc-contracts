

# Plan: Diferenciar Dashboard y Consulta de Contratos para empleados

## Problema

Ambas paginas muestran practicamente lo mismo para el empleado: stats, grafica de estados, lista de contratos. No hay razon para tener dos vistas casi identicas.

## Propuesta de diferenciacion

### Dashboard (`/`) - Resumen rapido y acciones
**Funcion**: Vista ejecutiva personal. El empleado llega aqui para ver de un vistazo como estan sus cosas y tomar accion rapida.

Mantener:
- Stats cards (total, en ejecucion, registrados, devueltos, valor)
- Alerta de contratos devueltos
- "Mis Ultimos Contratos" (solo los 5 mas recientes, sin filtros)
- Acciones rapidas (Crear Contrato, Cuentas de Cobro, Consultar)

**Eliminar del Dashboard**:
- Grafica de "Estado de Contratos" (duplica lo que ya dicen las stats cards y lo que muestra ContractQuery)

**Agregar al Dashboard**:
- Card de "Proximos Vencimientos": contratos cuya `end_date` esta proxima (7-30 dias), para que el empleado sepa que debe gestionar pronto
- Card de "Cuentas de Cobro Pendientes": resumen rapido de si tiene cuentas de cobro por enviar o en revision

### ContractQuery (`/contracts/query`) - Herramienta de busqueda y analisis
**Funcion**: Busqueda avanzada con filtros, ordenamiento, exportacion CSV. El empleado viene aqui cuando necesita encontrar algo especifico o exportar datos.

Mantener todo como esta:
- Filtros avanzados (tipo, estado, cliente, fechas, montos)
- Stats de la consulta filtrada
- Distribucion por estado y tipo
- Tabla con paginacion y ordenamiento
- Exportar CSV

**Esto ya es diferente al Dashboard** porque tiene filtros, exportacion y analisis detallado.

## Cambios concretos

### 1. Dashboard.tsx - Reemplazar grafica por cards utiles

Eliminar la seccion de `ContractStatusChart` y en su lugar poner:

```
[Proximos Vencimientos]     [Mis Ultimos Contratos]
- Contrato X vence en 5d    - 032-2025 Registrado
- Contrato Y vence en 12d   - 031-2025 En ejecucion
```

Agregar card "Cuentas de Cobro":
- Consultar `billing_accounts` donde el contrato pertenece al empleado
- Mostrar: pendientes de envio, en revision, aprobadas

### 2. Sin cambios en ContractQuery.tsx

Ya cumple su funcion como herramienta de consulta avanzada.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/pages/Dashboard.tsx` | Reemplazar grafica por "Proximos Vencimientos" y "Resumen Cuentas de Cobro" para employee |

## Resultado

- **Dashboard**: resumen rapido + alertas + acciones. El empleado entra, ve que tiene pendiente y actua.
- **ContractQuery**: herramienta de busqueda detallada con filtros y exportacion. El empleado viene cuando necesita buscar o analizar.
- Cada pagina tiene un proposito claro y distinto.

