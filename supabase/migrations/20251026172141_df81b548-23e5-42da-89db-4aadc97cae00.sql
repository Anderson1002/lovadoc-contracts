-- Enable RLS on contract table (already enabled, but ensuring it)
ALTER TABLE public.contract ENABLE ROW LEVEL SECURITY;

-- Create SELECT policy to allow users to view their own contracts
-- Users can see contracts where TERCERO matches their document_number
CREATE POLICY contract_select_by_tercero
ON public.contract
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.document_number = contract."TERCERO"
  )
);