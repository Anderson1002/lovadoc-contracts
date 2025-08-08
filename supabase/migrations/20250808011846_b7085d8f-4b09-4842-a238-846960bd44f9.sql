-- Reorder: drop constraint -> migrate statuses -> add columns -> default -> add constraint -> rest
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'billing_accounts_status_check'
  ) THEN
    ALTER TABLE public.billing_accounts DROP CONSTRAINT billing_accounts_status_check;
  END IF;
END $$;

-- Migrate all possible legacy statuses to Spanish before adding constraint
UPDATE public.billing_accounts SET status = 'borrador' WHERE status IN ('draft');
UPDATE public.billing_accounts SET status = 'pendiente_revision' WHERE status IN ('pending_review');
UPDATE public.billing_accounts SET status = 'aprobada' WHERE status IN ('approved','aprobado','aprobada');
UPDATE public.billing_accounts SET status = 'rechazada' WHERE status IN ('rejected','returned','rechazado','rechazada');
UPDATE public.billing_accounts SET status = 'pagada' WHERE status IN ('paid','pagado','pagada');
-- Map any other legacy statuses to closest Spanish equivalents if present
UPDATE public.billing_accounts SET status = 'rechazada' WHERE status IN ('cancelled','canceled');
UPDATE public.billing_accounts SET status = 'aprobada' WHERE status IN ('active','approved');

-- Add columns if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'billing_accounts' AND column_name = 'enviado_el'
  ) THEN
    ALTER TABLE public.billing_accounts ADD COLUMN enviado_el timestamptz NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'billing_accounts' AND column_name = 'comentario_supervisor'
  ) THEN
    ALTER TABLE public.billing_accounts ADD COLUMN comentario_supervisor text NULL;
  END IF;
END $$;

-- Set default status
ALTER TABLE public.billing_accounts ALTER COLUMN status SET DEFAULT 'borrador';

-- Add the new CHECK constraint now that data is clean
ALTER TABLE public.billing_accounts
  ADD CONSTRAINT billing_accounts_status_check
  CHECK (status IN ('borrador','pendiente_revision','aprobada','rechazada','pagada'));

-- Index for status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'i' AND c.relname = 'idx_cuentas_estado') THEN
    CREATE INDEX idx_cuentas_estado ON public.billing_accounts (status);
  END IF;
END $$;

-- Reviews table additions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'billing_reviews' AND column_name = 'decision'
  ) THEN
    ALTER TABLE public.billing_reviews ADD COLUMN decision text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'billing_reviews' AND column_name = 'comentario'
  ) THEN
    ALTER TABLE public.billing_reviews ADD COLUMN comentario text;
  END IF;
END $$;

-- Create historial_estado_cuenta if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='historial_estado_cuenta'
  ) THEN
    CREATE TABLE public.historial_estado_cuenta (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      cuenta_id uuid NOT NULL REFERENCES public.billing_accounts(id) ON DELETE CASCADE,
      estado_anterior text,
      estado_nuevo text NOT NULL,
      usuario_id uuid NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE public.historial_estado_cuenta ENABLE ROW LEVEL SECURITY;
    CREATE POLICY historial_estado_cuenta_select_policy
    ON public.historial_estado_cuenta
    FOR SELECT
    USING (
      (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type,'admin'::user_role_type,'supervisor'::user_role_type]))
      OR (cuenta_id IN (
        SELECT ba.id FROM public.billing_accounts ba
        JOIN public.profiles p ON p.id = ba.created_by
        WHERE p.user_id = auth.uid()
      ))
    );
  END IF;
END $$;

-- Triggers as before
CREATE OR REPLACE FUNCTION public.validate_cuenta_transition()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status = 'borrador' AND NEW.status = 'pendiente_revision' THEN
      IF NEW.enviado_el IS NULL THEN
        NEW.enviado_el := now();
      END IF;
    ELSIF OLD.status = 'pendiente_revision' AND NEW.status IN ('aprobada','rechazada') THEN
      -- ok
    ELSIF OLD.status = 'rechazada' AND NEW.status = 'pendiente_revision' THEN
      -- ok
    ELSE
      RAISE EXCEPTION 'Transición de estado no válida: % -> %', OLD.status, NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.enforce_cuenta_update_columns()
