-- Check constraints on billing_accounts table
SELECT tc.constraint_name, tc.constraint_type, cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'billing_accounts' AND tc.table_schema = 'public';

-- Check the status column definition
SELECT column_name, data_type, udt_name, column_default
FROM information_schema.columns 
WHERE table_name = 'billing_accounts' AND table_schema = 'public' AND column_name = 'status';

-- Drop the existing status check constraint if it exists and create a new one that includes 'causada'
ALTER TABLE public.billing_accounts 
DROP CONSTRAINT IF EXISTS billing_accounts_status_check;

-- Add the correct constraint that includes 'causada'
ALTER TABLE public.billing_accounts 
ADD CONSTRAINT billing_accounts_status_check 
CHECK (status IN ('borrador', 'pendiente_revision', 'aprobada', 'rechazada', 'causada'));