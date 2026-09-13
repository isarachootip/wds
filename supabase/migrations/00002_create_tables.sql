-- 1. users (mirrors auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name varchar(255),
  avatar_url text,
  org_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

-- 2. roles
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(50) NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

-- Insert 8 default roles
INSERT INTO public.roles (name, description) VALUES
  ('admin', 'ผู้ดูแลระบบ — สิทธิ์เต็ม'),
  ('sales', 'พนักงานขาย — สร้างและติดตาม Lead/Site Visit'),
  ('sales_manager', 'ผู้จัดการฝ่ายขาย — อนุมัติ Site Visit และ QT'),
  ('coordinator', 'ผู้ประสานงาน — จัดการนัดหมายและมอบหมายงาน'),
  ('technician', 'ช่างเทคนิค — รับ Appointment และบันทึกงาน'),
  ('accounting', 'บัญชี — ดูแลการชำระเงินและเครดิต'),
  ('warehouse', 'คลังสินค้า — จัดการ Delivery'),
  ('customer', 'ลูกค้า — ดู QT และยืนยันการสั่งซื้อ')
ON CONFLICT (name) DO NOTHING;

-- 3. user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  UNIQUE (user_id, role_id)
);

-- 4. customers
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(20) NOT NULL UNIQUE,
  name varchar(255) NOT NULL,
  tax_id varchar(13),
  phone varchar(20),
  email varchar(255),
  credit_limit_satang bigint NOT NULL DEFAULT 0,
  credit_used_satang bigint NOT NULL DEFAULT 0,
  customer_group varchar(50) NOT NULL DEFAULT 'standard',
  status varchar(50) NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

-- 5. addresses
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  label varchar(100),
  address_line1 text NOT NULL,
  address_line2 text,
  sub_district varchar(100),
  district varchar(100),
  province varchar(100),
  postal_code varchar(10),
  lat double precision,
  lng double precision,
  is_site boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

-- 6. products
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku varchar(50) NOT NULL UNIQUE,
  name varchar(255) NOT NULL,
  name_en varchar(255),
  description text,
  unit varchar(50) NOT NULL,
  base_price_satang bigint NOT NULL,
  category varchar(100),
  brand varchar(100),
  status varchar(50) NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

-- 7. price_lists
CREATE TABLE IF NOT EXISTS public.price_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_group varchar(50) NOT NULL,
  price_satang bigint NOT NULL,
  min_qty integer NOT NULL DEFAULT 1,
  effective_from date NOT NULL,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

-- 8. audit_log (no updated_at/deleted_at — immutable)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  entity varchar(100) NOT NULL,
  entity_id uuid NOT NULL,
  action varchar(50) NOT NULL,
  from_status varchar(50),
  to_status varchar(50),
  payload jsonb,
  at timestamptz NOT NULL DEFAULT now()
);

-- 9. domain_events (outbox)
CREATE TABLE IF NOT EXISTS public.domain_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  aggregate varchar(100) NOT NULL,
  aggregate_id uuid NOT NULL,
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  status varchar(20) NOT NULL DEFAULT 'pending',
  CONSTRAINT domain_events_status_check CHECK (status IN ('pending', 'processing', 'processed', 'failed'))
);

-- Create index for event worker
CREATE INDEX IF NOT EXISTS idx_domain_events_status_attempts 
  ON public.domain_events (status, attempts) 
  WHERE status IN ('pending', 'failed') AND attempts < 3;

-- 10. notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind varchar(50) NOT NULL,
  title varchar(255) NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  deleted_at timestamptz
);

-- Trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','roles','user_roles','customers','addresses','products','price_lists']
  LOOP
    EXECUTE format('
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
  END LOOP;
END;
$$;
