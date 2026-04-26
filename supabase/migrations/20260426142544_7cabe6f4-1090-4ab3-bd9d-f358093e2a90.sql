
-- 1. Crear el rol en la tabla roles
INSERT INTO public.roles (name, display_name)
VALUES ('juridica', 'Jurídica')
ON CONFLICT (name) DO NOTHING;

-- 2. Política para tabla contracts: SELECT
DROP POLICY IF EXISTS contracts_select_policy ON public.contracts;
CREATE POLICY contracts_select_policy ON public.contracts
FOR SELECT
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type, 'juridica'::user_role_type]))
  OR (created_by IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()))
  OR ((get_user_role(auth.uid()) = 'supervisor'::user_role_type) AND (created_by IN (SELECT profiles.id FROM profiles WHERE profiles.proceso_id = get_current_user_proceso_id())))
);

-- 3. Política para tabla contracts: INSERT
DROP POLICY IF EXISTS contracts_insert_policy ON public.contracts;
CREATE POLICY contracts_insert_policy ON public.contracts
FOR INSERT
WITH CHECK (
  get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type, 'employee'::user_role_type, 'juridica'::user_role_type])
);

-- 4. Política para tabla contracts: UPDATE
DROP POLICY IF EXISTS contracts_update_policy ON public.contracts;
CREATE POLICY contracts_update_policy ON public.contracts
FOR UPDATE
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type, 'juridica'::user_role_type]))
  OR (created_by IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()))
);

-- 5. Política para tabla contract (importada): SELECT para juridica/admin/super_admin
DROP POLICY IF EXISTS contract_select_juridica ON public.contract;
CREATE POLICY contract_select_juridica ON public.contract
FOR SELECT
USING (
  get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type, 'juridica'::user_role_type])
);

-- 6. contract_state_history: SELECT
DROP POLICY IF EXISTS contract_state_history_select_policy ON public.contract_state_history;
CREATE POLICY contract_state_history_select_policy ON public.contract_state_history
FOR SELECT
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type, 'juridica'::user_role_type]))
  OR ((get_user_role(auth.uid()) = 'supervisor'::user_role_type) AND (contract_id IN (SELECT c.id FROM contracts c JOIN profiles p ON c.created_by = p.id WHERE p.proceso_id = get_current_user_proceso_id())))
  OR (contract_id IN (SELECT c.id FROM contracts c JOIN profiles p ON c.created_by = p.id WHERE p.user_id = auth.uid()))
);

-- 7. contract_state_history: INSERT
DROP POLICY IF EXISTS contract_state_history_insert_policy ON public.contract_state_history;
CREATE POLICY contract_state_history_insert_policy ON public.contract_state_history
FOR INSERT
WITH CHECK (
  get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type, 'supervisor'::user_role_type, 'juridica'::user_role_type])
);

-- 8. billing_accounts: SELECT (agregar juridica como lector)
DROP POLICY IF EXISTS billing_accounts_select_policy ON public.billing_accounts;
CREATE POLICY billing_accounts_select_policy ON public.billing_accounts
FOR SELECT
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type, 'juridica'::user_role_type]))
  OR ((get_user_role(auth.uid()) = 'supervisor'::user_role_type) AND (status <> 'borrador'::text) AND (created_by IN (SELECT profiles.id FROM profiles WHERE profiles.proceso_id = get_current_user_proceso_id())))
  OR ((get_user_role(auth.uid()) = 'treasury'::user_role_type) AND (status <> 'borrador'::text))
  OR (created_by IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()))
);

-- 9. documents: SELECT
DROP POLICY IF EXISTS documents_select_policy ON public.documents;
CREATE POLICY documents_select_policy ON public.documents
FOR SELECT
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type, 'juridica'::user_role_type]))
  OR (uploaded_by IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()))
);

-- 10. profiles: SELECT (juridica ve todos los perfiles para detalles de contrato)
DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
CREATE POLICY profiles_select_policy ON public.profiles
FOR SELECT
USING (
  (user_id = auth.uid())
  OR (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type, 'juridica'::user_role_type]))
  OR ((get_user_role(auth.uid()) = 'supervisor'::user_role_type) AND ((proceso_id = get_current_user_proceso_id()) OR (role_id IN (SELECT roles.id FROM roles WHERE roles.name = 'supervisor'::user_role_type))))
  OR ((get_user_role(auth.uid()) = 'employee'::user_role_type) AND (role_id IN (SELECT roles.id FROM roles WHERE roles.name = 'supervisor'::user_role_type)))
);
