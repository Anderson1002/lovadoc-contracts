-- Crear bucket para documentos de contratos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contract-documents', 'contract-documents', false);

-- Políticas para el bucket contract-documents
CREATE POLICY "Los usuarios pueden ver sus documentos de contratos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'contract-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Los usuarios pueden subir documentos de contratos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'contract-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Los usuarios pueden actualizar sus documentos de contratos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'contract-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Los usuarios pueden eliminar sus documentos de contratos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'contract-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);