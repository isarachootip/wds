-- ========================================
-- Phase 2: Visit App RLS Policies
-- ========================================

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_checklists ENABLE ROW LEVEL SECURITY;

-- teams: everyone can read
CREATE POLICY "teams_select" ON public.teams FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "teams_write" ON public.teams FOR ALL USING (
  public.has_any_role(ARRAY['admin','coordinator'])
);

-- team_members
CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (
  deleted_at IS NULL AND (
    public.has_any_role(ARRAY['admin','coordinator','sales_manager'])
    OR user_id = auth.uid()
  )
);
CREATE POLICY "team_members_write" ON public.team_members FOR ALL USING (
  public.has_any_role(ARRAY['admin','coordinator'])
);

-- appointments
CREATE POLICY "appointments_select" ON public.appointments FOR SELECT USING (
  deleted_at IS NULL AND (
    public.has_any_role(ARRAY['admin','coordinator','sales_manager','accounting'])
    OR (public.has_role('sales') AND site_visit_id IN (
      SELECT id FROM public.site_visits WHERE requested_by = auth.uid() AND deleted_at IS NULL
    ))
    OR (public.has_role('technician') AND team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND deleted_at IS NULL
    ))
  )
);
CREATE POLICY "appointments_insert" ON public.appointments FOR INSERT WITH CHECK (
  public.has_any_role(ARRAY['admin','coordinator'])
);
CREATE POLICY "appointments_update" ON public.appointments FOR UPDATE USING (
  deleted_at IS NULL AND public.has_any_role(ARRAY['admin','coordinator'])
);

-- jobs
CREATE POLICY "jobs_select" ON public.jobs FOR SELECT USING (
  deleted_at IS NULL AND (
    public.has_any_role(ARRAY['admin','coordinator','sales_manager','accounting'])
    OR (public.has_role('technician') AND appointment_id IN (
      SELECT a.id FROM public.appointments a
      JOIN public.team_members tm ON tm.team_id = a.team_id
      WHERE tm.user_id = auth.uid() AND tm.deleted_at IS NULL AND a.deleted_at IS NULL
    ))
  )
);
CREATE POLICY "jobs_insert" ON public.jobs FOR INSERT WITH CHECK (
  public.has_any_role(ARRAY['admin','coordinator'])
);
CREATE POLICY "jobs_update" ON public.jobs FOR UPDATE USING (
  deleted_at IS NULL AND (
    public.has_any_role(ARRAY['admin','coordinator'])
    OR (public.has_role('technician') AND appointment_id IN (
      SELECT a.id FROM public.appointments a
      JOIN public.team_members tm ON tm.team_id = a.team_id
      WHERE tm.user_id = auth.uid() AND tm.deleted_at IS NULL AND a.deleted_at IS NULL
    ))
  )
);

-- job_items, job_photos, job_checklists — same as jobs
CREATE POLICY "job_items_all" ON public.job_items FOR ALL USING (
  deleted_at IS NULL AND (
    public.has_any_role(ARRAY['admin','coordinator','sales_manager','accounting'])
    OR job_id IN (
      SELECT j.id FROM public.jobs j
      JOIN public.appointments a ON a.id = j.appointment_id
      JOIN public.team_members tm ON tm.team_id = a.team_id
      WHERE tm.user_id = auth.uid() AND tm.deleted_at IS NULL AND j.deleted_at IS NULL
    )
  )
);

CREATE POLICY "job_photos_all" ON public.job_photos FOR ALL USING (
  deleted_at IS NULL AND (
    public.has_any_role(ARRAY['admin','coordinator','sales_manager','accounting'])
    OR job_id IN (
      SELECT j.id FROM public.jobs j
      JOIN public.appointments a ON a.id = j.appointment_id
      JOIN public.team_members tm ON tm.team_id = a.team_id
      WHERE tm.user_id = auth.uid() AND tm.deleted_at IS NULL AND j.deleted_at IS NULL
    )
  )
);

CREATE POLICY "job_checklists_all" ON public.job_checklists FOR ALL USING (
  deleted_at IS NULL AND (
    public.has_any_role(ARRAY['admin','coordinator','sales_manager'])
    OR job_id IN (
      SELECT j.id FROM public.jobs j
      JOIN public.appointments a ON a.id = j.appointment_id
      JOIN public.team_members tm ON tm.team_id = a.team_id
      WHERE tm.user_id = auth.uid() AND tm.deleted_at IS NULL AND j.deleted_at IS NULL
    )
  )
);
