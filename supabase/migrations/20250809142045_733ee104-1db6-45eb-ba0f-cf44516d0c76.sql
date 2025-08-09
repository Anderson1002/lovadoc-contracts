-- Create a new role for treasury users if it doesn't exist
INSERT INTO roles (name, display_name) 
VALUES ('treasury', 'Tesoreria')
ON CONFLICT (name) DO NOTHING;

-- Update billing accounts RLS policy to allow returned accounts to be editable by employees
DROP POLICY IF EXISTS "billing_accounts_update_policy" ON public.billing_accounts;

CREATE POLICY "billing_accounts_update_policy" 
ON public.billing_accounts 
FOR UPDATE 
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type])) OR 
  ((get_user_role(auth.uid()) = ANY (ARRAY['supervisor'::user_role_type, 'treasury'::user_role_type])) AND (status = ANY (ARRAY['pendiente_revision'::text, 'aprobada'::text, 'rechazada'::text]))) OR 
  ((created_by IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())) AND (status = ANY (ARRAY['borrador'::text, 'rechazada'::text])))
)
WITH CHECK (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type])) OR 
  ((get_user_role(auth.uid()) = ANY (ARRAY['supervisor'::user_role_type, 'treasury'::user_role_type])) AND (status = ANY (ARRAY['pendiente_revision'::text, 'aprobada'::text, 'rechazada'::text]))) OR 
  ((created_by IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())) AND (status = ANY (ARRAY['borrador'::text, 'rechazada'::text])))
);

-- Create function to handle state transitions for billing accounts
CREATE OR REPLACE FUNCTION public.validate_billing_account_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
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
    -- Treasury can mark approved accounts as "causada" (paid)
    ELSIF v_role = 'treasury' THEN
      IF NOT (OLD.status = 'aprobada' AND NEW.status = 'causada') THEN
        RAISE EXCEPTION 'Tesorería solo puede marcar cuentas aprobadas como causadas';
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
$function$;

-- Create trigger for billing account validation
DROP TRIGGER IF EXISTS trigger_validate_billing_account_transition ON public.billing_accounts;
CREATE TRIGGER trigger_validate_billing_account_transition
  BEFORE UPDATE ON public.billing_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_billing_account_transition();