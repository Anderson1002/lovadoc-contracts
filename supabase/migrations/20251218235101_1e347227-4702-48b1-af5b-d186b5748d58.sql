-- Agregar campos para desglose de Aportes de Seguridad Social

-- Aportes Salud
ALTER TABLE public.billing_accounts ADD COLUMN salud_planilla_numero TEXT;
ALTER TABLE public.billing_accounts ADD COLUMN salud_planilla_valor NUMERIC;
ALTER TABLE public.billing_accounts ADD COLUMN salud_planilla_fecha DATE;

-- Aportes Pensión
ALTER TABLE public.billing_accounts ADD COLUMN pension_planilla_numero TEXT;
ALTER TABLE public.billing_accounts ADD COLUMN pension_planilla_valor NUMERIC;
ALTER TABLE public.billing_accounts ADD COLUMN pension_planilla_fecha DATE;

-- Aportes ARL
ALTER TABLE public.billing_accounts ADD COLUMN arl_planilla_numero TEXT;
ALTER TABLE public.billing_accounts ADD COLUMN arl_planilla_valor NUMERIC;
ALTER TABLE public.billing_accounts ADD COLUMN arl_planilla_fecha DATE;