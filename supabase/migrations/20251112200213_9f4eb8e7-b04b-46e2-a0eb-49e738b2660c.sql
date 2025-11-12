-- Enable RLS on contract_state_history if not already enabled
ALTER TABLE contract_state_history ENABLE ROW LEVEL SECURITY;

-- Policy: Allow INSERT when recording state changes (supervisors and admins)
CREATE POLICY "contract_state_history_insert_policy" 
ON contract_state_history FOR INSERT 
WITH CHECK (
  get_user_role(auth.uid()) IN ('super_admin', 'admin', 'supervisor')
);

-- Policy: Allow SELECT for viewing history
-- - Admins can see all
-- - Supervisors can see contracts from their proceso
-- - Employees can see their own contracts' history
CREATE POLICY "contract_state_history_select_policy" 
ON contract_state_history FOR SELECT 
USING (
  get_user_role(auth.uid()) IN ('super_admin', 'admin')
  OR (
    get_user_role(auth.uid()) = 'supervisor' 
    AND contract_id IN (
      SELECT c.id FROM contracts c
      JOIN profiles p ON c.created_by = p.id
      WHERE p.proceso_id = get_current_user_proceso_id()
    )
  )
  OR (
    contract_id IN (
      SELECT c.id FROM contracts c
      JOIN profiles p ON c.created_by = p.id
      WHERE p.user_id = auth.uid()
    )
  )
);