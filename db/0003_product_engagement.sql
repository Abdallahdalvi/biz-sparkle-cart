-- Apply before deploying engagement-based recommendations.
-- Anonymous session identifiers are hashed, never exposed by the aggregate RPC.
create table if not exists electronic_shop.product_engagement (
  product_id uuid not null references electronic_shop.products(id) on delete cascade,
  day date not null default current_date,
  session_hash text not null,
  event text not null check (event in ('view', 'click', 'cart')),
  primary key (product_id, day, session_hash, event)
);
alter table electronic_shop.product_engagement enable row level security;
revoke all on electronic_shop.product_engagement from public, anon, authenticated;
grant all on electronic_shop.product_engagement to service_role;
create index if not exists product_engagement_day_idx on electronic_shop.product_engagement(day);

create or replace function electronic_shop.record_product_engagement(
  p_slug text, p_event text, p_session uuid
) returns void language plpgsql security definer
set search_path = pg_catalog, electronic_shop
as $$
begin
  if p_event is null or p_event not in ('view', 'click', 'cart') or p_session is null
    or p_slug is null or length(p_slug) > 200 then
    return;
  end if;
  insert into electronic_shop.product_engagement(product_id, session_hash, event)
  select id, md5(p_session::text || current_date::text), p_event
  from electronic_shop.products where slug = p_slug and is_active = true
  on conflict do nothing;
  -- Keep only the rolling window used for recommendations.
  delete from electronic_shop.product_engagement where day < current_date - 30;
end;
$$;

create or replace function electronic_shop.get_product_engagement()
returns table(slug text, views double precision, clicks double precision, carts double precision)
language sql stable security definer
set search_path = pg_catalog, electronic_shop
as $$
  select p.slug,
    coalesce(sum(power(0.5, (current_date - e.day)::double precision / 7)) filter (where e.event = 'view'), 0),
    coalesce(sum(power(0.5, (current_date - e.day)::double precision / 7)) filter (where e.event = 'click'), 0),
    coalesce(sum(power(0.5, (current_date - e.day)::double precision / 7)) filter (where e.event = 'cart'), 0)
  from electronic_shop.products p
  join electronic_shop.product_engagement e on e.product_id = p.id
  where p.is_active = true and e.day >= current_date - 30
  group by p.slug;
$$;
revoke all on function electronic_shop.record_product_engagement(text, text, uuid) from public;
revoke all on function electronic_shop.get_product_engagement() from public;
grant execute on function electronic_shop.record_product_engagement(text, text, uuid) to anon, authenticated;
grant execute on function electronic_shop.get_product_engagement() to anon, authenticated, service_role;
notify pgrst, 'reload schema';
