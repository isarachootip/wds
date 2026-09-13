-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ===== users =====
-- Users can see their own profile; admin/manager/sales can see all
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (
    id = auth.uid()
    OR public.has_any_role(ARRAY['admin', 'sales_manager', 'sales', 'coordinator', 'accounting'])
  );

CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (
    id = auth.uid() OR public.has_role('admin')
  );

CREATE POLICY "users_update" ON public.users
  FOR UPDATE USING (
    id = auth.uid() OR public.has_role('admin')
  );

-- ===== roles =====
-- Readable by all authenticated users; writable only by admin
CREATE POLICY "roles_select" ON public.roles
  FOR SELECT USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "roles_insert" ON public.roles
  FOR INSERT WITH CHECK (public.has_role('admin'));

CREATE POLICY "roles_update" ON public.roles
  FOR UPDATE USING (public.has_role('admin'));

-- ===== user_roles =====
CREATE POLICY "user_roles_select" ON public.user_roles
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.has_any_role(ARRAY['admin', 'sales_manager'])
  );

CREATE POLICY "user_roles_insert" ON public.user_roles
  FOR INSERT WITH CHECK (public.has_role('admin'));

CREATE POLICY "user_roles_update" ON public.user_roles
  FOR UPDATE USING (public.has_role('admin'));

-- ===== customers =====
-- admin, sales, sales_manager, coordinator, accounting can see all
-- customer role can only see their own record (matched by email → customer.email)
CREATE POLICY "customers_select" ON public.customers
  FOR SELECT USING (
    deleted_at IS NULL AND (
      public.has_any_role(ARRAY['admin', 'sales', 'sales_manager', 'coordinator', 'accounting', 'warehouse'])
      OR (
        public.has_role('customer') AND
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "customers_insert" ON public.customers
  FOR INSERT WITH CHECK (
    public.has_any_role(ARRAY['admin', 'sales', 'sales_manager'])
  );

CREATE POLICY "customers_update" ON public.customers
  FOR UPDATE USING (
    public.has_any_role(ARRAY['admin', 'sales', 'sales_manager'])
    AND deleted_at IS NULL
  );

-- Soft delete: no hard DELETE allowed; use deleted_at instead
-- (No DELETE policy = no one can hard delete)

-- ===== addresses =====
CREATE POLICY "addresses_select" ON public.addresses
  FOR SELECT USING (
    deleted_at IS NULL AND
    public.has_any_role(ARRAY['admin', 'sales', 'sales_manager', 'coordinator', 'technician', 'accounting', 'warehouse'])
  );

CREATE POLICY "addresses_insert" ON public.addresses
  FOR INSERT WITH CHECK (
    public.has_any_role(ARRAY['admin', 'sales', 'sales_manager'])
  );

CREATE POLICY "addresses_update" ON public.addresses
  FOR UPDATE USING (
    public.has_any_role(ARRAY['admin', 'sales', 'sales_manager'])
    AND deleted_at IS NULL
  );

-- ===== products =====
-- All authenticated users can read products
CREATE POLICY "products_select" ON public.products
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND deleted_at IS NULL
  );

CREATE POLICY "products_insert" ON public.products
  FOR INSERT WITH CHECK (
    public.has_any_role(ARRAY['admin', 'sales_manager'])
  );

CREATE POLICY "products_update" ON public.products
  FOR UPDATE USING (
    public.has_any_role(ARRAY['admin', 'sales_manager'])
    AND deleted_at IS NULL
  );

-- ===== price_lists =====
CREATE POLICY "price_lists_select" ON public.price_lists
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND deleted_at IS NULL
  );

CREATE POLICY "price_lists_insert" ON public.price_lists
  FOR INSERT WITH CHECK (
    public.has_any_role(ARRAY['admin', 'sales_manager'])
  );

CREATE POLICY "price_lists_update" ON public.price_lists
  FOR UPDATE USING (
    public.has_any_role(ARRAY['admin', 'sales_manager'])
    AND deleted_at IS NULL
  );

-- ===== audit_log =====
-- Read-only for appropriate roles; no insert policy (server only via SECURITY DEFINER)
CREATE POLICY "audit_log_select" ON public.audit_log
  FOR SELECT USING (
    public.has_any_role(ARRAY['admin', 'sales_manager', 'accounting'])
    OR actor_id = auth.uid()
  );

-- Server writes audit_log via SECURITY DEFINER function — no direct INSERT policy for app users

-- ===== domain_events =====
-- Only admin and service account (via Edge Function) can interact
CREATE POLICY "domain_events_select" ON public.domain_events
  FOR SELECT USING (public.has_role('admin'));

-- App code inserts via SECURITY DEFINER function in the same transaction
-- Edge Functions process via service role (granted separately)

-- ===== notifications =====
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (
    user_id = auth.uid() AND deleted_at IS NULL
  );

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (
    user_id = auth.uid()
  );
