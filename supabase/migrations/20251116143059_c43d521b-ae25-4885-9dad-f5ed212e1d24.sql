-- Insert the new state into contract_states table
INSERT INTO public.contract_states (code, name, display_name, description)
VALUES (
  'COR',
  'corregido',
  'Corregido',
  'Contrato devuelto que ha sido corregido por el contratista y está listo para revisión del supervisor'
)
ON CONFLICT (code) DO NOTHING;