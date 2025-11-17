-- Add foreign key constraint from contract_state_history.changed_by to profiles.id
ALTER TABLE public.contract_state_history
ADD CONSTRAINT contract_state_history_changed_by_fkey
FOREIGN KEY (changed_by)
REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- Add index for better performance on joins
CREATE INDEX IF NOT EXISTS idx_contract_state_history_changed_by
ON public.contract_state_history(changed_by);