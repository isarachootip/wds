-- ========================================
-- Phase 2: Visit App Tables
-- ========================================

-- teams
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

-- team_members
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id),
  user_id uuid NOT NULL REFERENCES public.users(id),
  role varchar(30) DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id) WHERE deleted_at IS NULL;

-- appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_visit_id uuid REFERENCES public.site_visits(id),
  customer_id uuid REFERENCES public.customers(id),
  address_id uuid REFERENCES public.addresses(id),
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  team_id uuid REFERENCES public.teams(id),
  status varchar(20) NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','scheduled','in_progress','completed','rejected','cancelled','no_show')),
  approved_by uuid REFERENCES public.users(id),
  approved_at timestamptz,
  reject_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_team_id ON public.appointments(team_id, scheduled_start) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_site_visit ON public.appointments(site_visit_id) WHERE deleted_at IS NULL;

-- jobs
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id),
  status varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','checked_in','in_progress','checked_out','closed')),
  -- check-in
  checkin_at timestamptz,
  checkin_lat double precision,
  checkin_lng double precision,
  checkin_distance_m integer,
  checkin_reason text,
  flagged boolean DEFAULT false,
  -- check-out
  checkout_at timestamptz,
  checkout_lat double precision,
  checkout_lng double precision,
  -- results
  work_summary text,
  customer_signature_path text,
  next_action text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_jobs_appointment_id ON public.jobs(appointment_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status) WHERE deleted_at IS NULL;

-- job_items
CREATE TABLE IF NOT EXISTS public.job_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  description varchar(500) NOT NULL,
  qty integer NOT NULL DEFAULT 1,
  unit varchar(30) DEFAULT 'ชิ้น',
  unit_price_satang bigint NOT NULL DEFAULT 0,
  source varchar(20) NOT NULL DEFAULT 'planned' CHECK (source IN ('planned','added_onsite')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_job_items_job_id ON public.job_items(job_id) WHERE deleted_at IS NULL;

-- job_photos
CREATE TABLE IF NOT EXISTS public.job_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  kind varchar(20) NOT NULL CHECK (kind IN ('before','during','after','issue')),
  caption varchar(255),
  taken_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_job_photos_job_id ON public.job_photos(job_id, kind) WHERE deleted_at IS NULL;

-- job_checklists
CREATE TABLE IF NOT EXISTS public.job_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  template_key varchar(100) NOT NULL DEFAULT 'standard',
  item varchar(500) NOT NULL,
  checked boolean NOT NULL DEFAULT false,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_job_checklists_job_id ON public.job_checklists(job_id) WHERE deleted_at IS NULL;

-- Apply updated_at trigger to all new tables
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['teams','appointments','jobs','job_items','job_checklists']
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
  END LOOP;
END;
$$;

-- Default checklist template items (inserted when job created)
-- (handled in application code via createDefaultChecklist function)

-- Seed: create 2 default teams
INSERT INTO public.teams (name, description) VALUES
  ('ทีมก่อสร้าง A', 'ทีมช่างก่อสร้างชุดที่ 1'),
  ('ทีมก่อสร้าง B', 'ทีมช่างก่อสร้างชุดที่ 2')
ON CONFLICT DO NOTHING;
