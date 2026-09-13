-- ===================================================================
-- Phase 4 Full: RLS for new tables
-- ===================================================================

ALTER TABLE public.customer_credit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- customer_credit: only accounting + admin manage
CREATE POLICY "customer_credit_select" ON public.customer_credit FOR SELECT USING (
  deleted_at IS NULL AND public.has_any_role(ARRAY['admin','accounting','sales_manager','sales','coordinator'])
);
CREATE POLICY "customer_credit_insert" ON public.customer_credit FOR INSERT WITH CHECK (
  public.has_any_role(ARRAY['admin','accounting','sales_manager'])
);
CREATE POLICY "customer_credit_update" ON public.customer_credit FOR UPDATE USING (
  deleted_at IS NULL AND public.has_any_role(ARRAY['admin','accounting','sales_manager'])
);

-- credit_checks: read-only for most; auto-insert by system
CREATE POLICY "credit_checks_select" ON public.credit_checks FOR SELECT USING (
  public.has_any_role(ARRAY['admin','accounting','sales_manager','sales','coordinator'])
);
CREATE POLICY "credit_checks_insert" ON public.credit_checks FOR INSERT WITH CHECK (
  public.has_any_role(ARRAY['admin','accounting','sales_manager','sales'])
);

-- invoices
CREATE POLICY "invoices_select" ON public.invoices FOR SELECT USING (
  deleted_at IS NULL AND public.has_any_role(ARRAY['admin','accounting','sales_manager','sales','coordinator'])
);
CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT WITH CHECK (
  public.has_any_role(ARRAY['admin','accounting','sales_manager'])
);
CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE USING (
  deleted_at IS NULL AND public.has_any_role(ARRAY['admin','accounting'])
);
