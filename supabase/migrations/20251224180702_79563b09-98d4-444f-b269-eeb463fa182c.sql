-- Add new columns for official certification format
ALTER TABLE public.billing_accounts 
ADD COLUMN IF NOT EXISTS certification_month TEXT,
ADD COLUMN IF NOT EXISTS report_delivery_date DATE;