-- Allow owners to update their billing accounts while in draft (to enable submit for review)
DROP POLICY IF EXISTS billing_accounts_update_policy ON public.billing_accounts;
CREATE POLICY billing_accounts_update_policy
ON public.billing_accounts
FOR UPDATE
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type]))
  OR (
    (created_by IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()))
    AND (status = 'draft'::text)
  )
);

-- Allow deleting billing activities by owners while the parent account is in draft
DROP POLICY IF EXISTS billing_activities_delete_policy ON public.billing_activities;
CREATE POLICY billing_activities_delete_policy
ON public.billing_activities
FOR DELETE
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type]))
  OR (
    billing_account_id IN (
      SELECT ba.id
      FROM billing_accounts ba
      JOIN profiles p ON ba.created_by = p.id
      WHERE p.user_id = auth.uid()
      AND ba.status = 'draft'::text
    )
  )
);

-- Allow deleting evidence files for activities owned by the user while in draft
DROP POLICY IF EXISTS billing_activity_evidence_delete_policy ON public.billing_activity_evidence;
CREATE POLICY billing_activity_evidence_delete_policy
ON public.billing_activity_evidence
FOR DELETE
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type]))
  OR (
    uploaded_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    AND billing_activity_id IN (
      SELECT a.id
      FROM billing_activities a
      JOIN billing_accounts ba ON a.billing_account_id = ba.id
      JOIN profiles p ON ba.created_by = p.id
      WHERE p.user_id = auth.uid()
      AND ba.status = 'draft'::text
    )
  )
);