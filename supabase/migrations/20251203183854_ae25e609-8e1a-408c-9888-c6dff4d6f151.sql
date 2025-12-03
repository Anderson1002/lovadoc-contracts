-- Crear función de validación para verificar estado del contrato
CREATE OR REPLACE FUNCTION public.validate_contract_for_billing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contract_status contract_state;
BEGIN
  -- Obtener el estado del contrato
  SELECT estado INTO contract_status
  FROM public.contracts
  WHERE id = NEW.contract_id;
  
  -- Verificar que el contrato existe
  IF contract_status IS NULL THEN
    RAISE EXCEPTION 'El contrato especificado no existe';
  END IF;
  
  -- Verificar que el contrato está en ejecución
  IF contract_status != 'en_ejecucion' THEN
    RAISE EXCEPTION 'Solo se pueden crear cuentas de cobro para contratos en estado "En Ejecución". Estado actual: %', contract_status;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger que se ejecuta antes de insertar en billing_accounts
CREATE TRIGGER validate_contract_status_before_insert
  BEFORE INSERT ON public.billing_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_contract_for_billing();