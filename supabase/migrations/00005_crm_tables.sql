-- ========================================
-- Phase 1: CRM Tables
-- ========================================

-- 1. leads
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id),
  source varchar(20) NOT NULL CHECK (source IN ('line', 'phone', 'store', 'other')),
  channel_ref varchar(255),
  status varchar(30) NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','contacted','qualified','site_visit_requested','quoted','won','lost')),
  owner_id uuid REFERENCES public.users(id),
  interest jsonb,
  budget_range_min_satang bigint,
  budget_range_max_satang bigint,
  lost_reason varchar(100),
  score integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

-- Indexes for leads
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON public.leads(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON public.leads(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
-- Dedupe index: helps find leads by channel_ref (phone / line_user_id)
CREATE INDEX IF NOT EXISTS idx_leads_channel_ref ON public.leads(channel_ref) WHERE deleted_at IS NULL AND status NOT IN ('won','lost');

-- 2. lead_activities
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type varchar(20) NOT NULL CHECK (type IN ('call','line','visit','note','quote_sent','status_change')),
  note text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id, occurred_at DESC);

-- 3. follow_ups
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  due_at timestamptz NOT NULL,
  assignee_id uuid REFERENCES public.users(id),
  channel varchar(20) CHECK (channel IN ('phone','line','email','visit')),
  status varchar(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','done','skipped')),
  note text,
  done_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_assignee ON public.follow_ups(assignee_id, due_at) WHERE deleted_at IS NULL AND status = 'open';
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_id ON public.follow_ups(lead_id) WHERE deleted_at IS NULL;

-- 4. site_visits
CREATE TABLE IF NOT EXISTS public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id),
  customer_id uuid REFERENCES public.customers(id),
  address_id uuid REFERENCES public.addresses(id),
  requested_by uuid REFERENCES public.users(id),
  requested_at timestamptz NOT NULL DEFAULT now(),
  purpose text,
  status varchar(20) NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','scheduled','done','cancelled')),
  scope jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_site_visits_lead_id ON public.site_visits(lead_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_site_visits_customer_id ON public.site_visits(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_site_visits_status ON public.site_visits(status) WHERE deleted_at IS NULL;

-- Apply updated_at trigger to all new tables
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['leads','lead_activities','follow_ups','site_visits']
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
  END LOOP;
END;
$$;
