-- First, let's check what constraints exist on billing_accounts
SELECT constraint_name, constraint_type, check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'billing_accounts' AND tc.table_schema = 'public';

-- Check what values are allowed in status column
SELECT column_name, data_type, udt_name, column_default
FROM information_schema.columns 
WHERE table_name = 'billing_accounts' AND table_schema = 'public' AND column_name = 'status';