-- ===================================================================
-- Phase 5: SQL Views for Dashboard and Reports
-- ===================================================================

-- ─── Dashboard Today ────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_dashboard_today AS
SELECT
  (SELECT COUNT(*) FROM public.leads
   WHERE DATE(created_at AT TIME ZONE 'Asia/Bangkok') = CURRENT_DATE
     AND deleted_at IS NULL)::int AS new_leads_today,

  (SELECT COUNT(*) FROM public.follow_ups
   WHERE status = 'open' AND due_at < now()
     AND deleted_at IS NULL)::int AS overdue_followups,

  (SELECT COUNT(*) FROM public.site_visits
   WHERE status IN ('requested','scheduled')
     AND deleted_at IS NULL)::int AS pending_site_visits,

  (SELECT COUNT(*) FROM public.appointments
   WHERE status = 'requested'
     AND deleted_at IS NULL)::int AS pending_appointments,

  (SELECT COUNT(*) FROM public.quotations
   WHERE status IN ('draft','sent','viewed')
     AND deleted_at IS NULL)::int AS pending_quotations,

  (SELECT COUNT(*) FROM public.payments
   WHERE status IN ('pending','verifying')
     AND deleted_at IS NULL)::int AS pending_payments_count,

  (SELECT COALESCE(SUM(amount_satang), 0) FROM public.payments
   WHERE status IN ('pending','verifying')
     AND deleted_at IS NULL)::bigint AS pending_payments_satang,

  (SELECT COUNT(*) FROM public.deliveries
   WHERE status IN ('pending','scheduled','picking','shipped')
     AND deleted_at IS NULL)::int AS pending_deliveries;

-- ─── Funnel Report ───────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_funnel AS
WITH
  total_leads AS (
    SELECT COUNT(*) AS cnt FROM public.leads WHERE deleted_at IS NULL
  ),
  leads_sv AS (
    SELECT
      COUNT(DISTINCT l.id) AS cnt,
      AVG(EXTRACT(EPOCH FROM (sv.created_at - l.created_at)) / 86400.0) AS avg_days
    FROM public.leads l
    JOIN public.site_visits sv ON sv.lead_id = l.id AND sv.deleted_at IS NULL
    WHERE l.deleted_at IS NULL
  ),
  leads_qt AS (
    SELECT
      COUNT(DISTINCT l.id) AS cnt,
      AVG(EXTRACT(EPOCH FROM (q.created_at - l.created_at)) / 86400.0) AS avg_days
    FROM public.leads l
    JOIN public.quotations q ON q.lead_id = l.id AND q.deleted_at IS NULL
    WHERE l.deleted_at IS NULL
  ),
  leads_order AS (
    SELECT
      COUNT(DISTINCT l.id) AS cnt,
      AVG(EXTRACT(EPOCH FROM (o.created_at - l.created_at)) / 86400.0) AS avg_days
    FROM public.leads l
    JOIN public.quotations q ON q.lead_id = l.id AND q.deleted_at IS NULL
    JOIN public.orders o ON o.quotation_id = q.id AND o.deleted_at IS NULL
    WHERE l.deleted_at IS NULL
  ),
  orders_paid AS (
    SELECT COUNT(DISTINCT id) AS cnt
    FROM public.orders
    WHERE status IN ('paid','ready','delivering','delivered','closed')
      AND deleted_at IS NULL
  )
SELECT
  (SELECT cnt FROM total_leads)::int AS total_leads,

  (SELECT cnt FROM leads_sv)::int AS sv_count,
  ROUND(((SELECT cnt FROM leads_sv)::numeric
    / NULLIF((SELECT cnt FROM total_leads)::numeric, 0) * 100), 1) AS sv_rate_pct,
  ROUND((SELECT avg_days FROM leads_sv)::numeric, 1) AS sv_avg_days,

  (SELECT cnt FROM leads_qt)::int AS qt_count,
  ROUND(((SELECT cnt FROM leads_qt)::numeric
    / NULLIF((SELECT cnt FROM total_leads)::numeric, 0) * 100), 1) AS qt_rate_pct,
  ROUND((SELECT avg_days FROM leads_qt)::numeric, 1) AS qt_avg_days,

  (SELECT cnt FROM leads_order)::int AS order_count,
  ROUND(((SELECT cnt FROM leads_order)::numeric
    / NULLIF((SELECT cnt FROM total_leads)::numeric, 0) * 100), 1) AS order_rate_pct,

  (SELECT cnt FROM orders_paid)::int AS paid_count,
  ROUND(((SELECT cnt FROM orders_paid)::numeric
    / NULLIF((SELECT cnt FROM total_leads)::numeric, 0) * 100), 1) AS paid_rate_pct;

