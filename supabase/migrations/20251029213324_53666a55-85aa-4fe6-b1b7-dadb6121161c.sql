-- 1. Agregar columna OID (auto-incremental)
ALTER TABLE public.contracts
ADD COLUMN oid SERIAL UNIQUE;

-- 2. Agregar columnas para datos pre-cargados
ALTER TABLE public.contracts
ADD COLUMN contract_number_original TEXT,
ADD COLUMN rp TEXT,
ADD COLUMN cdp TEXT,
ADD COLUMN fecha_rp DATE,
ADD COLUMN fecha_cdp DATE;

-- 3. Crear índices para optimizar búsquedas
CREATE INDEX idx_contracts_oid ON public.contracts(oid);
CREATE INDEX idx_contracts_number_original ON public.contracts(contract_number_original);
CREATE INDEX idx_contracts_rp ON public.contracts(rp);
CREATE INDEX idx_contracts_cdp ON public.contracts(cdp);

-- 4. Comentarios para documentación
COMMENT ON COLUMN public.contracts.oid IS 'Identificador secuencial legible (#1, #2, #3...)';
COMMENT ON COLUMN public.contracts.contract_number_original IS 'Número del contrato pre-cargado (ej: 1745-2025)';
COMMENT ON COLUMN public.contracts.rp IS 'Número de Registro Presupuestal';
COMMENT ON COLUMN public.contracts.cdp IS 'Certificado de Disponibilidad Presupuestal';
COMMENT ON COLUMN public.contracts.fecha_rp IS 'Fecha del Registro Presupuestal';
COMMENT ON COLUMN public.contracts.fecha_cdp IS 'Fecha del CDP';