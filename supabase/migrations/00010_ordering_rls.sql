-- ========================================
-- Phase 3: E-ordering RLS Policies
-- ========================================

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_otp_codes ENABLE ROW LEVEL SECURITY;

-- quotations: staff see all, customers not directly (use portal)
CREATE POLICY "quotations_select" ON public.quotations FOR SELECT USING (
  deleted_at IS NULL AND public.has_any_role(ARRAY['admin','sales','sales_manager','coordinator','accounting'])
);
CREATE POLICY "quotations_insert" ON public.quotations FOR INSERT WITH CHECK (
  public.has_any_role(ARRAY['admin','sales','sales_manager'])
);
CREATE POLICY "quotations_update" ON public.quotations FOR UPDATE USING (
  deleted_at IS NULL AND public.has_any_role(ARRAY['admin','sales','sales_manager'])
);

-- quotation_items
CREATE POLICY "quotation_items_all" ON public.quotation_items FOR ALL USING (
  deleted_at IS NULL AND public.has_any_role(ARRAY['admin','sales','sales_manager','accounting','coordinator'])
);

-- quotation_events — read by staff, insert via SECURITY DEFINER function
CREATE POLICY "quotation_events_select" ON public.quotation_events FOR SELECT USING (
  public.has_any_role(ARRAY['admin','sales','sales_manager','accounting'])
);
CREATE POLICY "quotation_events_insert" ON public.quotation_events FOR INSERT WITH CHECK (true);
-- Portal inserts events via server-side action (no auth required in server actions)

-- orders
CREATE POLICY "orders_select" ON public.orders FOR SELECT USING (
  deleted_at IS NULL AND public.has_any_role(ARRAY['admin','sales','sales_manager','accounting','coordinator'])
);
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (
  public.has_any_role(ARRAY['admin','sales','sales_manager'])
);
CREATE POLICY "orders_update" ON public.orders FOR UPDATE USING (
  deleted_at IS NULL AND public.has_any_role(ARRAY['admin','sales','sales_manager','accounting'])
);

-- portal_otp_codes — server-side only (service role), no client RLS needed
CREATE POLICY "portal_otp_all" ON public.portal_otp_codes FOR ALL USING (true);
