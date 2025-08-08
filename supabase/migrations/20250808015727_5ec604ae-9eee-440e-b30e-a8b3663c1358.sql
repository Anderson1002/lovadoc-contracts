-- Create INSERT policy for historial_estado_cuenta table
-- This policy allows inserting history records when billing account status changes
CREATE POLICY "historial_estado_cuenta_insert_policy" 
ON public.historial_estado_cuenta 
FOR INSERT 
WITH CHECK (true);

-- Note: We use 'true' because this table is used by triggers to log status changes
-- and the trigger already has the necessary authorization context