

# Plan: Filtrar datos por usuario para el rol Employee

## Problema critico

Tanto el Dashboard como ContractQuery cargan `supabase.from('contracts').select('*')` sin ningun filtro. Un empleado ve TODOS los contratos del sistema cuando solo deberia ver los suyos.

## Que deberia hacer cada pagina para el Employee

### Dashboard (`/`) - Resumen personal
- Stats cards: solo sus contratos (total, en ejecucion, devueltos, valor)
- Grafica: distribucion de estados de SUS contratos
- "Mis Ultimos Contratos": sus ultimos 5 contratos
- Acciones rapidas: crear contrato, ver cuentas de cobro, consultar contratos

### ContractQuery (`/contracts/query`) - Consulta de sus contratos
- Tabla con filtros y busqueda, pero solo de SUS contratos
- Exportar CSV solo de sus contratos
- Stats de la consulta solo de sus contratos

## Solucion

### 1. Dashboard.tsx

En `loadDashboardData`, despues de obtener el perfil y rol, condicionar la query:

```tsx
let contractsQuery = supabase.from('contracts').select('*').order('created_at', { ascending: false });

if ((profile.roles as any).name === 'employee') {
  contractsQuery = contractsQuery.eq('created_by', user.id);
}

const { data: contracts } = await contractsQuery;
```

Mismo filtro para payments:
```tsx
if (roleName === 'employee') {
  paymentsQuery = paymentsQuery.eq('contract_id', /* in user contracts */);
}
```

### 2. ContractQuery.tsx

En `loadContracts`, agregar filtro cuando el rol es employee:

```tsx
let query = supabase.from('contracts').select(`*, creator:profiles!contracts_created_by_fkey(...)`).order('created_at', { ascending: false });

if (userRole === 'employee') {
  const { data: { user } } = await supabase.auth.getUser();
  query = query.eq('created_by', user.id);
}

const { data: contracts } = await query;
```

Problema: `loadContracts` se llama antes de que `userRole` se actualice. Solucion: pasar el userId y rol directamente a `loadContracts`.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/pages/Dashboard.tsx` | Filtrar contracts y payments por `created_by = user.id` cuando el rol es employee |
| `src/pages/ContractQuery.tsx` | Filtrar contracts por `created_by = user.id` cuando el rol es employee; pasar rol a loadContracts |

## Resultado

- Employee solo ve SUS contratos en Dashboard y ContractQuery
- Admin, supervisor y super_admin siguen viendo todos los contratos
- Los stats, graficas y tablas reflejan datos correctos segun el rol

