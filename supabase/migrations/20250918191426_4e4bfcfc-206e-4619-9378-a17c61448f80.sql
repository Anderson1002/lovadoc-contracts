-- Add proceso_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN proceso_id integer REFERENCES public.procesos(id);

-- Add index for better performance
CREATE INDEX idx_profiles_proceso_id ON public.profiles(proceso_id);