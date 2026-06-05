-- Multi-tenant Treez store access (org + dispensary per tenant).

alter table public.profiles
  add column if not exists assigned_tenant_keys text[] not null default '{}';

comment on column public.profiles.assigned_tenant_keys is
  'Treez store tenant keys a user may access. Admins/master_admin with empty array may access all configured tenants.';
