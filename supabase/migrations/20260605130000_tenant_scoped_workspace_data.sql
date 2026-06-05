-- Isolate bulk draft imports and sales promo documents per Treez store tenant.

alter table public.bulk_discount_drafts
  add column if not exists tenant_key text not null default '';

alter table public.sales_promo_documents
  add column if not exists tenant_key text not null default '';

comment on column public.bulk_discount_drafts.tenant_key is
  'Treez store tenant key. Empty string = legacy rows (treated as the primary/default store).';

comment on column public.sales_promo_documents.tenant_key is
  'Treez store tenant key. Empty string = legacy rows (treated as the primary/default store).';

create index if not exists bulk_discount_drafts_tenant_created_by_idx
  on public.bulk_discount_drafts (tenant_key, created_by);

create index if not exists sales_promo_documents_tenant_updated_idx
  on public.sales_promo_documents (tenant_key, updated_at desc);
