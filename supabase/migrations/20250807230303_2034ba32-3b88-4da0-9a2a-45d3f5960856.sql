-- Permitir que los empleados vean perfiles de supervisores para asignarlos a contratos
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

CREATE POLICY "profiles_select_policy" 
ON public.profiles 
FOR SELECT 
USING (
  -- El usuario puede ver su propio perfil
  user_id = auth.uid() 
  OR 
  -- Los administradores pueden ver todos los perfiles
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type]))
  OR
  -- Los empleados pueden ver perfiles de supervisores para asignarlos
  (get_user_role(auth.uid()) = 'employee'::user_role_type AND role_id IN (
    SELECT id FROM roles WHERE name = 'supervisor'
  ))
);