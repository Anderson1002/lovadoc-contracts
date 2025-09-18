-- Create procesos table
CREATE TABLE public.procesos (
  id SERIAL PRIMARY KEY,
  nombre_proceso TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.procesos ENABLE ROW LEVEL SECURITY;

-- RLS policies for procesos
CREATE POLICY "procesos_select_policy" 
ON public.procesos 
FOR SELECT 
USING (true);

CREATE POLICY "procesos_insert_policy" 
ON public.procesos 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type]));

CREATE POLICY "procesos_update_policy" 
ON public.procesos 
FOR UPDATE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type]));

CREATE POLICY "procesos_delete_policy" 
ON public.procesos 
FOR DELETE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type, 'admin'::user_role_type]));

-- Insert initial data
INSERT INTO public.procesos (id, nombre_proceso) VALUES
(1, 'Apoyo Diagnóstico y Terapéutico'),
(2, 'Atención Inmediata'),
(3, 'Atención al Usuario (SIAU)'),
(4, 'Consulta Externa'),
(5, 'Cirugía y Salas de Partos'),
(6, 'Direccionamiento estratégico'),
(7, 'Gestión Comercial'),
(8, 'Gestión Ambiente Físico'),
(9, 'Gestión Financiera'),
(10, 'Gestión Jurídica'),
(11, 'Gestión Logística'),
(12, 'Gobierno Digital'),
(13, 'Gestión de la Información'),
(14, 'Gestión de la Tecnología'),
(15, 'Mejoramiento Continuo'),
(16, 'Internación'),
(17, 'Promoción y Prevención'),
(18, 'Referencia y Contrarreferencia'),
(19, 'Salud Pública'),
(20, 'Servicios Conexos a la Salud'),
(21, 'Transporte Asistencial'),
(22, 'Talento Humano'),
(23, 'Enfermeria'),
(24, 'Subgeriecia administatva y financiera'),
(27, 'Subgeriecia servicos de salud');

-- Update sequence to continue from the last inserted ID
SELECT setval('public.procesos_id_seq', 27, true);

-- Add trigger for updating updated_at
CREATE TRIGGER update_procesos_updated_at
BEFORE UPDATE ON public.procesos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();