-- Update the validation function to allow treasury to change aprobada -> causada
CREATE OR REPLACE FUNCTION public.validate_billing_account_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_role user_role_type;
BEGIN
  SELECT public.get_user_role(auth.uid()) INTO v_role;
  
  -- Update the updated_at timestamp
  NEW.updated_at := now();

  -- Handle status transitions
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Employee can only send to review from draft or rejected
    IF v_role = 'employee' THEN
      IF NOT (OLD.status IN ('borrador','rechazada') AND NEW.status = 'pendiente_revision') THEN
        RAISE EXCEPTION 'El empleado solo puede enviar a pendiente_revision desde borrador o rechazada';
      END IF;
      -- Set enviado_el timestamp when sending to review
      IF NEW.status = 'pendiente_revision' AND NEW.enviado_el IS NULL THEN
        NEW.enviado_el := now();
      END IF;
    -- Supervisor can approve or reject pending accounts
    ELSIF v_role = 'supervisor' THEN
      IF NOT (OLD.status = 'pendiente_revision' AND NEW.status IN ('aprobada','rechazada')) THEN
        RAISE EXCEPTION 'El supervisor solo puede aprobar o rechazar cuentas en pendiente_revision';
      END IF;
    -- Treasury can mark approved accounts as "causada" (paid) or return to pending review
    ELSIF v_role = 'treasury' THEN
      IF NOT ((OLD.status = 'aprobada' AND NEW.status = 'causada') OR (OLD.status = 'aprobada' AND NEW.status = 'pendiente_revision')) THEN
        RAISE EXCEPTION 'Tesorería solo puede marcar cuentas aprobadas como causadas o devolverlas a pendiente_revision';
      END IF;
    END IF;
  END IF;

  -- Sync state_code with status for consistency
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
$$;

-- Also update the other validation function
CREATE OR REPLACE FUNCTION public.validate_cuenta_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_role user_role_type;
BEGIN
  SELECT public.get_user_role(auth.uid()) INTO v_role;
  
  NEW.updated_at := now();

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Employee transitions
    IF v_role = 'employee' THEN
      IF OLD.status = 'borrador' AND NEW.status = 'pendiente_revision' THEN
        IF NEW.enviado_el IS NULL THEN
          NEW.enviado_el := now();
        END IF;
      ELSIF OLD.status = 'rechazada' AND NEW.status = 'pendiente_revision' THEN
        -- Allow employee to resubmit after rejection
      ELSE
        RAISE EXCEPTION 'Transición de estado no válida para empleado: % -> %', OLD.status, NEW.status;
      END IF;
    -- Supervisor transitions
    ELSIF v_role = 'supervisor' THEN
      IF OLD.status = 'pendiente_revision' AND NEW.status IN ('aprobada','rechazada') THEN
        -- ok
      ELSE
        RAISE EXCEPTION 'Transición de estado no válida para supervisor: % -> %', OLD.status, NEW.status;
      END IF;
    -- Treasury transitions
    ELSIF v_role = 'treasury' THEN
      IF (OLD.status = 'aprobada' AND NEW.status = 'causada') OR (OLD.status = 'aprobada' AND NEW.status = 'pendiente_revision') THEN
        -- ok - treasury can mark as paid or return to supervisor
      ELSE
        RAISE EXCEPTION 'Transición de estado no válida para tesorería: % -> %', OLD.status, NEW.status;
      END IF;
    ELSE
      RAISE EXCEPTION 'Transición de estado no válida: % -> %', OLD.status, NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;