-- Add DELETE policy for billing-documents to allow replacing files (upsert requires delete)
CREATE POLICY "Users can delete their own billing documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'billing-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Add DELETE policy for billing-signatures
CREATE POLICY "Users can delete their own signatures"
ON storage.objects
FOR DELETE
USING (bucket_id = 'billing-signatures' AND (auth.uid())::text = (storage.foldername(name))[1]);