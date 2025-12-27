-- Add document_issue_city column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document_issue_city TEXT;