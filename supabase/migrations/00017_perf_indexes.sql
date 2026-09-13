-- ===================================================================
-- Phase 6: Performance Indexes for Common Query Patterns
-- ===================================================================

-- Leads: pipeline filter + assignment
CREATE INDEX IF NOT EXISTS idx_leads_owner_status
  ON public.leads(owner_id, status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_source_status
  ON public.leads(source, status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_created_status
  ON public.leads(created_at DESC, status) WHERE deleted_at IS NULL;

-- Follow-ups: assignee queue with due date ordering
CREATE INDEX IF NOT EXISTS idx_followups_assignee_status_due
  ON public.follow_ups(assignee_id, status, due_at) WHERE deleted_at IS NULL;

-- Jobs: per appointment
CREATE INDEX IF NOT EXISTS idx_jobs_appointment_status
  ON public.jobs(appointment_id, status) WHERE deleted_at IS NULL;

-- Payments: sum per order
CREATE INDEX IF NOT EXISTS idx_payments_order_status
  ON public.payments(order_id, status) WHERE deleted_at IS NULL;

-- Deliveries: driver schedule
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_date_status
  ON public.deliveries(driver_id, scheduled_date, status) WHERE deleted_at IS NULL;

-- Quotations: customer list + status
CREATE INDEX IF NOT EXISTS idx_quotations_customer_status
  ON public.quotations(customer_id, status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_quotations_public_token
  ON public.quotations(public_token) WHERE deleted_at IS NULL;

-- Lead activities: timeline
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_occurred
  ON public.lead_activities(lead_id, occurred_at DESC);

-- Orders: status + customer
CREATE INDEX IF NOT EXISTS idx_orders_customer_status
  ON public.orders(customer_id, status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON public.orders(status, created_at DESC) WHERE deleted_at IS NULL;

-- Invoices: AR aging queries
CREATE INDEX IF NOT EXISTS idx_invoices_order_status_due
  ON public.invoices(order_id, status, due_date) WHERE deleted_at IS NULL;

-- Appointments: team + date
CREATE INDEX IF NOT EXISTS idx_appointments_team_date
  ON public.appointments(team_id, scheduled_start) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON public.appointments(status) WHERE deleted_at IS NULL;

-- Domain events: worker queue
CREATE INDEX IF NOT EXISTS idx_domain_events_status_attempts
  ON public.domain_events(status, attempts) WHERE status IN ('pending', 'failed');

-- Notifications: user inbox
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON public.notifications(user_id, read_at) WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_leads_owner_status IS 'Pipeline filter by sales owner and status';
COMMENT ON INDEX idx_followups_assignee_status_due IS 'Follow-up queue ordered by due date';
COMMENT ON INDEX idx_deliveries_driver_date_status IS 'Driver daily schedule query';
COMMENT ON INDEX idx_domain_events_status_attempts IS 'Event worker polling index';
