-- Crear función de validación para verificar que el empleado crea cuentas solo para sus contratos
CREATE OR REPLACE FUNCTION public.validate_billing_account_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role user_role_type;
  v_user_profile_id uuid;
  v_contract_created_by uuid;
BEGIN
  -- Obtener el rol del usuario actual
  SELECT get_user_role(auth.uid()) INTO v_user_role;
  
  -- Si es admin o super_admin, permitir sin restricción
  IF v_user_role IN ('super_admin', 'admin') THEN
    RETURN NEW;
  END IF;
  
  -- Obtener el profile_id del usuario actual
  SELECT id INTO v_user_profile_id
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  -- Obtener el created_by del contrato
  SELECT created_by INTO v_contract_created_by
  FROM public.contracts
  WHERE id = NEW.contract_id;
  
  -- Verificar que el contrato existe
  IF v_contract_created_by IS NULL THEN
    RAISE EXCEPTION 'El contrato especificado no existe';
  END IF;
  
  -- Para supervisores, verificar que el contrato pertenece a su proceso
  IF v_user_role = 'supervisor' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.contracts c
      JOIN public.profiles p ON c.created_by = p.id
      WHERE c.id = NEW.contract_id
      AND p.proceso_id = get_current_user_proceso_id()
    ) THEN
      RAISE EXCEPTION 'No puede crear cuentas de cobro para contratos fuera de su proceso';
    END IF;
    RETURN NEW;
  END IF;
  
  -- Para empleados, verificar que el contrato les pertenece
  IF v_user_role = 'employee' THEN
    IF v_contract_created_by != v_user_profile_id THEN
      RAISE EXCEPTION 'Solo puede crear cuentas de cobro para sus propios contratos';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger que se ejecuta antes de insertar en billing_accounts
CREATE TRIGGER validate_billing_account_ownership_before_insert
  BEFORE INSERT ON public.billing_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_billing_account_ownership();