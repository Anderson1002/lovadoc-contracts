
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_current_user_proceso_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_contract_state(character varying) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_billing_account_state(character varying) FROM anon, public;
