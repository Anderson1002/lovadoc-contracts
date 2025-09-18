-- Create function to get current user's proceso_id
CREATE OR REPLACE FUNCTION public.get_current_user_proceso_id()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.proceso_id
  FROM public.profiles p
  WHERE p.user_id = auth.uid();
$$;

-- Update contracts RLS policies to include process-based filtering
DROP POLICY IF EXISTS "contracts_select_policy" ON public.contracts;
CREATE POLICY "contracts_select_policy" ON public.contracts
FOR SELECT USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type])) OR
  (created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())) OR
  (get_user_role(auth.uid()) = 'supervisor'::user_role_type AND 
   created_by IN (SELECT id FROM profiles WHERE proceso_id = get_current_user_proceso_id()))
);

-- Update billing_accounts RLS policies to include process-based filtering  
DROP POLICY IF EXISTS "billing_accounts_select_policy" ON public.billing_accounts;
CREATE POLICY "billing_accounts_select_policy" ON public.billing_accounts
FOR SELECT USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type])) OR
  ((get_user_role(auth.uid()) = 'supervisor'::user_role_type) AND (status <> 'borrador'::text) AND
   (created_by IN (SELECT id FROM profiles WHERE proceso_id = get_current_user_proceso_id()))) OR
  ((get_user_role(auth.uid()) = 'treasury'::user_role_type) AND (status <> 'borrador'::text)) OR
  (created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- Update profiles select policy to include process-based filtering for supervisors
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (
  (user_id = auth.uid()) OR
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type])) OR
  ((get_user_role(auth.uid()) = 'supervisor'::user_role_type) AND 
   (proceso_id = get_current_user_proceso_id() OR role_id IN (SELECT id FROM roles WHERE name = 'supervisor'::user_role_type))) OR
  ((get_user_role(auth.uid()) = 'employee'::user_role_type) AND 
   (role_id IN (SELECT id FROM roles WHERE name = 'supervisor'::user_role_type)))
);