-- Fix RLS policies for billing_accounts to prevent security violations
-- Allow employees to insert records with proper created_by assignment

-- Drop and recreate the insert policy with proper checks
DROP POLICY IF EXISTS "billing_accounts_insert_policy" ON public.billing_accounts;

CREATE POLICY "billing_accounts_insert_policy" 
ON public.billing_accounts 
FOR INSERT 
WITH CHECK (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type, 'employee'::user_role_type]))
  AND 
  (created_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);