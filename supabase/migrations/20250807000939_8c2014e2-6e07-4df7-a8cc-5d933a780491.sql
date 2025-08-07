-- Update contract amounts to realistic values
UPDATE public.contracts 
SET total_amount = 46570000
WHERE contract_number = 'CON-202508-003';

UPDATE public.contracts 
SET total_amount = 32850000
WHERE contract_number = 'CON-202508-002';

UPDATE public.contracts 
SET total_amount = 15200000
WHERE contract_number = 'CON-202508-001';