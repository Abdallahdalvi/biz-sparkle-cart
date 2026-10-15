-- Apply once to production. No existing inventory, orders or AWBs are changed.
-- Failed stock checks must abort the transaction rather than silently succeed.
create or replace function electronic_shop.decrement_stock(p_product_id uuid, p_variant_id uuid, p_qty int)
returns boolean
language plpgsql security definer
set search_path = electronic_shop, public
as $$
begin
  if p_product_id is null or p_qty is null or p_qty <= 0 then
    raise exception 'Invalid stock request';
  end if;
  perform 1 from electronic_shop.products where id = p_product_id for update;
  if not found then raise exception 'Product not found'; end if;
  if p_variant_id is null and exists (
    select 1 from electronic_shop.product_variants where product_id = p_product_id
  ) then raise exception 'Choose a colour before checkout'; end if;
  if p_variant_id is not null then
    update electronic_shop.product_variants set stock = stock - p_qty
    where id = p_variant_id and product_id = p_product_id and stock >= p_qty;
    if not found then raise exception 'Selected colour is out of stock'; end if;
  end if;
  update electronic_shop.products set stock = stock - p_qty
  where id = p_product_id and stock >= p_qty;
  if not found then raise exception 'Insufficient product stock'; end if;
  return true;
end;
$$;
revoke execute on function electronic_shop.decrement_stock(uuid, uuid, int) from public, anon, authenticated;
grant execute on function electronic_shop.decrement_stock(uuid, uuid, int) to service_role;
