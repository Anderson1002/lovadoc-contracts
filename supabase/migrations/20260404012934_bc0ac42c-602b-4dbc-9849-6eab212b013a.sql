
-- 1. Remove auto-complete logic from trigger, only update timestamp
CREATE OR REPLACE FUNCTION public.check_contract_estado_on_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Revert contracts incorrectly auto-completed back to "registrado"
UPDATE contracts 
SET estado = 'registrado', state_code = 'REG' 
WHERE estado = 'completado' 
  AND id NOT IN (
    SELECT contract_id FROM contract_state_history 
    WHERE estado_nuevo = 'completado'
  );