RETURNS trigger AS $$
DECLARE
  v_role user_role_type;
BEGIN
  SELECT public.get_user_role(auth.uid()) INTO v_role;

  IF v_role = 'employee' THEN
    IF (NEW.contract_id IS DISTINCT FROM OLD.contract_id)
       OR (NEW.account_number IS DISTINCT FROM OLD.account_number)
       OR (NEW.created_by IS DISTINCT FROM OLD.created_by)
       OR (NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by)
       OR (NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at)
       OR (NEW.comentario_supervisor IS DISTINCT FROM OLD.comentario_supervisor)
    THEN
      RAISE EXCEPTION 'El empleado no puede modificar contrato, numeración o campos administrativos';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NOT (OLD.status IN ('borrador','rechazada') AND NEW.status = 'pendiente_revision') THEN
        RAISE EXCEPTION 'El empleado solo puede enviar a pendiente_revision';
      END IF;
    END IF;
  ELSIF v_role = 'supervisor' THEN
    IF (NEW.amount IS DISTINCT FROM OLD.amount)
       OR (NEW.billing_month IS DISTINCT FROM OLD.billing_month)
       OR (NEW.billing_start_date IS DISTINCT FROM OLD.billing_start_date)
       OR (NEW.billing_end_date IS DISTINCT FROM OLD.billing_end_date)
       OR (NEW.contract_id IS DISTINCT FROM OLD.contract_id)
       OR (NEW.created_by IS DISTINCT FROM OLD.created_by)
       OR (NEW.account_number IS DISTINCT FROM OLD.account_number)
       OR (NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by)
       OR (NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at)
    THEN
      RAISE EXCEPTION 'El supervisor solo puede modificar estado y comentario_supervisor';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NOT (OLD.status = 'pendiente_revision' AND NEW.status IN ('aprobada','rechazada')) THEN
        RAISE EXCEPTION 'El supervisor solo puede aprobar o rechazar cuentas en pendiente_revision';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.log_cuenta_status_history()
RETURNS trigger AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.historial_estado_cuenta (cuenta_id, estado_anterior, estado_nuevo, usuario_id)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_cuenta_transition ON public.billing_accounts;
CREATE TRIGGER trg_validate_cuenta_transition
BEFORE UPDATE ON public.billing_accounts
FOR EACH ROW EXECUTE FUNCTION public.validate_cuenta_transition();

DROP TRIGGER IF EXISTS trg_enforce_cuenta_update_columns ON public.billing_accounts;
CREATE TRIGGER trg_enforce_cuenta_update_columns
BEFORE UPDATE ON public.billing_accounts
FOR EACH ROW EXECUTE FUNCTION public.enforce_cuenta_update_columns();

DROP TRIGGER IF EXISTS trg_log_cuenta_status_history ON public.billing_accounts;
CREATE TRIGGER trg_log_cuenta_status_history
AFTER UPDATE OF status ON public.billing_accounts
FOR EACH ROW EXECUTE FUNCTION public.log_cuenta_status_history();

-- RLS policies
DROP POLICY IF EXISTS billing_accounts_select_policy ON public.billing_accounts;
CREATE POLICY billing_accounts_select_policy
ON public.billing_accounts
FOR SELECT
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type,'admin'::user_role_type]))
  OR (get_user_role(auth.uid()) = 'supervisor'::user_role_type AND status <> 'borrador')
  OR (created_by IN (SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid()))
);

DROP POLICY IF EXISTS billing_accounts_update_policy ON public.billing_accounts;
CREATE POLICY billing_accounts_update_policy
ON public.billing_accounts
FOR UPDATE
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type,'admin'::user_role_type]))
  OR (get_user_role(auth.uid()) = 'supervisor'::user_role_type AND status IN ('pendiente_revision','aprobada','rechazada'))
  OR (created_by IN (SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid()) AND status IN ('borrador','rechazada','pendiente_revision'))
)
WITH CHECK (
  (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::user_role_type,'admin'::user_role_type]))
  OR (get_user_role(auth.uid()) = 'supervisor'::user_role_type AND status IN ('pendiente_revision','aprobada','rechazada'))
  OR (created_by IN (SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid()) AND status IN ('borrador','rechazada','pendiente_revision'))
);
