-- Eliminar el trigger problemático que usa 'status'
DROP TRIGGER IF EXISTS update_contract_status_trigger ON public.contracts;

-- Eliminar la función problemática que usa 'status'
DROP FUNCTION IF EXISTS public.check_contract_status_on_change();

-- Crear la función correcta que usa 'estado'
CREATE OR REPLACE FUNCTION public.check_contract_estado_on_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verificar si el contrato debe completarse automáticamente
  IF NEW.end_date IS NOT NULL AND NEW.end_date < CURRENT_DATE AND NEW.estado != 'completado'::contract_state THEN
    NEW.estado = 'completado'::contract_state;
    NEW.state_code = 'COM';
  END IF;
  
  -- Actualizar timestamp
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Crear el trigger correcto que usa 'estado'
CREATE TRIGGER update_contract_estado_trigger
  BEFORE INSERT OR UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.check_contract_estado_on_change();