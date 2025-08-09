-- Update RLS policies for billing_activities to include treasury
DROP POLICY IF EXISTS "billing_activities_select_policy" ON public.billing_activities;

CREATE POLICY "billing_activities_select_policy" 
ON public.billing_activities 
FOR SELECT 
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type, 'treasury'::user_role_type])) 
  OR 
  (billing_account_id IN ( SELECT billing_accounts.id FROM billing_accounts WHERE (billing_accounts.created_by IN ( SELECT profiles.id FROM profiles WHERE (profiles.user_id = auth.uid())))))
);

-- Update RLS policies for billing_documents to include treasury
DROP POLICY IF EXISTS "billing_documents_select_policy" ON public.billing_documents;

CREATE POLICY "billing_documents_select_policy" 
ON public.billing_documents 
FOR SELECT 
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type, 'treasury'::user_role_type])) 
  OR 
  (uploaded_by IN ( SELECT profiles.id FROM profiles WHERE (profiles.user_id = auth.uid())))
);

-- Update RLS policies for billing_activity_evidence to include treasury
DROP POLICY IF EXISTS "billing_activity_evidence_select_policy" ON public.billing_activity_evidence;

CREATE POLICY "billing_activity_evidence_select_policy" 
ON public.billing_activity_evidence 
FOR SELECT 
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type, 'treasury'::user_role_type])) 
  OR 
  (uploaded_by IN ( SELECT profiles.id FROM profiles WHERE (profiles.user_id = auth.uid())))
);