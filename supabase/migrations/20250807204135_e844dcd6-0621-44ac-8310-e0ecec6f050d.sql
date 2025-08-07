-- Create table for billing activities
CREATE TABLE IF NOT EXISTS public.billing_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  billing_account_id UUID NOT NULL,
  activity_name TEXT NOT NULL,
  actions_developed TEXT NOT NULL,
  activity_order INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on billing_activities
ALTER TABLE public.billing_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for billing_activities
CREATE POLICY "billing_activities_insert_policy" 
ON public.billing_activities 
FOR INSERT 
WITH CHECK (
  get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type, 'employee'::user_role_type])
);

CREATE POLICY "billing_activities_select_policy" 
ON public.billing_activities 
FOR SELECT 
USING (
  get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type])
  OR 
  billing_account_id IN (
    SELECT id FROM billing_accounts WHERE created_by IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "billing_activities_update_policy" 
ON public.billing_activities 
FOR UPDATE 
USING (
  get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type])
  OR 
  (
    billing_account_id IN (
      SELECT id FROM billing_accounts WHERE created_by IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    ) 
    AND status = 'draft'
  )
);

-- Create table for activity evidence files
CREATE TABLE IF NOT EXISTS public.billing_activity_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  billing_activity_id UUID NOT NULL REFERENCES public.billing_activities(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on billing_activity_evidence
ALTER TABLE public.billing_activity_evidence ENABLE ROW LEVEL SECURITY;

-- Create policies for billing_activity_evidence
CREATE POLICY "billing_activity_evidence_insert_policy" 
ON public.billing_activity_evidence 
FOR INSERT 
WITH CHECK (
  get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type, 'employee'::user_role_type])
);

CREATE POLICY "billing_activity_evidence_select_policy" 
ON public.billing_activity_evidence 
FOR SELECT 
USING (
  get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type])
  OR 
  uploaded_by IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Update billing_accounts to support new statuses
ALTER TABLE public.billing_accounts 
DROP CONSTRAINT IF EXISTS billing_accounts_status_check;

ALTER TABLE public.billing_accounts 
ADD CONSTRAINT billing_accounts_status_check 
CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'paid'));

-- Add additional fields for period tracking
ALTER TABLE public.billing_accounts 
ADD COLUMN IF NOT EXISTS billing_start_date DATE,
ADD COLUMN IF NOT EXISTS billing_end_date DATE;

-- Add trigger for updating timestamps
CREATE TRIGGER update_billing_activities_updated_at
BEFORE UPDATE ON public.billing_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_billing_activities_billing_account_id ON public.billing_activities(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_billing_activity_evidence_activity_id ON public.billing_activity_evidence(billing_activity_id);
CREATE INDEX IF NOT EXISTS idx_billing_accounts_status ON public.billing_accounts(status);
CREATE INDEX IF NOT EXISTS idx_billing_accounts_created_by ON public.billing_accounts(created_by);