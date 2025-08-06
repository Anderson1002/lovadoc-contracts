-- Función para actualizar automáticamente los estados de contratos basándose en fechas
CREATE OR REPLACE FUNCTION public.update_contract_statuses()
RETURNS void AS $$
BEGIN
  -- Actualizar contratos que han terminado (end_date pasó y no están cancelados)
  UPDATE public.contracts 
  SET status = 'completed'::contract_status,
      updated_at = now()
  WHERE end_date < CURRENT_DATE 
    AND status IN ('active'::contract_status, 'draft'::contract_status)
    AND status != 'cancelled'::contract_status;
    
  -- Actualizar contratos que han comenzado (start_date llegó y están en draft)
  UPDATE public.contracts 
  SET status = 'active'::contract_status,
      updated_at = now()
  WHERE start_date <= CURRENT_DATE 
    AND status = 'draft'::contract_status;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejecutar la función inmediatamente para actualizar estados existentes
SELECT public.update_contract_statuses();

-- Crear un trigger que actualice automáticamente cuando se inserten o actualicen contratos
CREATE OR REPLACE FUNCTION public.check_contract_status_on_change()
RETURNS trigger AS $$
BEGIN
  -- Si es INSERT o UPDATE, verificar el estado del contrato específico
  IF NEW.end_date IS NOT NULL AND NEW.end_date < CURRENT_DATE THEN
    NEW.status = 'completed'::contract_status;
  ELSIF NEW.start_date IS NOT NULL AND NEW.start_date <= CURRENT_DATE AND NEW.status = 'draft'::contract_status THEN
    NEW.status = 'active'::contract_status;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS update_contract_status_trigger ON public.contracts;
CREATE TRIGGER update_contract_status_trigger
  BEFORE INSERT OR UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.check_contract_status_on_change();