-- ─── Channel Report ──────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_channel_report AS
SELECT
  l.source,
  COUNT(*) AS lead_count,
  COUNT(*) FILTER (WHERE l.status = 'won') AS won_count,
  ROUND(
    COUNT(*) FILTER (WHERE l.status = 'won')::numeric
    / NULLIF(COUNT(*)::numeric, 0) * 100, 1
  ) AS win_rate_pct,
  COALESCE(
    AVG(o.total_satang) FILTER (WHERE o.id IS NOT NULL), 0
  )::bigint AS avg_order_satang
FROM public.leads l
LEFT JOIN public.quotations q ON q.lead_id = l.id AND q.deleted_at IS NULL
LEFT JOIN public.orders o ON o.quotation_id = q.id AND o.deleted_at IS NULL
WHERE l.deleted_at IS NULL
GROUP BY l.source
ORDER BY lead_count DESC;

-- ─── Technician Performance ──────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_technician_performance AS
SELECT
  u.id AS user_id,
  u.full_name,
  COUNT(DISTINCT j.id) AS total_jobs,
  COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'checked_out') AS completed_jobs,
  ROUND(
    COUNT(DISTINCT j.id) FILTER (WHERE j.flagged = false)::numeric
    / NULLIF(COUNT(DISTINCT j.id)::numeric, 0) * 100, 1
  ) AS on_time_pct,
  COUNT(DISTINCT j.id) FILTER (WHERE j.flagged = true) AS flagged_jobs
FROM public.users u
JOIN public.team_members tm ON tm.user_id = u.id AND tm.deleted_at IS NULL
JOIN public.appointments a ON a.team_id = tm.team_id AND a.deleted_at IS NULL
JOIN public.jobs j ON j.appointment_id = a.id AND j.deleted_at IS NULL
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.full_name;

-- ─── AR Aging ────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_ar_aging AS
SELECT
  c.id AS customer_id,
  c.name AS customer_name,
  COALESCE(SUM(i.amount_satang - i.paid_satang)
    FILTER (WHERE CURRENT_DATE - i.due_date BETWEEN 0 AND 30), 0)::bigint AS bucket_0_30,
  COALESCE(SUM(i.amount_satang - i.paid_satang)
    FILTER (WHERE CURRENT_DATE - i.due_date BETWEEN 31 AND 60), 0)::bigint AS bucket_31_60,
  COALESCE(SUM(i.amount_satang - i.paid_satang)
    FILTER (WHERE CURRENT_DATE - i.due_date BETWEEN 61 AND 90), 0)::bigint AS bucket_61_90,
  COALESCE(SUM(i.amount_satang - i.paid_satang)
    FILTER (WHERE CURRENT_DATE - i.due_date > 90), 0)::bigint AS bucket_90plus,
  COALESCE(SUM(i.amount_satang - i.paid_satang), 0)::bigint AS total_outstanding
FROM public.customers c
JOIN public.orders o ON o.customer_id = c.id AND o.deleted_at IS NULL
JOIN public.invoices i ON i.order_id = o.id AND i.deleted_at IS NULL
WHERE c.deleted_at IS NULL
  AND i.status NOT IN ('paid','void')
  AND i.due_date IS NOT NULL
GROUP BY c.id, c.name
HAVING COALESCE(SUM(i.amount_satang - i.paid_satang), 0) > 0
ORDER BY total_outstanding DESC;

-- Performance indexes for report queries
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_followups_due_status ON public.follow_ups(due_at, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_appointment_status ON public.jobs(appointment_id, status) WHERE deleted_at IS NULL;
