-- ===================================================================
-- Migration 00018: System Settings & External Integrations (LINE OA, LIFF)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  key varchar(100) PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);

DROP TRIGGER IF EXISTS set_updated_at ON public.system_settings;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow reading system settings for authenticated users / admins
CREATE POLICY "system_settings_read_admin" ON public.system_settings
  FOR SELECT USING (true);

-- Allow modifying system settings only for admins
CREATE POLICY "system_settings_write_admin" ON public.system_settings
  FOR ALL USING (public.has_any_role(ARRAY['admin']));
