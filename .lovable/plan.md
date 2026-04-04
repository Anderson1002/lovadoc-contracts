

# Plan: Hacer campos de origen externo no editables para empleados en EditContract

## Problema

En `CreateContract`, cuando el empleado selecciona un contrato de la tabla externa `contract`, los siguientes datos se pre-cargan como **solo lectura** (disabled):
- Numero de Contrato (`contract_number` / `CONTRATO`)
- RP y CDP
- Descripcion / Objeto del contrato (`OBSERVACION RP`)
- Valor Total (`VALOR_INICIAL`)

Sin embargo, en `EditContract` (`/contracts/{id}/edit`), **todos esos campos son editables**, permitiendo al empleado modificar datos que provienen del origen externo y no deberian ser manipulados.

## Campos que deben ser no editables para employee

| Campo en EditContract | Origen externo (tabla `contract`) | Debe ser editable? |
|---|---|---|
| Numero de Contrato | `CONTRATO` | No |
| Tipo de Contrato | No viene del origen | Si (ya fue seleccionado al crear) |
| Descripcion | `OBSERVACION RP` | No |
| Cliente (ClientSelector) | Asociado por `TERCERO` | No |
| Valor Total | `VALOR_INICIAL` | No |
| Fechas inicio/fin | Ingresadas por el empleado | Si |
| Contrato firmado (PDF) | Subido por el empleado | Si |

## Solucion

En `src/pages/EditContract.tsx`:

1. **Detectar rol del usuario** - Consultar el rol del usuario logueado (igual que en ContractDetails)
2. **Deshabilitar campos de origen externo para employee**:
   - `contract_number`: Input con `disabled`
   - `description`: Textarea con `disabled`
   - `client_profile_id` (ClientSelector): ocultar o deshabilitar
   - `total_amount`: Input con `disabled`
3. **Mantener editables**: fechas de inicio/fin, tipo de contrato, y subida de PDF

### Detalle tecnico

Agregar al inicio del componente la logica para obtener el `userRole`:

```tsx
const [userRole, setUserRole] = useState<string | null>(null);

useEffect(() => {
  const fetchRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role_id, roles:role_id(name)')
        .eq('user_id', user.id)
        .single();
      if (profile) setUserRole((profile as any).roles?.name);
    }
  };
  fetchRole();
}, []);
```

Luego condicionar los campos:
- `contract_number` Input: `disabled={userRole === 'employee'}`
- `description` Textarea: `disabled={userRole === 'employee'}`
- `total_amount` Input: `disabled={userRole === 'employee'}`
- Card de "Informacion del Cliente": `{userRole !== 'employee' && (...)}` o deshabilitar el selector

## Archivo afectado

| Archivo | Cambio |
|---------|--------|
| `src/pages/EditContract.tsx` | Agregar deteccion de rol + deshabilitar campos de origen externo para employee |

## Resultado

- Employee solo puede editar fechas y subir PDF en la vista de edicion
- Admin/supervisor siguen con acceso completo a todos los campos
- Los datos de origen externo quedan protegidos

