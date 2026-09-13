-- ========================================
-- Phase 4: Payments & Deliveries RLS
-- ========================================

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_items ENABLE ROW LEVEL SECURITY;

-- payments: accounting + sales can see; accounting confirms
CREATE POLICY "payments_select" ON public.payments FOR SELECT USING (
  deleted_at IS NULL AND public.has_any_role(ARRAY['admin','sales','sales_manager','accounting','coordinator'])
);
CREATE POLICY "payments_insert" ON public.payments FOR INSERT WITH CHECK (
  public.has_any_role(ARRAY['admin','sales','sales_manager','accounting'])
);
CREATE POLICY "payments_update" ON public.payments FOR UPDATE USING (
  deleted_at IS NULL AND public.has_any_role(ARRAY['admin','accounting','sales_manager'])
);

-- deliveries
CREATE POLICY "deliveries_select" ON public.deliveries FOR SELECT USING (
  deleted_at IS NULL AND public.has_any_role(ARRAY['admin','coordinator','warehouse','sales','sales_manager','accounting','technician'])
);
CREATE POLICY "deliveries_insert" ON public.deliveries FOR INSERT WITH CHECK (
  public.has_any_role(ARRAY['admin','coordinator','warehouse','sales_manager'])
);
CREATE POLICY "deliveries_update" ON public.deliveries FOR UPDATE USING (
  deleted_at IS NULL AND public.has_any_role(ARRAY['admin','coordinator','warehouse','sales_manager','technician'])
);

-- delivery_items
CREATE POLICY "delivery_items_all" ON public.delivery_items FOR ALL USING (
  public.has_any_role(ARRAY['admin','coordinator','warehouse','sales','sales_manager','technician'])
);
