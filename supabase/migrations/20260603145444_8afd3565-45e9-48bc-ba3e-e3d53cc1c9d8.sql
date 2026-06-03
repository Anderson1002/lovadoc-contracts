
DROP POLICY IF EXISTS write_contract_files_by_creator ON storage.objects;
DROP POLICY IF EXISTS update_contract_files_by_creator ON storage.objects;

CREATE POLICY write_contract_files_by_creator
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contracts'
  AND (
    left(name, 36) = (SELECT p.id::text FROM public.profiles p WHERE p.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE left(objects.name, length('contracts/' || c.id || '/')) = 'contracts/' || c.id || '/'
        AND c.created_by IN (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON r.id = p.role_id
      WHERE p.user_id = auth.uid()
        AND r.name = ANY (ARRAY['supervisor'::user_role_type, 'admin'::user_role_type, 'super_admin'::user_role_type])
    )
  )
);

CREATE POLICY update_contract_files_by_creator
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'contracts'
  AND (
    left(name, 36) = (SELECT p.id::text FROM public.profiles p WHERE p.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE left(objects.name, length('contracts/' || c.id || '/')) = 'contracts/' || c.id || '/'
        AND c.created_by IN (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON r.id = p.role_id
      WHERE p.user_id = auth.uid()
        AND r.name = ANY (ARRAY['supervisor'::user_role_type, 'admin'::user_role_type, 'super_admin'::user_role_type])
    )
  )
)
WITH CHECK (true);
