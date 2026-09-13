-- ========================================
-- Phase 3: E-ordering Tables
-- ========================================

-- Enable pg_cron extension (for auto-expiry)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ----------------------------------------
-- Sequences for document numbering
-- ----------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.quotation_number_seq START 1 INCREMENT 1 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1 INCREMENT 1 NO CYCLE;

-- Function: next_quotation_number()
-- Returns QT-YYYYMM-NNNN using current month and global sequence
CREATE OR REPLACE FUNCTION public.next_quotation_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  seq_val bigint;
  month_prefix text;
BEGIN
  seq_val := nextval('public.quotation_number_seq');
  month_prefix := to_char(now() AT TIME ZONE 'Asia/Bangkok', 'YYYYMM');
  RETURN 'QT-' || month_prefix || '-' || lpad(seq_val::text, 4, '0');
END;
$$;

-- Function: next_order_number()
CREATE OR REPLACE FUNCTION public.next_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  seq_val bigint;
  month_prefix text;
BEGIN
  seq_val := nextval('public.order_number_seq');
  month_prefix := to_char(now() AT TIME ZONE 'Asia/Bangkok', 'YYYYMM');
  RETURN 'SO-' || month_prefix || '-' || lpad(seq_val::text, 4, '0');
END;
$$;

-- ----------------------------------------
-- quotations
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number varchar(30) UNIQUE,
  customer_id uuid REFERENCES public.customers(id),
  job_id uuid REFERENCES public.jobs(id),
  lead_id uuid REFERENCES public.leads(id),
  status varchar(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','viewed','accepted','rejected','expired','converted')),
  valid_until timestamptz,
  -- Financial (satang)
  subtotal_satang bigint NOT NULL DEFAULT 0,
  bill_discount_satang bigint NOT NULL DEFAULT 0,
  vat_rate integer NOT NULL DEFAULT 7,
  vat_mode varchar(12) NOT NULL DEFAULT 'exclusive' CHECK (vat_mode IN ('exclusive','inclusive')),
  vat_amount_satang bigint NOT NULL DEFAULT 0,
  total_satang bigint NOT NULL DEFAULT 0,
  -- Content
  terms text,
  note text,
  -- Versioning
  version integer NOT NULL DEFAULT 1,
  supersedes_id uuid REFERENCES public.quotations(id),
  public_token uuid NOT NULL DEFAULT gen_random_uuid(),
  -- Actors
  created_by uuid REFERENCES public.users(id),
  updated_by uuid REFERENCES public.users(id),
  -- Timestamps
  sent_at timestamptz,
  viewed_at timestamptz,
  decided_at timestamptz,
  reject_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_quotations_public_token ON public.quotations(public_token) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON public.quotations(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quotations_valid_until ON public.quotations(valid_until) WHERE status IN ('draft','sent','viewed') AND deleted_at IS NULL;

-- ----------------------------------------
-- quotation_items
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  description varchar(500) NOT NULL,
  qty integer NOT NULL DEFAULT 1,
  unit varchar(30) DEFAULT 'ชิ้น',
  unit_price_satang bigint NOT NULL DEFAULT 0,
  discount_satang bigint NOT NULL DEFAULT 0,
  amount_satang bigint NOT NULL DEFAULT 0,
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON public.quotation_items(quotation_id) WHERE deleted_at IS NULL;

-- ----------------------------------------
-- quotation_events
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.quotation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id),
  kind varchar(20) NOT NULL CHECK (kind IN ('sent','viewed','accepted','rejected')),
  ip varchar(45),
  user_agent text,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotation_events_quotation_id ON public.quotation_events(quotation_id);

-- ----------------------------------------
-- orders
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number varchar(30) UNIQUE,
  quotation_id uuid REFERENCES public.quotations(id),
  customer_id uuid REFERENCES public.customers(id),
  status varchar(20) NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','credit_hold','awaiting_payment','paid','ready','delivering','delivered','closed','cancelled')),
  total_satang bigint NOT NULL DEFAULT 0,
  credit_check_result varchar(20) CHECK (credit_check_result IN ('pass','soft_warn','hard_block')),
  credit_used_pct integer,
  note text,
  created_by uuid REFERENCES public.users(id),
  updated_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id) WHERE deleted_at IS NULL;

-- ----------------------------------------
-- portal_otp_codes
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.portal_otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id),
  phone varchar(20) NOT NULL,
  code varchar(6) NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_otp_quotation ON public.portal_otp_codes(quotation_id, used_at);

-- updated_at triggers
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['quotations','quotation_items','orders']
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
  END LOOP;
END;
$$;

-- Auto-expire quotations: every night at 01:00 Bangkok time
-- Requires pg_cron to be enabled (Supabase supports this)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'expire-quotations',
      '0 18 * * *',  -- 01:00 Bangkok = 18:00 UTC
      $$UPDATE public.quotations SET status = 'expired', updated_at = now()
        WHERE status IN ('draft','sent','viewed')
          AND valid_until IS NOT NULL
          AND valid_until < now()
          AND deleted_at IS NULL$$
    );
  END IF;
END;
$$;
