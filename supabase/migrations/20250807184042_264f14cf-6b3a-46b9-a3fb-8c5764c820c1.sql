-- Agregar el estado 'returned' al enum de contract_status si no existe
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status' AND typelem IN (SELECT oid FROM pg_enum WHERE enumlabel = 'returned')) THEN
    ALTER TYPE contract_status ADD VALUE 'returned';
  END IF;
END $$;

-- Función para generar consecutivos de contratos
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  year_month TEXT;
  sequence_num INTEGER;
  contract_number TEXT;
BEGIN
  -- Get current year and month
  year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
  
  -- Get next sequence number for this month
  SELECT COALESCE(MAX(CAST(RIGHT(contract_number, 3) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.contracts
  WHERE contract_number LIKE 'CON-' || year_month || '-%';
  
  -- Format contract number
  contract_number := 'CON-' || year_month || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN contract_number;
END;
$function$;

-- Trigger para generar número de contrato automáticamente
CREATE OR REPLACE FUNCTION public.set_contract_number()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    NEW.contract_number := generate_contract_number();
  END IF;
  RETURN NEW;
END;
$function$;

-- Crear el trigger si no existe
DROP TRIGGER IF EXISTS trigger_set_contract_number ON public.contracts;
CREATE TRIGGER trigger_set_contract_number
  BEFORE INSERT ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_contract_number();

-- Función para generar consecutivos de cuentas de cobro
CREATE OR REPLACE FUNCTION public.generate_billing_number()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  year_month TEXT;
  sequence_num INTEGER;
  billing_number TEXT;
BEGIN
  -- Get current year and month
  year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
  
  -- Get next sequence number for this month
  SELECT COALESCE(MAX(CAST(RIGHT(account_number, 3) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.billing_accounts
  WHERE account_number LIKE 'COB-' || year_month || '-%';
  
  -- Format billing number
  billing_number := 'COB-' || year_month || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN billing_number;
END;
$function$;

-- Actualizar función de generación de número de cuenta de cobro
CREATE OR REPLACE FUNCTION public.set_billing_account_number()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.account_number IS NULL OR NEW.account_number = '' THEN
    NEW.account_number := generate_billing_number();
  END IF;
  RETURN NEW;
END;
$function$;

-- Función para validar transiciones de estado
CREATE OR REPLACE FUNCTION public.validate_contract_state_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Validar transiciones permitidas
  IF OLD.status IS NOT NULL AND OLD.status != NEW.status THEN
    CASE OLD.status
      WHEN 'draft' THEN
        IF NEW.status NOT IN ('active', 'returned', 'cancelled') THEN
          RAISE EXCEPTION 'Transición de estado no válida: % -> %', OLD.status, NEW.status;
        END IF;
      WHEN 'returned' THEN
        IF NEW.status NOT IN ('draft', 'active', 'cancelled') THEN
          RAISE EXCEPTION 'Transición de estado no válida: % -> %', OLD.status, NEW.status;
        END IF;
      WHEN 'active' THEN
        IF NEW.status NOT IN ('completed', 'cancelled') THEN
          RAISE EXCEPTION 'Transición de estado no válida: % -> %', OLD.status, NEW.status;
        END IF;
      WHEN 'completed' THEN
        -- Los contratos completados no pueden cambiar de estado
        IF NEW.status != 'completed' THEN
          RAISE EXCEPTION 'Los contratos completados no pueden cambiar de estado';
        END IF;
      WHEN 'cancelled' THEN
        -- Los contratos cancelados no pueden cambiar de estado
        IF NEW.status != 'cancelled' THEN
          RAISE EXCEPTION 'Los contratos cancelados no pueden cambiar de estado';
        END IF;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Crear trigger para validar transiciones de estado
DROP TRIGGER IF EXISTS trigger_validate_contract_state_transition ON public.contracts;
CREATE TRIGGER trigger_validate_contract_state_transition
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_contract_state_transition();