-- FASE 2.2: Eliminar columna status y enum contract_status

-- Eliminar la columna status de la tabla contracts
ALTER TABLE public.contracts 
DROP COLUMN IF EXISTS status;

-- Eliminar el tipo enum contract_status
DROP TYPE IF EXISTS public.contract_status;