-- Eliminar política antigua de lectura de archivos de contratos
DROP POLICY IF EXISTS "read_contract_files" ON storage.objects;

-- Crear nueva política que soporte ambos formatos de archivo
CREATE POLICY "read_contract_files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'contracts' AND (
    -- Formato nuevo: {profile_id}/archivo.pdf
    -- Permite acceso si el archivo está en la carpeta del profile_id del usuario
    left(name, 36) = (
      SELECT id::text 
      FROM public.profiles 
      WHERE user_id = auth.uid()
    )
    OR
    -- Formato antiguo: contracts/{contract_id}/archivo.pdf
    -- Permite acceso si el usuario creó el contrato
    EXISTS (
      SELECT 1
      FROM public.contracts c
      JOIN public.profiles p ON p.id = c.created_by
      WHERE 
        left(name, length('contracts/' || c.id::text || '/')) = 'contracts/' || c.id::text || '/' 
        AND p.user_id = auth.uid()
    )
    OR
    -- Supervisores, admins y super_admins pueden ver todos los archivos
    EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.roles r ON r.id = p.role_id
      WHERE 
        p.user_id = auth.uid() 
        AND r.name IN ('supervisor', 'admin', 'super_admin')
    )
  )
);