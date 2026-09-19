CREATE TYPE public.member_status AS ENUM ('pending', 'approved', 'rejected', 'deactivated');

CREATE TABLE public.team_members (
  user_id uuid PRIMARY KEY,
  email text NOT NULL,
  status public.member_status NOT NULL DEFAULT 'pending',
  is_owner boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX team_members_single_owner ON public.team_members (is_owner) WHERE is_owner;

GRANT SELECT ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_app_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id AND is_owner AND status = 'approved'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_approved_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id AND status = 'approved'
  )
$$;

CREATE POLICY "Members can read their own membership"
ON public.team_members FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Owner can read all memberships"
ON public.team_members FOR SELECT TO authenticated
USING (public.is_app_owner(auth.uid()));

CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.proposals
  ADD COLUMN owner_id uuid,
  ADD COLUMN client_id text;

ALTER TABLE public.proposals
  ALTER COLUMN share_token SET DEFAULT md5(gen_random_uuid()::text);

CREATE UNIQUE INDEX proposals_owner_client_id
ON public.proposals (owner_id, client_id) WHERE client_id IS NOT NULL;

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated;
GRANT ALL ON public.proposals TO service_role;

CREATE POLICY "Approved members manage their own proposals"
ON public.proposals FOR ALL TO authenticated
USING (owner_id = auth.uid() AND public.is_approved_member(auth.uid()))
WITH CHECK (owner_id = auth.uid() AND public.is_approved_member(auth.uid()));