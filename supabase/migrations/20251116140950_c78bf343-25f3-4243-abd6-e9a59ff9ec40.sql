-- Add changes_details column to contract_state_history table
ALTER TABLE public.contract_state_history 
ADD COLUMN changes_details JSONB DEFAULT NULL;

COMMENT ON COLUMN public.contract_state_history.changes_details IS 
'Detalles de campos modificados en formato JSON: {"field_name": {"old": "valor_anterior", "new": "valor_nuevo", "label": "Etiqueta del campo"}}';