-- Update RLS policy for billing_accounts to include treasury role
DROP POLICY IF EXISTS "billing_accounts_select_policy" ON public.billing_accounts;

CREATE POLICY "billing_accounts_select_policy" 
ON public.billing_accounts 
FOR SELECT 
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type])) 
  OR 
  ((get_user_role(auth.uid()) = 'supervisor'::user_role_type) AND (status <> 'borrador'::text)) 
  OR 
  ((get_user_role(auth.uid()) = 'treasury'::user_role_type) AND (status <> 'borrador'::text))
  OR 
  (created_by IN ( SELECT profiles.id FROM profiles WHERE (profiles.user_id = auth.uid())))
);

-- Also update the UPDATE policy to allow treasury to update billing accounts
DROP POLICY IF EXISTS "billing_accounts_update_policy" ON public.billing_accounts;

CREATE POLICY "billing_accounts_update_policy" 
ON public.billing_accounts 
FOR UPDATE 
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type])) 
  OR 
  ((get_user_role(auth.uid()) = ANY (ARRAY['supervisor'::user_role_type, 'treasury'::user_role_type])) AND (status = ANY (ARRAY['pendiente_revision'::text, 'aprobada'::text, 'rechazada'::text]))) 
  OR 
  ((created_by IN ( SELECT profiles.id FROM profiles WHERE (profiles.user_id = auth.uid()))) AND (status = ANY (ARRAY['borrador'::text, 'rechazada'::text])))
)
WITH CHECK (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type])) 
  OR 
  ((get_user_role(auth.uid()) = 'supervisor'::user_role_type) AND (status = ANY (ARRAY['aprobada'::text, 'rechazada'::text]))) 
  OR 
  ((get_user_role(auth.uid()) = 'treasury'::user_role_type) AND (status = ANY (ARRAY['causada'::text, 'pendiente_revision'::text])))
  OR 
  ((created_by IN ( SELECT profiles.id FROM profiles WHERE (profiles.user_id = auth.uid()))) AND (status = ANY (ARRAY['borrador'::text, 'pendiente_revision'::text])))
);