-- ===================================================================
-- Phase 4 Full: Extend Payments, Deliveries + New tables
-- ===================================================================

-- customer_credit
CREATE TABLE IF NOT EXISTS public.customer_credit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  credit_limit_satang bigint NOT NULL DEFAULT 0,
  terms_days integer NOT NULL DEFAULT 0,
  on_hold boolean NOT NULL DEFAULT false,
  on_hold_reason text,
  note text,
  created_by uuid REFERENCES public.users(id),
  updated_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_credit_customer ON public.customer_credit(customer_id) WHERE deleted_at IS NULL;

-- credit_checks
CREATE TABLE IF NOT EXISTS public.credit_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  credit_limit_satang bigint NOT NULL DEFAULT 0,
  outstanding_satang bigint NOT NULL DEFAULT 0,
  overdue_amount_satang bigint NOT NULL DEFAULT 0,
  available_satang bigint NOT NULL DEFAULT 0,
  order_total_satang bigint NOT NULL DEFAULT 0,
  decision varchar(10) NOT NULL CHECK (decision IN ('pass','hold','reject')),
  reason text NOT NULL,
  decided_by uuid REFERENCES public.users(id),
  auto boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credit_checks_order_id ON public.credit_checks(order_id);
CREATE INDEX IF NOT EXISTS idx_credit_checks_customer_id ON public.credit_checks(customer_id);

-- invoices — sequence for numbering
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq;

CREATE OR REPLACE FUNCTION public.next_invoice_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  seq_val bigint;
  result text;
BEGIN
  seq_val := nextval('public.invoice_number_seq');
  result := 'INV-' || to_char(now(), 'YYYYMM') || '-' || lpad(seq_val::text, 4, '0');
  RETURN result;
END;
$$;

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  number varchar(30) UNIQUE,
  issue_date date NOT NULL,
  due_date date NOT NULL,
  amount_satang bigint NOT NULL,
  paid_satang bigint NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','partial','paid','overdue','void')),
  created_by uuid REFERENCES public.users(id),
  updated_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date) WHERE deleted_at IS NULL;

-- pg_cron: mark overdue invoices daily
SELECT cron.schedule('mark-overdue-invoices', '30 18 * * *',
  $cron$UPDATE public.invoices SET status = 'overdue'
   WHERE status IN ('open','partial') AND due_date < CURRENT_DATE
     AND deleted_at IS NULL$cron$
) ON CONFLICT DO NOTHING;

-- Extend payments table: drop old columns where needed, add new ones
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS method varchar(20),
  ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES public.invoices(id),
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS reject_reason text;

-- Backfill method from type if type column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='payments' AND column_name='type') THEN
    UPDATE public.payments SET method = type WHERE method IS NULL;
  END IF;
END;
$$;

-- Extend deliveries table
ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS vehicle varchar(100),
  ADD COLUMN IF NOT EXISTS tracking_no varchar(100),
  ADD COLUMN IF NOT EXISTS attempt integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pod_path text,
  ADD COLUMN IF NOT EXISTS receiver_name varchar(200),
  ADD COLUMN IF NOT EXISTS fail_reason text;

-- Update trigger
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['customer_credit','invoices']
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
  END LOOP;
END;
$$;
