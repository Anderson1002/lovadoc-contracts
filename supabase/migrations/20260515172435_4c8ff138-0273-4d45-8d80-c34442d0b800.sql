
-- 1. Tighten permissive INSERT policies
DROP POLICY IF EXISTS profiles_insert_policy ON public.profiles;
CREATE POLICY profiles_insert_policy ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS historial_estado_cuenta_insert_policy ON public.historial_estado_cuenta;
CREATE POLICY historial_estado_cuenta_insert_policy ON public.historial_estado_cuenta
  FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());

-- 2. permissions table: add admin-only policies
CREATE POLICY permissions_select_admin ON public.permissions
  FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('super_admin','admin'));
CREATE POLICY permissions_modify_admin ON public.permissions
  FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('super_admin','admin'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('super_admin','admin'));

-- 3. Set search_path on all functions missing it
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.get_user_role(uuid) SET search_path = public;
ALTER FUNCTION public.get_contract_state(character varying) SET search_path = public;
ALTER FUNCTION public.get_billing_account_state(character varying) SET search_path = public;
ALTER FUNCTION public.generate_billing_account_number() SET search_path = public;
ALTER FUNCTION public.generate_billing_number() SET search_path = public;
ALTER FUNCTION public.generate_contract_number() SET search_path = public;
ALTER FUNCTION public.set_billing_account_number() SET search_path = public;
ALTER FUNCTION public.set_contract_number() SET search_path = public;
ALTER FUNCTION public.check_contract_estado_on_change() SET search_path = public;
ALTER FUNCTION public.validate_billing_account_transition() SET search_path = public;
ALTER FUNCTION public.validate_cuenta_transition() SET search_path = public;
ALTER FUNCTION public.enforce_cuenta_update_columns() SET search_path = public;
ALTER FUNCTION public.log_cuenta_status_history() SET search_path = public;

-- 4. Revoke EXECUTE from anon/authenticated on SECURITY DEFINER trigger/internal helpers
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_contract_for_billing() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_billing_account_ownership() FROM anon, authenticated, public;
-- get_user_role and get_current_user_proceso_id are referenced by RLS policies; safe to keep callable

-- 5. Recreate view with security_invoker so it respects caller's RLS
DROP VIEW IF EXISTS public.v_billing_accounts_last_review;
CREATE VIEW public.v_billing_accounts_last_review
WITH (security_invoker = true) AS
SELECT ba.id,
    ba.account_number AS numero,
    ba.contract_id,
    to_char(ba.billing_month::timestamp with time zone, 'Month YYYY'::text) AS periodo,
    ba.amount AS valor,
    ba.status AS estado,
    ba.created_at AS fecha,
    lr.last_comment,
    lr.last_decision,
    lr.last_review_at
FROM billing_accounts ba
LEFT JOIN LATERAL (
    SELECT COALESCE(br.comentario, br.comments) AS last_comment,
           br.decision AS last_decision,
           br.created_at AS last_review_at
    FROM billing_reviews br
    WHERE br.billing_account_id = ba.id
    ORDER BY br.created_at DESC
    LIMIT 1
) lr ON true
ORDER BY ba.created_at DESC;
