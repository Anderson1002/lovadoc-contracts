-- Agregar el campo client_document_number a la tabla contracts
ALTER TABLE public.contracts 
ADD COLUMN client_document_number TEXT;