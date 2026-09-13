-- ========================================
-- Phase 4: Payments & Deliveries
-- ========================================

-- payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  type varchar(20) NOT NULL CHECK (type IN ('cash','transfer','cheque','credit_card')),
  amount_satang bigint NOT NULL,
  ref_no varchar(100),
  status varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','voided')),
  slip_storage_path text,
  note text,
  recorded_by uuid REFERENCES public.users(id),
  confirmed_by uuid REFERENCES public.users(id),
  confirmed_at timestamptz,
  voided_by uuid REFERENCES public.users(id),
  voided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status) WHERE deleted_at IS NULL;

-- deliveries
CREATE TABLE IF NOT EXISTS public.deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  team_id uuid REFERENCES public.teams(id),
  scheduled_date date,
  status varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','dispatched','in_transit','delivered','returned')),
  driver_note text,
  delivered_at timestamptz,
  customer_signature_path text,
  created_by uuid REFERENCES public.users(id),
  updated_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON public.deliveries(order_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deliveries_scheduled_date ON public.deliveries(scheduled_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status) WHERE deleted_at IS NULL;

-- delivery_items
CREATE TABLE IF NOT EXISTS public.delivery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  description varchar(500) NOT NULL,
  qty_ordered integer NOT NULL DEFAULT 0,
  qty_delivered integer NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_delivery_items_delivery_id ON public.delivery_items(delivery_id);

-- updated_at triggers
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['payments','deliveries']
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
  END LOOP;
END;
$$;
