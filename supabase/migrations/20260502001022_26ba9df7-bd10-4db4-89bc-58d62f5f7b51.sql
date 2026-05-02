-- Permitir al rol Jurídica insertar y actualizar registros en la tabla externa contract
CREATE POLICY contract_insert_juridica ON public.contract
FOR INSERT
WITH CHECK (
  get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type, 'juridica'::user_role_type])
);

CREATE POLICY contract_update_juridica ON public.contract
FOR UPDATE
USING (
  get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type, 'juridica'::user_role_type])
)
WITH CHECK (
  get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type, 'juridica'::user_role_type])
);