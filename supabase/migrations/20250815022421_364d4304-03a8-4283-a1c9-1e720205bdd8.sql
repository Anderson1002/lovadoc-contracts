-- Check if supervisors can update user roles
-- First, let's see the current RLS policies on profiles table

-- Add a new RLS policy to allow supervisors to update user roles
CREATE POLICY "supervisors_can_update_user_roles" 
ON public.profiles 
FOR UPDATE 
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type, 'supervisor'::user_role_type])) 
  AND 
  (user_id != auth.uid() OR get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type]))
)
WITH CHECK (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type, 'supervisor'::user_role_type])) 
  AND 
  (user_id != auth.uid() OR get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type]))
);