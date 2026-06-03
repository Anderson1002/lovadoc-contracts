UPDATE public.contracts SET estado = 'registrado', state_code = 'REG', comentarios_devolucion = NULL WHERE oid = 2;
INSERT INTO public.contract_state_history (contract_id, estado_anterior, estado_nuevo, changed_by, comentarios)
SELECT id, 'cancelado'::contract_state, 'registrado'::contract_state, created_by, 'Reactivación manual por Super Admin: contrato devuelto a estado registrado'
FROM public.contracts WHERE oid = 2;