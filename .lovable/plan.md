## Problema confirmado

Contrato OID #1: **01/01/2026 → 28/02/2026**.
La UI muestra **"1 meses"** pero deberían ser **2 meses** (enero + febrero completos).

### Causa

En `src/pages/CreateContract.tsx` (líneas 78-86) y `src/pages/EditContract.tsx` (líneas 220-235), la fórmula es:

```ts
const diffDays = Math.ceil((end - start) / 86400000); // = 58 días
const diffMonths = Math.floor(diffDays / 30);          // = floor(58/30) = 1
```

Esto:
1. Ignora el calendario real (meses no tienen 30 días).
2. Usa `floor`, descartando el último mes incompleto aunque casi llegue.
3. No cuenta el día final como inclusivo (1 ene → 28 feb son 59 días inclusivos = 2 meses).

El valor `execution_period_months = 1` quedó **persistido en BD** para el contrato #1 con ese cálculo erróneo.

## Solución propuesta

### 1. Reemplazar la función de cálculo (en ambos archivos)

Usar `date-fns` (`differenceInMonths` + `differenceInDays`) que maneja calendario real:

```ts
import { differenceInMonths, differenceInDays, addMonths } from "date-fns";

const calculateExecutionPeriod = (startStr: string, endStr: string) => {
  const start = parseLocalDate(startStr);
  // Sumar 1 día para que el rango sea inclusivo (estándar en contratos)
  const endInclusive = new Date(parseLocalDate(endStr));
  endInclusive.setDate(endInclusive.getDate() + 1);

  const months = differenceInMonths(endInclusive, start);
  const remainderDays = differenceInDays(endInclusive, addMonths(start, months));
  return { months, days: remainderDays };
};
```

Resultado para 01/01/2026 → 28/02/2026:
- endInclusive = 01/03/2026
- months = 2, days = 0 ✅

### 2. Recalcular el contrato existente

Ejecutar UPDATE puntual en migración para el contrato #1 (y futuros si los hay) para que `execution_period_months` refleje el valor correcto:

```sql
UPDATE contracts
SET execution_period_months = 2, execution_period_days = 0
WHERE oid = 1;
```

(Opcional: recalcular masivamente todos los contratos con la misma fórmula vía función SQL — confirmar antes de ejecutar.)

### 3. Verificación

- Recargar `/billing` → "Crear cuenta de cobro" → seleccionar contrato 001-2026.
- "Período de Ejecución" debe mostrar **2 meses**.
- Validar también en la pantalla de detalles del contrato y en la Certificación.

## Archivos a editar

- `src/pages/CreateContract.tsx` (función `calculateExecutionPeriod`, importar `parseLocalDate` + utilidades de `date-fns`).
- `src/pages/EditContract.tsx` (idem).
- Nueva migración SQL para corregir el contrato #1.

## Pregunta

¿Recalculamos solo el contrato #1 o aplicamos un UPDATE masivo a todos los contratos existentes con la fórmula corregida?
