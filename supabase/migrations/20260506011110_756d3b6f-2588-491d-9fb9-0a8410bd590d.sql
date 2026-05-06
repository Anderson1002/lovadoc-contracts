-- 1) Profiles: drop privilege-escalation policy
DROP POLICY IF EXISTS "supervisors_can_update_user_roles" ON public.profiles;

-- Allow super_admin/admin to update any profile (legitimate user management)
CREATE POLICY "admins_can_update_profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type]))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type]));

-- 2) Activities: restrict insert
DROP POLICY IF EXISTS "activities_insert_policy" ON public.activities;

CREATE POLICY "activities_insert_policy"
ON public.activities
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3) Storage: drop overly broad contracts read policy
DROP POLICY IF EXISTS "Usuarios pueden leer sus archivos de contratos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden subir sus archivos de contratos" ON storage.objects;