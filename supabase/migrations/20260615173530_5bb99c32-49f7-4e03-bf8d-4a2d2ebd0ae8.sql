
-- 1. Reescribir generate_billing_number para recibir created_by
CREATE OR REPLACE FUNCTION public.generate_billing_number(_created_by uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  year_month TEXT;
  doc TEXT;
  seq INTEGER;
  candidate TEXT;
BEGIN
  year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');

  SELECT NULLIF(TRIM(document_number), '') INTO doc
  FROM public.profiles
  WHERE id = _created_by;

  IF doc IS NULL THEN
    RAISE EXCEPTION 'No se puede generar el número de cuenta: el contratista no tiene número de documento en su perfil. Complete su documento en /profile';
  END IF;

  LOOP
    SELECT COALESCE(MAX(
      CAST(SPLIT_PART(SPLIT_PART(account_number, '-', 3), '-', 1) AS INTEGER)
    ), 0) + 1
    INTO seq
    FROM public.billing_accounts
    WHERE created_by = _created_by
      AND account_number LIKE 'COB-' || year_month || '-%-' || doc;

    candidate := 'COB-' || year_month || '-' || LPAD(seq::TEXT, 3, '0') || '-' || doc;

    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.billing_accounts WHERE account_number = candidate
    );
  END LOOP;

  RETURN candidate;
END;
$function$;

-- 2. Mantener la versión sin argumentos por compatibilidad (deprecated, llama a la nueva con auth.uid)
CREATE OR REPLACE FUNCTION public.generate_billing_number()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_profile_id uuid;
BEGIN
  SELECT id INTO v_profile_id FROM public.profiles WHERE user_id = auth.uid();
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'No se pudo identificar el perfil del usuario actual';
  END IF;
  RETURN public.generate_billing_number(v_profile_id);
END;
$function$;

-- 3. Trigger usa el created_by del registro
CREATE OR REPLACE FUNCTION public.set_billing_account_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.account_number IS NULL OR NEW.account_number = '' THEN
    NEW.account_number := public.generate_billing_number(NEW.created_by);
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. Backfill de las 4 cuentas existentes al nuevo formato
UPDATE public.billing_accounts ba
SET account_number = ba.account_number || '-' || p.document_number
FROM public.profiles p
WHERE ba.created_by = p.id
  AND ba.account_number ~ '^COB-[0-9]{6}-[0-9]{3}$'
  AND NULLIF(TRIM(p.document_number), '') IS NOT NULL;
