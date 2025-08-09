-- Fix the billing_accounts update policy to allow employees to submit for review
-- The issue is that the with_check clause doesn't allow employees to set status to 'pendiente_revision'

DROP POLICY IF EXISTS billing_accounts_update_policy ON public.billing_accounts;

CREATE POLICY billing_accounts_update_policy ON public.billing_accounts
FOR UPDATE
USING (
  -- Who can update billing accounts:
  -- 1. Super admins and admins can update anything
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type])) OR
  -- 2. Supervisors and treasury can update accounts in review/approved states
  ((get_user_role(auth.uid()) = ANY (ARRAY['supervisor'::user_role_type, 'treasury'::user_role_type])) 
   AND (status = ANY (ARRAY['pendiente_revision'::text, 'aprobada'::text, 'rechazada'::text]))) OR
  -- 3. Employees can update their own accounts in borrador or rechazada states
  ((created_by IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())) 
   AND (status = ANY (ARRAY['borrador'::text, 'rechazada'::text])))
)
WITH CHECK (
  -- What can be set as the new state:
  -- 1. Super admins and admins can set any state
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type])) OR
  -- 2. Supervisors can approve or reject accounts (set to aprobada/rechazada)
  ((get_user_role(auth.uid()) = 'supervisor'::user_role_type) 
   AND (status = ANY (ARRAY['aprobada'::text, 'rechazada'::text]))) OR
  -- 3. Treasury can mark accounts as causada
  ((get_user_role(auth.uid()) = 'treasury'::user_role_type) 
   AND (status = 'causada'::text)) OR
  -- 4. Employees can save as borrador or submit for review (pendiente_revision)
  ((created_by IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())) 
   AND (status = ANY (ARRAY['borrador'::text, 'pendiente_revision'::text])))
);