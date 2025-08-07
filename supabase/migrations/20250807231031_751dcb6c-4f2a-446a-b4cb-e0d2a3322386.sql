-- Arreglar la ambigüedad en la función generate_contract_number
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  year_month TEXT;
  sequence_num INTEGER;
  contract_number TEXT;
BEGIN
  -- Get current year and month
  year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
  
  -- Get next sequence number for this month
  -- Especificar explícitamente la tabla para evitar ambigüedad
  SELECT COALESCE(MAX(CAST(RIGHT(contracts.contract_number, 3) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.contracts
  WHERE contracts.contract_number LIKE 'CON-' || year_month || '-%';
  
  -- Format contract number
  contract_number := 'CON-' || year_month || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN contract_number;
END;
$function$;