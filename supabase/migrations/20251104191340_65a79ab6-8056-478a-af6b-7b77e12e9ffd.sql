-- FASE 2.1 CORREGIDA: Eliminar triggers primero, luego funciones

-- Eliminar triggers que usan el campo status
DROP TRIGGER IF EXISTS trigger_validate_contract_state_transition ON public.contracts;
DROP TRIGGER IF EXISTS contract_status_check ON public.contracts;
DROP TRIGGER IF EXISTS check_contract_status_on_change ON public.contracts;

-- Ahora eliminar las funciones obsoletas
DROP FUNCTION IF EXISTS public.validate_contract_state_transition();
DROP FUNCTION IF EXISTS public.update_contract_statuses();