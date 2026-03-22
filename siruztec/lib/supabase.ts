import { createBrowserClient } from '@supabase/ssr'

// Browser/client-side Supabase client — safe to import in Client Components
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const supabaseSchema = `
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Tenants (empresas clientes)
create table if not exists tenants (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  plan text not null default 'startup' check (plan in ('startup', 'scale', 'dominance')),
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'trial' check (status in ('trial', 'active', 'paused', 'cancelled')),
  created_at timestamptz default now()
);

-- Business profiles (gerado no onboarding)
create table if not exists business_profiles (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade unique,
  company_name text not null,
  industry text not null,
  size text not null,
  target_audience text not null,
  main_challenge text not null,
  goals text[] not null default '{}',
  tone_of_voice text not null,
  context_summary text,
  onboarding_completed boolean default false,
  created_at timestamptz default now()
);

-- Conversations
create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  agent_id text not null,
  messages jsonb not null default '[]',
  routed_from text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Usage logs
create table if not exists usage_logs (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  agent_id text not null,
  tokens_used integer not null default 0,
  created_at timestamptz default now()
);

-- Sessões freelancer (contratação avulsa de especialistas)
create table if not exists freelance_sessions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  agent_id text not null,
  stripe_payment_id text not null unique,
  messages_used integer not null default 0,
  messages_limit integer not null default 20,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz default now()
);

-- Idempotência de webhooks Stripe
create table if not exists processed_stripe_events (
  event_id text primary key,
  created_at timestamptz default now()
);

-- Colunas de onboarding conversacional (idempotentes)
alter table business_profiles
  add column if not exists partial_profile jsonb default '{}',
  add column if not exists onboarding_messages jsonb default '[]';

-- Row Level Security
alter table tenants enable row level security;
alter table business_profiles enable row level security;
alter table conversations enable row level security;
alter table usage_logs enable row level security;
alter table freelance_sessions enable row level security;
-- processed_stripe_events: no user access (service_role only via webhook)
alter table processed_stripe_events enable row level security;

-- Policies: users see only their own tenant
drop policy if exists "Users see own tenant" on tenants;
create policy "Users see own tenant" on tenants
  for all using (owner_id = auth.uid());

drop policy if exists "Users see own profile" on business_profiles;
create policy "Users see own profile" on business_profiles
  for all using (
    tenant_id in (select id from tenants where owner_id = auth.uid())
  );

drop policy if exists "Users see own conversations" on conversations;
create policy "Users see own conversations" on conversations
  for all using (
    tenant_id in (select id from tenants where owner_id = auth.uid())
  );

drop policy if exists "Users see own usage" on usage_logs;
create policy "Users see own usage" on usage_logs
  for all using (
    tenant_id in (select id from tenants where owner_id = auth.uid())
  );

drop policy if exists "Users see own freelance sessions" on freelance_sessions;
create policy "Users see own freelance sessions" on freelance_sessions
  for all using (
    tenant_id in (select id from tenants where owner_id = auth.uid())
  );

-- Atomic increment for freelance session usage (prevents race condition)
create or replace function increment_freelance_usage(p_session_id uuid)
returns table(messages_used integer, messages_limit integer) as $$
  update freelance_sessions
  set messages_used = messages_used + 1
  where id = p_session_id
    and messages_used < messages_limit
    and expires_at > now()
  returning messages_used, messages_limit;
$$ language sql security definer;

-- Daily message count for rate limiting
create or replace function count_messages_today(p_tenant_id uuid)
returns integer as $$
  select count(*)::integer
  from usage_logs
  where tenant_id = p_tenant_id
    and created_at >= date_trunc('day', now() at time zone 'utc');
$$ language sql security definer;
`
