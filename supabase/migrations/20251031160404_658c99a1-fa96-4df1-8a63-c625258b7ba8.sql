-- Agregar columnas para plazo de ejecución
ALTER TABLE public.contracts
ADD COLUMN execution_period_months INTEGER,
ADD COLUMN execution_period_days INTEGER;

-- Comentarios para documentación
COMMENT ON COLUMN public.contracts.execution_period_months IS 'Duración del contrato en meses';
COMMENT ON COLUMN public.contracts.execution_period_days IS 'Duración del contrato en días totales';

-- Actualizar registros existentes que tengan end_date NULL
UPDATE public.contracts 
SET end_date = start_date + INTERVAL '1 month'
WHERE end_date IS NULL;

-- Hacer end_date obligatorio (NOT NULL)
ALTER TABLE public.contracts
ALTER COLUMN end_date SET NOT NULL;