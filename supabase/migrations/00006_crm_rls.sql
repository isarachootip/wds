-- ========================================
-- Phase 1: CRM RLS Policies
-- ========================================

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- ===== leads =====
-- sales: เห็นเฉพาะ lead ที่ตัวเองเป็น owner
-- sales_manager, admin, accounting: เห็นทั้งหมด
-- coordinator, technician: ไม่เห็น leads โดยตรง (เห็นผ่าน site_visits)

CREATE POLICY "leads_select" ON public.leads FOR SELECT USING (
  deleted_at IS NULL AND (
    public.has_any_role(ARRAY['admin', 'sales_manager', 'accounting'])
    OR (public.has_role('sales') AND owner_id = auth.uid())
    OR (public.has_role('coordinator') AND id IN (
      SELECT lead_id FROM public.site_visits WHERE deleted_at IS NULL
    ))
  )
);

CREATE POLICY "leads_insert" ON public.leads FOR INSERT WITH CHECK (
  public.has_any_role(ARRAY['admin', 'sales', 'sales_manager'])
);

CREATE POLICY "leads_update" ON public.leads FOR UPDATE USING (
  deleted_at IS NULL AND (
    public.has_any_role(ARRAY['admin', 'sales_manager'])
    OR (public.has_role('sales') AND owner_id = auth.uid())
  )
);

-- ===== lead_activities =====
CREATE POLICY "lead_activities_select" ON public.lead_activities FOR SELECT USING (
  deleted_at IS NULL AND (
    public.has_any_role(ARRAY['admin', 'sales_manager', 'accounting'])
    OR (public.has_role('sales') AND lead_id IN (
      SELECT id FROM public.leads WHERE owner_id = auth.uid() AND deleted_at IS NULL
    ))
  )
);

CREATE POLICY "lead_activities_insert" ON public.lead_activities FOR INSERT WITH CHECK (
  public.has_any_role(ARRAY['admin', 'sales', 'sales_manager'])
);

-- ===== follow_ups =====
CREATE POLICY "follow_ups_select" ON public.follow_ups FOR SELECT USING (
  deleted_at IS NULL AND (
    public.has_any_role(ARRAY['admin', 'sales_manager'])
    OR (public.has_role('sales') AND assignee_id = auth.uid())
    OR (public.has_role('coordinator') AND assignee_id = auth.uid())
  )
);

CREATE POLICY "follow_ups_insert" ON public.follow_ups FOR INSERT WITH CHECK (
  public.has_any_role(ARRAY['admin', 'sales', 'sales_manager', 'coordinator'])
);

CREATE POLICY "follow_ups_update" ON public.follow_ups FOR UPDATE USING (
  deleted_at IS NULL AND (
    public.has_any_role(ARRAY['admin', 'sales_manager'])
    OR (public.has_any_role(ARRAY['sales', 'coordinator']) AND assignee_id = auth.uid())
  )
);

-- ===== site_visits =====
-- sales, sales_manager, coordinator: เห็น site_visits ที่เกี่ยวข้อง
-- technician: เห็นเฉพาะที่ assign ให้ตัวเอง (Phase 2 จะเพิ่ม field)

CREATE POLICY "site_visits_select" ON public.site_visits FOR SELECT USING (
  deleted_at IS NULL AND (
    public.has_any_role(ARRAY['admin', 'sales_manager', 'coordinator', 'accounting'])
    OR (public.has_role('sales') AND requested_by = auth.uid())
    OR public.has_role('technician')
  )
);

CREATE POLICY "site_visits_insert" ON public.site_visits FOR INSERT WITH CHECK (
  public.has_any_role(ARRAY['admin', 'sales', 'sales_manager'])
);

CREATE POLICY "site_visits_update" ON public.site_visits FOR UPDATE USING (
  deleted_at IS NULL AND
  public.has_any_role(ARRAY['admin', 'sales_manager', 'coordinator'])
);
