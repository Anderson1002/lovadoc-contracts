

# Plan: Eliminar auto-completado de contratos y corregir visibilidad

## Problema

Hay un trigger en la base de datos (`check_contract_estado_on_change`) que automaticamente cambia el estado de un contrato a "completado" cuando `end_date < CURRENT_DATE`. Esto hace que contratos con fechas pasadas (usados para pruebas o registros historicos) aparezcan como "completado" inmediatamente, sin que el supervisor los haya gestionado.

El flujo correcto es: un contrato debe permanecer en estado "registrado" hasta que un supervisor lo apruebe, devuelva o cambie su estado manualmente.

## Donde ve el supervisor los contratos

El supervisor accede a:
- **Gestionar Contratos** (`/contracts`) - lista de contratos de su proceso
- **Pendientes Aprobacion** (`/contracts/pending`) - contratos esperando gestion

El employee solo ve **Consulta Avanzada** (`/contracts/query`).

## Solucion

### 1. Modificar el trigger `check_contract_estado_on_change`
Eliminar la logica que auto-completa contratos por fecha. El trigger solo debe actualizar `updated_at`.

```sql
CREATE OR REPLACE FUNCTION public.check_contract_estado_on_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

### 2. Corregir contratos ya marcados incorrectamente
Actualizar el contrato OID 3 (y cualquier otro) que fue auto-completado de vuelta a "registrado":

```sql
UPDATE contracts 
SET estado = 'registrado', state_code = 'REG' 
WHERE estado = 'completado' 
  AND id NOT IN (
    SELECT contract_id FROM contract_state_history 
    WHERE estado_nuevo = 'completado'
  );
```

### 3. Agregar `/contracts/query` al sidebar del supervisor
Actualmente "Consulta Avanzada" solo esta visible para `super_admin`, `admin` y `employee`. Agregar `supervisor` para que tambien pueda consultar contratos ahi.

## Archivos afectados

| Recurso | Cambio |
|---------|--------|
| Migracion SQL | Modificar trigger + corregir estados |
| `src/components/ui/app-sidebar.tsx` | Agregar rol `supervisor` a Consulta Avanzada |

## Resultado

- Contratos con fechas pasadas permanecen en "registrado" hasta gestion manual
- El supervisor puede ver y gestionar contratos desde `/contracts`, `/contracts/pending` y `/contracts/query`

