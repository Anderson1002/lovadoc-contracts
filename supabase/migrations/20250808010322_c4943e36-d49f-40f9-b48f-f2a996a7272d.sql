-- Fix UPDATE policy to allow owner to transition from draft -> pending_review (WITH CHECK)
DROP POLICY IF EXISTS billing_accounts_update_policy ON public.billing_accounts;
CREATE POLICY billing_accounts_update_policy
ON public.billing_accounts
FOR UPDATE
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type]))
  OR (
    (created_by IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()))
    AND status = 'draft'::text
  )
)
WITH CHECK (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type]))
  OR (
    (created_by IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()))
    AND (status = ANY (ARRAY['draft'::text,'pending_review'::text]))
  )
);