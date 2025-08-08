-- Crear tabla de estados para cuentas de cobro
CREATE TABLE public.billing_account_states (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(3) NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    display_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insertar estados para cuentas de cobro
INSERT INTO public.billing_account_states (code, name, description, display_name) VALUES
('BOR', 'borrador', 'Cuenta creada en borrador, pendiente de completar', 'Borrador'),
('PEN', 'pendiente_revision', 'Cuenta enviada para revisión del supervisor', 'Pendiente Revisión'),
('APR', 'aprobada', 'Cuenta aprobada por el supervisor', 'Aprobada'),
('REC', 'rechazada', 'Cuenta rechazada por el supervisor', 'Rechazada'),
('PAG', 'pagada', 'Cuenta ya pagada', 'Pagada');

-- Crear tabla de estados para contratos
CREATE TABLE public.contract_states (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(3) NOT NULL UNIQUE,
    name contract_state NOT NULL,
    description TEXT,
    display_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insertar estados para contratos
INSERT INTO public.contract_states (code, name, description, display_name) VALUES
('REG', 'registrado', 'Contrato registrado, pendiente de revisión', 'Registrado'),
('DEV', 'devuelto', 'Contrato devuelto por inconsistencias', 'Devuelto'),
('EJE', 'en_ejecucion', 'Contrato en ejecución activa', 'En Ejecución'),
('COM', 'completado', 'Contrato completado exitosamente', 'Completado'),
('CAN', 'cancelado', 'Contrato cancelado', 'Cancelado');

-- Agregar columna de estado codificado a billing_accounts
ALTER TABLE public.billing_accounts ADD COLUMN state_code VARCHAR(3);

-- Actualizar los registros existentes con los códigos correspondientes
UPDATE public.billing_accounts 
SET state_code = CASE 
    WHEN status = 'borrador' THEN 'BOR'
    WHEN status = 'pendiente_revision' THEN 'PEN'
    WHEN status = 'aprobada' THEN 'APR'
    WHEN status = 'rechazada' THEN 'REC'
    WHEN status = 'pagada' THEN 'PAG'
    ELSE 'BOR'
END;

-- Agregar foreign key constraint
ALTER TABLE public.billing_accounts 
ADD CONSTRAINT fk_billing_accounts_state 
FOREIGN KEY (state_code) REFERENCES public.billing_account_states(code);

-- Agregar columna de estado codificado a contracts
ALTER TABLE public.contracts ADD COLUMN state_code VARCHAR(3);

-- Actualizar los registros existentes con los códigos correspondientes para contracts
UPDATE public.contracts 
SET state_code = CASE 
    WHEN estado = 'registrado' THEN 'REG'
    WHEN estado = 'devuelto' THEN 'DEV'
    WHEN estado = 'en_ejecucion' THEN 'EJE'
    WHEN estado = 'completado' THEN 'COM'
    WHEN estado = 'cancelado' THEN 'CAN'
    WHEN status = 'cancelled' THEN 'CAN'
    ELSE 'REG'
END;

-- Agregar foreign key constraint
ALTER TABLE public.contracts 
ADD CONSTRAINT fk_contracts_state 
FOREIGN KEY (state_code) REFERENCES public.contract_states(code);

-- Crear función para obtener estado de cuenta de cobro por código
CREATE OR REPLACE FUNCTION public.get_billing_account_state(state_code VARCHAR(3))
RETURNS TABLE(code VARCHAR(3), name TEXT, display_name TEXT, description TEXT)
LANGUAGE SQL
STABLE
AS $$
    SELECT bas.code, bas.name, bas.display_name, bas.description
    FROM public.billing_account_states bas
    WHERE bas.code = state_code;
$$;

-- Crear función para obtener estado de contrato por código
CREATE OR REPLACE FUNCTION public.get_contract_state(state_code VARCHAR(3))
RETURNS TABLE(code VARCHAR(3), name TEXT, display_name TEXT, description TEXT)
LANGUAGE SQL
STABLE
AS $$
    SELECT cs.code, cs.name::text, cs.display_name, cs.description
    FROM public.contract_states cs
    WHERE cs.code = state_code;
$$;