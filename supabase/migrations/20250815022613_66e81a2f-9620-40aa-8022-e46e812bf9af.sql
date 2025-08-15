-- Fix RLS policies for contract_states and billing_account_states tables
ALTER TABLE public.contract_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_account_states ENABLE ROW LEVEL SECURITY;

-- Add policies for contract_states
CREATE POLICY "contract_states_select_policy" 
ON public.contract_states 
FOR SELECT 
USING (true);

-- Add policies for billing_account_states  
CREATE POLICY "billing_account_states_select_policy" 
ON public.billing_account_states 
FOR SELECT 
USING (true);