
-- Fix 1: trigger that logs history inserts into historial_estado_cuenta which has RLS with no policies.
-- Make function SECURITY DEFINER so it bypasses RLS when called as a trigger.
CREATE OR REPLACE FUNCTION public.log_cuenta_status_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.historial_estado_cuenta (cuenta_id, estado_anterior, estado_nuevo, usuario_id)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix 2: Add DELETE policy on billing_accounts.
-- Employees can delete their own drafts (borrador). Admin/super_admin can delete anything.
DROP POLICY IF EXISTS billing_accounts_delete_policy ON public.billing_accounts;
CREATE POLICY billing_accounts_delete_policy ON public.billing_accounts
FOR DELETE TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('super_admin','admin')
  OR (
    created_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND status = 'borrador'
  )
);
