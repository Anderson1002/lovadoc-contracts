-- Crear tabla para cuentas de cobro
CREATE TABLE public.billing_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  billing_month DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'paid')),
  rejection_reason TEXT,
  created_by UUID NOT NULL,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraint to ensure only one billing account per contract per month
  UNIQUE(contract_id, billing_month)
);

-- Crear tabla para documentos de cuentas de cobro
CREATE TABLE public.billing_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  billing_account_id UUID NOT NULL REFERENCES public.billing_accounts(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('billing_invoice', 'activity_report', 'social_security')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para historial de revisiones
CREATE TABLE public.billing_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  billing_account_id UUID NOT NULL REFERENCES public.billing_accounts(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'returned')),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.billing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies para billing_accounts
CREATE POLICY "billing_accounts_select_policy" 
ON public.billing_accounts 
FOR SELECT 
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type])) 
  OR 
  (created_by IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()))
);

CREATE POLICY "billing_accounts_insert_policy" 
ON public.billing_accounts 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type, 'employee'::user_role_type]));

CREATE POLICY "billing_accounts_update_policy" 
ON public.billing_accounts 
FOR UPDATE 
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type])) 
  OR 
  (created_by IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()) AND status = 'pending_review')
);

-- RLS Policies para billing_documents
CREATE POLICY "billing_documents_select_policy" 
ON public.billing_documents 
FOR SELECT 
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type])) 
  OR 
  (uploaded_by IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()))
);

CREATE POLICY "billing_documents_insert_policy" 
ON public.billing_documents 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type, 'employee'::user_role_type]));

-- RLS Policies para billing_reviews
CREATE POLICY "billing_reviews_select_policy" 
ON public.billing_reviews 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type]));

CREATE POLICY "billing_reviews_insert_policy" 
ON public.billing_reviews 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type]));

-- Create function for auto-generating billing account numbers
CREATE OR REPLACE FUNCTION generate_billing_account_number()
RETURNS TEXT AS $$
DECLARE
  year_month TEXT;
  sequence_num INTEGER;
  account_number TEXT;
BEGIN
  -- Get current year and month
  year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
  
  -- Get next sequence number for this month
  SELECT COALESCE(MAX(CAST(RIGHT(account_number, 3) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.billing_accounts
  WHERE account_number LIKE 'CTA-' || year_month || '-%';
  
  -- Format account number
  account_number := 'CTA-' || year_month || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN account_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate account numbers
CREATE OR REPLACE FUNCTION set_billing_account_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.account_number IS NULL OR NEW.account_number = '' THEN
    NEW.account_number := generate_billing_account_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_billing_account_number_trigger
  BEFORE INSERT ON public.billing_accounts
  FOR EACH ROW
  EXECUTE FUNCTION set_billing_account_number();

-- Add timestamp triggers
CREATE TRIGGER update_billing_accounts_updated_at
  BEFORE UPDATE ON public.billing_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for billing documents
INSERT INTO storage.buckets (id, name, public) VALUES ('billing-documents', 'billing-documents', false);

-- Create storage policies for billing documents
CREATE POLICY "billing_documents_select_policy" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'billing-documents' AND (
  get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type])
  OR 
  auth.uid()::text = (storage.foldername(name))[1]
));

CREATE POLICY "billing_documents_insert_policy" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'billing-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "billing_documents_update_policy" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'billing-documents' AND auth.uid()::text = (storage.foldername(name))[1]);