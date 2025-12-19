-- Fase 1: Agregar campos a tabla profiles para Cuenta de Cobro
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rut_activity_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rut_activity_date DATE;

-- Fase 1: Agregar campos a tabla contracts para Certificación
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS budget_code TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS addition_number TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS addition_cdp TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS addition_rp TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS addition_amount NUMERIC DEFAULT 0;

-- Fase 1: Agregar campos a tabla billing_accounts para Cuenta de Cobro (Documento Equivalente)
ALTER TABLE public.billing_accounts ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE public.billing_accounts ADD COLUMN IF NOT EXISTS invoice_city TEXT;
ALTER TABLE public.billing_accounts ADD COLUMN IF NOT EXISTS invoice_date DATE;
ALTER TABLE public.billing_accounts ADD COLUMN IF NOT EXISTS amount_in_words TEXT;

-- Declaraciones juradas (checkboxes para Cuenta de Cobro)
ALTER TABLE public.billing_accounts ADD COLUMN IF NOT EXISTS declaration_single_employer BOOLEAN DEFAULT true;
ALTER TABLE public.billing_accounts ADD COLUMN IF NOT EXISTS declaration_80_percent_income BOOLEAN DEFAULT true;
ALTER TABLE public.billing_accounts ADD COLUMN IF NOT EXISTS benefit_prepaid_health BOOLEAN DEFAULT false;
ALTER TABLE public.billing_accounts ADD COLUMN IF NOT EXISTS benefit_voluntary_pension BOOLEAN DEFAULT false;
ALTER TABLE public.billing_accounts ADD COLUMN IF NOT EXISTS benefit_housing_interest BOOLEAN DEFAULT false;
ALTER TABLE public.billing_accounts ADD COLUMN IF NOT EXISTS benefit_health_contributions BOOLEAN DEFAULT true;
ALTER TABLE public.billing_accounts ADD COLUMN IF NOT EXISTS benefit_economic_dependents BOOLEAN DEFAULT false;

-- Campos para Certificación
ALTER TABLE public.billing_accounts ADD COLUMN IF NOT EXISTS novedades TEXT;
ALTER TABLE public.billing_accounts ADD COLUMN IF NOT EXISTS supervisor_signature_url TEXT;
ALTER TABLE public.billing_accounts ADD COLUMN IF NOT EXISTS certification_date DATE;

-- Control de completitud de los 3 formatos
ALTER TABLE public.billing_accounts ADD COLUMN IF NOT EXISTS informe_complete BOOLEAN DEFAULT false;
ALTER TABLE public.billing_accounts ADD COLUMN IF NOT EXISTS certificacion_complete BOOLEAN DEFAULT false;
ALTER TABLE public.billing_accounts ADD COLUMN IF NOT EXISTS cuenta_cobro_complete BOOLEAN DEFAULT false;