-- Agregar nuevos campos para el formato de certificación oficial
ALTER TABLE public.billing_accounts 
ADD COLUMN IF NOT EXISTS valor_ejecutado_antes NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_ejecutado NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS saldo_por_ejecutar NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS porcentaje_ejecutado NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS risk_matrix_compliance BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS social_security_verified BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS anexos_lista TEXT DEFAULT '';