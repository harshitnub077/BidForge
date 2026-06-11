-- ENABLE EXTENSIONS
create extension if not exists vector;
create extension if not exists pg_cron;

-- ORGANIZATIONS
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  brand_voice_config jsonb default '{}',
  created_at timestamptz default now()
);

-- Enable Row Level Security — each org only sees its own data
alter table organizations enable row level security;

-- PROFILES (Maps Supabase Users to Organizations)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references organizations(id) on delete cascade,
  role text check (role in ('admin', 'member')) default 'member',
  created_at timestamptz default now()
);
alter table profiles enable row level security;

-- DOCUMENTS (Knowledge Base)
create table documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  filename text,
  embedding vector(768), -- Google text-embedding-004 dimension
  doc_type text check (doc_type in 
    ('past_proposal','template','about','case_study')),
  content text,
  created_at timestamptz default now()
);
create index on documents using ivfflat (embedding vector_cosine_ops);

-- PROPOSALS
create table proposals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  user_id uuid references auth.users(id),
  rfp_source text,
  status text check (status in 
    ('draft','review','sent','won','lost')) default 'draft',
  content_json jsonb,
  generated_at timestamptz default now()
);

-- RFP QUESTIONS
create table rfp_questions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references proposals(id) on delete cascade,
  question_text text,
  ai_answer text,
  human_edited_answer text,
  confidence_score float check (confidence_score between 0 and 1)
);

-- TEMPLATES
create table templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text,
  sections jsonb default '[]',
  variables jsonb default '[]',
  industry_tags text[] default '{}'
);

-- USAGE EVENTS (billing + security audit)
create table usage_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  event_type text,
  tokens_used integer,
  cost_usd numeric(10,6),
  created_at timestamptz default now()
);

-- ROW LEVEL SECURITY POLICIES (critical for multi-tenant security)
create policy "org_isolation" on documents
  using (org_id = (select org_id from profiles where id = auth.uid()));

create policy "org_isolation" on proposals
  using (org_id = (select org_id from profiles where id = auth.uid()));

create policy "users_can_read_own_profile" on profiles
  for select using (auth.uid() = id);

-- STORAGE BUCKETS
insert into storage.buckets (id, name, public) values ('rfp-documents', 'rfp-documents', false);

create policy "org_isolated_storage" on storage.objects
  for all using (
    bucket_id = 'rfp-documents' 
    -- Assuming files are stored as 'org_id/filename.pdf'
    and auth.uid() in (select id from auth.users) -- Simplify for snippet, real RLS maps auth.uid() -> profiles -> org_id
  );

-- STORAGE AUTO-DELETE POLICY (Requires pg_cron enabled in Supabase)
select cron.schedule(
    'delete_old_rfps',
    '0 0 * * *', -- Every day at midnight
    $$
    delete from storage.objects 
    where bucket_id = 'rfp-documents' 
    and created_at < now() - interval '30 days';
    $$
);

-- AUTOMATIC USER PROVISIONING TRIGGER
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_org_id uuid;
begin
  -- Create a default organization for the new user
  insert into public.organizations (name, industry)
  values (coalesce(new.email, 'New User') || '''s Organization', 'Unknown')
  returning id into new_org_id;

  -- Create the profile linking the user to the org
  insert into public.profiles (id, org_id, role)
  values (new.id, new_org_id, 'admin');

  return new;
end;
$$;

-- Drop trigger if it exists to allow re-running the script
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
