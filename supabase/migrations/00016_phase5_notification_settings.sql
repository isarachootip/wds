-- ===================================================================
-- Phase 5: Notification Settings per User per Trigger
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id),
  trigger_key varchar(100) NOT NULL,
  -- trigger keys: followup.overdue, lead.stale, site_visit.new_request,
  --   appointment.pending_approval, quotation.viewed, quotation.accepted,
  --   quotation.rejected, quotation.expiring, order.credit_hold,
  --   payment.slip_pending, delivery.failed
  in_app boolean NOT NULL DEFAULT true,
  line boolean NOT NULL DEFAULT false,
  email boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, trigger_key)
);

CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON public.notification_settings(user_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.notification_settings;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_settings_own" ON public.notification_settings
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "notification_settings_admin" ON public.notification_settings
  FOR ALL USING (public.has_any_role(ARRAY['admin']));
