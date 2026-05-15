## Objetivo

Impedir que una cuenta de cobro pase a estado `pendiente_revision` (radicada/enviada al supervisor) si los 3 formatos requeridos no están completos: **Informe**, **Certificación** y **Cuenta de Cobro**. Aplicar defensa en dos capas (UI + base de datos) y sanear las cuentas ya enviadas que están incompletas devolviéndolas a `borrador`.

---

## Definición de "completo"

Se reutilizan las banderas que ya existen en `billing_accounts`:

- `informe_complete = true`
- `certificacion_complete = true`
- `cuenta_cobro_complete = true`

Una cuenta solo puede transicionar a `pendiente_revision` si las tres banderas son `true`.

---

## Cambios

### 1. Capa de base de datos (bloqueo definitivo)

Modificar el trigger `validate_billing_account_transition` (y por consistencia `validate_cuenta_transition`) para que, cuando un empleado intenta pasar de `borrador`/`rechazada` → `pendiente_revision`, valide:

```text
IF NEW.informe_complete IS NOT TRUE
   OR NEW.certificacion_complete IS NOT TRUE
   OR NEW.cuenta_cobro_complete IS NOT TRUE
THEN
  RAISE EXCEPTION 'No se puede radicar: faltan documentos completos
   (Informe, Certificación, Cuenta de Cobro)';
END IF;
```

Esto bloquea cualquier intento de radicar incompleto, sin importar si la UI falla.

### 2. Capa de UI (UX clara)

En `BillingAccountActions.tsx` (botón "Radicar/Enviar al supervisor"):

- Calcular `canSubmit = informe_complete && certificacion_complete && cuenta_cobro_complete`.
- Si `canSubmit` es false:
  - Deshabilitar el botón.
  - Tooltip listando exactamente qué formato falta ("Falta: Certificación, Cuenta de Cobro").
- Mantener el toast de error si la BD rechaza (defensa).

Reutilizar `BillingCompletionProgress` para la lógica de cómputo si ya expone los flags, evitando duplicar reglas.

### 3. Saneamiento de cuentas existentes (one-shot)

Migración de datos: devolver a `borrador` las cuentas que actualmente están en `pendiente_revision` o `rechazada` con algún flag incompleto:

```sql
UPDATE billing_accounts
SET status = 'borrador',
    state_code = 'BOR',
    enviado_el = NULL
WHERE status IN ('pendiente_revision','rechazada')
  AND (
    informe_complete IS NOT TRUE
    OR certificacion_complete IS NOT TRUE
    OR cuenta_cobro_complete IS NOT TRUE
  );
```

Para evitar que el trigger bloquee este saneamiento, se ejecuta como parte de la misma migración (con el trigger temporalmente deshabilitado o usando `ALTER TABLE ... DISABLE TRIGGER` solo en ese statement) y se registra cada cambio en `historial_estado_cuenta` con un comentario claro ("Devuelta automáticamente: documentos incompletos").

### 4. Aviso al contratista

En `BillingAccountsList`, mostrar un badge "Devuelta — completar documentos" en las cuentas que fueron devueltas por el saneamiento, para que el contratista sepa por qué su cuenta volvió a borrador. Esto se identifica por el último registro en `historial_estado_cuenta` con el comentario del paso 3.

---

## Archivos afectados

- **Nueva migración SQL**: actualiza ambos triggers + saneamiento de datos.
- `src/components/billing/BillingAccountActions.tsx` — bloqueo de botón + tooltip.
- `src/components/billing/BillingAccountsList.tsx` — badge informativo (opcional, leve).

## Fuera de alcance

- No se cambia el flujo del supervisor ni de tesorería.
- No se modifican los criterios de "completo" de cada formato (siguen igual).
- No se borra ninguna cuenta; solo se devuelven a `borrador`.
