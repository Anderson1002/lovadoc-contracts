-- 1. Update validate_billing_account_transition to enforce 3 documents complete before submission
CREATE OR REPLACE FUNCTION public.validate_billing_account_transition()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role user_role_type;
BEGIN
  SELECT public.get_user_role(auth.uid()) INTO v_role;

  NEW.updated_at := now();

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Block submission to review if any of the 3 required documents is incomplete
    IF NEW.status = 'pendiente_revision' AND OLD.status IN ('borrador','rechazada') THEN
      IF NEW.informe_complete IS NOT TRUE
         OR NEW.certificacion_complete IS NOT TRUE
         OR NEW.cuenta_cobro_complete IS NOT TRUE THEN
        RAISE EXCEPTION 'No se puede radicar la cuenta de cobro: faltan documentos completos (Informe, Certificación y Cuenta de Cobro deben estar al 100%%)';
      END IF;
    END IF;

    IF v_role = 'employee' THEN
      IF NOT (OLD.status IN ('borrador','rechazada') AND NEW.status = 'pendiente_revision') THEN
        RAISE EXCEPTION 'El empleado solo puede enviar a pendiente_revision desde borrador o rechazada';
      END IF;
      IF NEW.status = 'pendiente_revision' AND NEW.enviado_el IS NULL THEN
        NEW.enviado_el := now();
      END IF;
    ELSIF v_role = 'supervisor' THEN
      IF NOT (OLD.status = 'pendiente_revision' AND NEW.status IN ('aprobada','rechazada')) THEN
        RAISE EXCEPTION 'El supervisor solo puede aprobar o rechazar cuentas en pendiente_revision';
      END IF;
    ELSIF v_role = 'treasury' THEN
      IF NOT ((OLD.status = 'aprobada' AND NEW.status = 'causada') OR (OLD.status = 'aprobada' AND NEW.status = 'pendiente_revision')) THEN
        RAISE EXCEPTION 'Tesorería solo puede marcar cuentas aprobadas como causadas o devolverlas a pendiente_revision';
      END IF;
    END IF;
  END IF;

  IF NEW.status = 'borrador' THEN
    NEW.state_code := 'BOR';
  ELSIF NEW.status = 'pendiente_revision' THEN
    NEW.state_code := 'PEN';
  ELSIF NEW.status = 'aprobada' THEN
    NEW.state_code := 'APR';
  ELSIF NEW.status = 'rechazada' THEN
    NEW.state_code := 'REC';
  ELSIF NEW.status = 'causada' THEN
    NEW.state_code := 'CAU';
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Update validate_cuenta_transition with the same completeness guard
CREATE OR REPLACE FUNCTION public.validate_cuenta_transition()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role user_role_type;
BEGIN
  SELECT public.get_user_role(auth.uid()) INTO v_role;

  NEW.updated_at := now();

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'pendiente_revision' AND OLD.status IN ('borrador','rechazada') THEN
      IF NEW.informe_complete IS NOT TRUE
         OR NEW.certificacion_complete IS NOT TRUE
         OR NEW.cuenta_cobro_complete IS NOT TRUE THEN
        RAISE EXCEPTION 'No se puede radicar la cuenta de cobro: faltan documentos completos (Informe, Certificación y Cuenta de Cobro deben estar al 100%%)';
      END IF;
    END IF;

    IF v_role = 'employee' THEN
      IF OLD.status = 'borrador' AND NEW.status = 'pendiente_revision' THEN
        IF NEW.enviado_el IS NULL THEN
          NEW.enviado_el := now();
        END IF;
      ELSIF OLD.status = 'rechazada' AND NEW.status = 'pendiente_revision' THEN
        -- ok
      ELSE
        RAISE EXCEPTION 'Transición de estado no válida para empleado: % -> %', OLD.status, NEW.status;
      END IF;
    ELSIF v_role = 'supervisor' THEN
      IF OLD.status = 'pendiente_revision' AND NEW.status IN ('aprobada','rechazada') THEN
        -- ok
      ELSE
        RAISE EXCEPTION 'Transición de estado no válida para supervisor: % -> %', OLD.status, NEW.status;
      END IF;
    ELSIF v_role = 'treasury' THEN
      IF (OLD.status = 'aprobada' AND NEW.status = 'causada') OR (OLD.status = 'aprobada' AND NEW.status = 'pendiente_revision') THEN
        -- ok
      ELSE
        RAISE EXCEPTION 'Transición de estado no válida para tesorería: % -> %', OLD.status, NEW.status;
      END IF;
    ELSE
      RAISE EXCEPTION 'Transición de estado no válida: % -> %', OLD.status, NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3. Sanitize existing rows: return to 'borrador' any submitted/rejected account that is incomplete
ALTER TABLE public.billing_accounts DISABLE TRIGGER USER;

WITH affected AS (
  SELECT id, status
  FROM public.billing_accounts
  WHERE status IN ('pendiente_revision','rechazada')
    AND (
      informe_complete IS NOT TRUE
      OR certificacion_complete IS NOT TRUE
      OR cuenta_cobro_complete IS NOT TRUE
    )
)
INSERT INTO public.historial_estado_cuenta (cuenta_id, estado_anterior, estado_nuevo, usuario_id)
SELECT a.id, a.status, 'borrador', ba.created_by
FROM affected a
JOIN public.billing_accounts ba ON ba.id = a.id;

UPDATE public.billing_accounts
SET status = 'borrador',
    state_code = 'BOR',
    enviado_el = NULL,
    comentario_supervisor = COALESCE(comentario_supervisor || E'\n\n', '')
      || '[Sistema] Devuelta automáticamente a borrador: documentos incompletos (Informe / Certificación / Cuenta de Cobro).'
WHERE status IN ('pendiente_revision','rechazada')
  AND (
    informe_complete IS NOT TRUE
    OR certificacion_complete IS NOT TRUE
    OR cuenta_cobro_complete IS NOT TRUE
  );

ALTER TABLE public.billing_accounts ENABLE TRIGGER USER;