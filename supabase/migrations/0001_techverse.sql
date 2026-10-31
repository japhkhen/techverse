create extension if not exists pgcrypto with schema extensions;

create type public.user_role as enum ('customer', 'admin');
create type public.order_status as enum ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'failed');
create type public.payment_status as enum ('pending', 'otp_required', 'prompt_sent', 'paid', 'failed');

create table public.store_settings (
  key text primary key,
  value text not null
);

insert into public.store_settings (key, value) values
  ('admin_email', 'admin@techverse.store'),
  ('usd_to_ghs', '15.50'),
  ('demo_payments', 'true'),
  ('store_phone_primary', '02562063.83'),
  ('store_phone_secondary', '0553140985'),
  ('store_city', 'Accra'),
  ('store_country', 'Ghana');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text,
  sort_order int not null default 0
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null,
  price_usd numeric(10,2) not null check (price_usd > 0),
  compare_at_usd numeric(10,2),
  category_id uuid references public.categories (id),
  image_url text not null,
  stock int not null default 0 check (stock >= 0),
  likes int not null default 0 check (likes >= 0),
  rating numeric(2,1) not null default 4.8,
  badge text,
  is_trending boolean not null default false,
  is_deal boolean not null default false,
  is_new boolean not null default false,
  sku text unique not null,
  created_at timestamptz not null default now()
);

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  image_url text not null,
  idea_count int not null default 0,
  sort_order int not null default 0
);

create table public.idea_products (
  idea_id uuid references public.ideas (id) on delete cascade,
  product_id uuid references public.products (id) on delete cascade,
  primary key (idea_id, product_id)
);

create sequence public.order_number_seq start 10420;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  order_number text unique not null,
  email text not null,
  phone text not null,
  full_name text not null,
  address_line text not null,
  city text not null,
  region_name text not null,
  country text not null,
  status public.order_status not null default 'pending',
  subtotal_usd numeric(10,2) not null,
  shipping_usd numeric(10,2) not null default 0,
  total_usd numeric(10,2) not null,
  total_ghs numeric(10,2) not null,
  exchange_rate numeric(10,4) not null,
  notes text,
  restocked boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  name text not null,
  unit_price_usd numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  image_url text
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  provider text not null default 'moolre',
  external_ref text unique not null,
  channel text,
  payer text,
  amount_ghs numeric(10,2) not null,
  status public.payment_status not null default 'pending',
  moolre_transaction_id text,
  authorization_url text,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.follows (
  user_id uuid references public.profiles (id) on delete cascade,
  product_id uuid references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.idea_follows (
  user_id uuid references public.profiles (id) on delete cascade,
  idea_id uuid references public.ideas (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, idea_id)
);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

create table public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete cascade,
  channel text not null,
  event text not null,
  recipient text not null,
  status text not null,
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_email text;
begin
  select value into admin_email from public.store_settings where key = 'admin_email';
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'shopper'), '@', 1)),
    new.raw_user_meta_data->>'phone',
    case
      when lower(coalesce(new.email, '')) = lower(coalesce(admin_email, '')) then 'admin'::public.user_role
      else 'customer'::public.user_role
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace view public.public_settings
with (security_invoker = false) as
select key, value
from public.store_settings
where key in ('usd_to_ghs', 'demo_payments', 'store_phone_primary', 'store_phone_secondary', 'store_city', 'store_country');

create or replace function public._fulfill_payment(p_external_ref text, p_transaction_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
  v_item public.order_items%rowtype;
  v_short boolean := false;
begin
  select * into v_payment from public.payments where external_ref = p_external_ref for update;
  if not found then
    raise exception 'Payment not found';
  end if;

  select * into v_order from public.orders where id = v_payment.order_id for update;

  if v_payment.status = 'paid' then
    return jsonb_build_object('fulfilled', false, 'already', true, 'order_id', v_order.id, 'order_number', v_order.order_number);
  end if;

  for v_item in select * from public.order_items where order_id = v_order.id
  loop
    if v_item.product_id is not null then
      update public.products
      set stock = stock - v_item.quantity
      where id = v_item.product_id and stock >= v_item.quantity;
      if not found then
        v_short := true;
      end if;
    end if;
  end loop;

  update public.payments
  set status = 'paid',
      moolre_transaction_id = p_transaction_id,
      updated_at = now()
  where id = v_payment.id;

  update public.orders
  set status = 'paid',
      notes = case
        when v_short then concat_ws(' ', notes, 'Inventory shortfall — review stock.')
        else notes
      end
  where id = v_order.id;

  return jsonb_build_object(
    'fulfilled', true,
    'already', false,
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'email', v_order.email,
    'phone', v_order.phone,
    'full_name', v_order.full_name,
    'total_ghs', v_order.total_ghs,
    'total_usd', v_order.total_usd,
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', name,
        'quantity', quantity,
        'unit_price_usd', unit_price_usd
      )), '[]'::jsonb)
      from public.order_items where order_id = v_order.id
    )
  );
end;
$$;

create or replace function public.place_order(
  p_full_name text,
  p_phone text,
  p_address text,
  p_city text,
  p_region_name text,
  p_country text,
  p_notes text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
  v_subtotal numeric(10,2) := 0;
  v_shipping numeric(10,2);
  v_rate numeric(10,4);
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty int;
  v_ref text;
begin
  if v_user is null then
    raise exception 'Sign in to place an order';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty';
  end if;
  if length(trim(coalesce(p_full_name, ''))) < 2 then
    raise exception 'Enter your full name';
  end if;
  if p_country not in ('Ghana', 'United States', 'United Kingdom', 'United Arab Emirates') then
    raise exception 'Choose a delivery country';
  end if;

  select email into v_email from public.profiles where id = v_user;
  select value::numeric into v_rate from public.store_settings where key = 'usd_to_ghs';
  if v_rate is null or v_rate <= 0 then
    v_rate := 15.50;
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 10 then
      raise exception 'Invalid quantity';
    end if;
    select * into v_product from public.products where id = coalesce(v_item->>'productId', v_item->>'product_id')::uuid for share;
    if not found then
      raise exception 'A product in your cart is no longer available';
    end if;
    if v_product.stock < v_qty then
      raise exception '% does not have enough stock', v_product.name;
    end if;
    v_subtotal := v_subtotal + (v_product.price_usd * v_qty);
  end loop;

  if p_country = 'Ghana' then
    v_shipping := case when v_subtotal >= 75 then 0 else 8 end;
  else
    v_shipping := 25;
  end if;

  v_order_number := 'TV-' || lpad(nextval('public.order_number_seq')::text, 6, '0');
  v_ref := v_order_number || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into public.orders (
    id, user_id, order_number, email, phone, full_name, address_line, city, region_name, country,
    subtotal_usd, shipping_usd, total_usd, total_ghs, exchange_rate, notes
  ) values (
    v_order_id, v_user, v_order_number, v_email, trim(p_phone), trim(p_full_name), trim(p_address),
    trim(p_city), trim(p_region_name), p_country, v_subtotal, v_shipping, v_subtotal + v_shipping,
    round((v_subtotal + v_shipping) * v_rate, 2), v_rate, nullif(trim(coalesce(p_notes, '')), '')
  );

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::int;
    select * into v_product from public.products where id = coalesce(v_item->>'productId', v_item->>'product_id')::uuid;
    insert into public.order_items (order_id, product_id, name, unit_price_usd, quantity, image_url)
    values (v_order_id, v_product.id, v_product.name, v_product.price_usd, v_qty, v_product.image_url);
  end loop;

  insert into public.payments (order_id, external_ref, amount_ghs)
  values (v_order_id, v_ref, round((v_subtotal + v_shipping) * v_rate, 2));

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total_usd', v_subtotal + v_shipping,
    'total_ghs', round((v_subtotal + v_shipping) * v_rate, 2),
    'external_ref', v_ref
  );
end;
$$;

create or replace function public.attach_payment_attempt(
  p_order_id uuid,
  p_channel text,
  p_payer text,
  p_status text,
  p_authorization_url text,
  p_raw jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.payment_status;
begin
  if auth.uid() is null then
    raise exception 'Sign in required';
  end if;
  if not exists (select 1 from public.orders where id = p_order_id and user_id = auth.uid()) then
    raise exception 'Order not found';
  end if;
  if p_status not in ('pending', 'otp_required', 'prompt_sent', 'failed') then
    raise exception 'Invalid payment status';
  end if;
  v_status := p_status::public.payment_status;
  update public.payments
  set channel = coalesce(p_channel, channel),
      payer = coalesce(p_payer, payer),
      status = case when status = 'paid' then status else v_status end,
      authorization_url = coalesce(p_authorization_url, authorization_url),
      raw_response = p_raw,
      updated_at = now()
  where order_id = p_order_id and status <> 'paid';
end;
$$;

create or replace function public.finalize_payment(
  p_external_ref text,
  p_transaction_id text,
  p_action_secret text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
begin
  select value into v_secret from public.store_settings where key = 'action_secret';
  if v_secret is null or p_action_secret is distinct from v_secret then
    raise exception 'Unauthorized';
  end if;
  return public._fulfill_payment(p_external_ref, p_transaction_id);
end;
$$;

create or replace function public.apply_moolre_callback(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
  v_given text;
  v_code text;
  v_tx text;
  v_ref text;
  v_amount numeric;
  v_expected numeric;
  v_txn text;
begin
  select value into v_secret from public.store_settings where key = 'moolre_callback_secret';
  v_given := p_payload #>> '{data,secret}';
  if v_secret is null or v_given is null or v_given is distinct from v_secret then
    raise exception 'Invalid callback';
  end if;

  v_code := p_payload->>'code';
  v_tx := p_payload #>> '{data,txstatus}';
  v_ref := p_payload #>> '{data,externalref}';
  v_txn := p_payload #>> '{data,transactionid}';

  if v_ref is null then
    raise exception 'Missing reference';
  end if;

  if p_payload->>'status' = '1' and v_code = 'P01' and v_tx = '1' then
    begin
      v_amount := (p_payload #>> '{data,amount}')::numeric;
    exception when others then
      v_amount := null;
    end;
    select amount_ghs into v_expected from public.payments where external_ref = v_ref;
    if v_amount is not null and v_amount > 0 and v_expected is not null and abs(v_amount - v_expected) > 1 then
      raise exception 'Amount mismatch';
    end if;
    return public._fulfill_payment(v_ref, v_txn);
  end if;

  if v_code = 'P02' or v_tx = '2' then
    update public.payments
    set status = 'failed', raw_response = p_payload, updated_at = now()
    where external_ref = v_ref and status <> 'paid';
    update public.orders o
    set status = 'failed'
    from public.payments p
    where p.external_ref = v_ref and p.order_id = o.id and o.status = 'pending';
    return jsonb_build_object('fulfilled', false, 'failed', true);
  end if;

  return jsonb_build_object('fulfilled', false, 'pending', true);
end;
$$;

create or replace function public.demo_complete_payment(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text;
begin
  if auth.uid() is null then
    raise exception 'Sign in required';
  end if;
  if coalesce((select value from public.store_settings where key = 'demo_payments'), 'false') <> 'true' then
    raise exception 'Demo payments are turned off';
  end if;
  select p.external_ref into v_ref
  from public.payments p
  join public.orders o on o.id = p.order_id
  where o.id = p_order_id and o.user_id = auth.uid();
  if v_ref is null then
    raise exception 'Order not found';
  end if;
  return public._fulfill_payment(v_ref, 'DEMO-' || substr(v_ref, 1, 12));
end;
$$;

create or replace function public.toggle_follow(p_product_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Sign in to save gadgets';
  end if;
  if exists (select 1 from public.follows where user_id = v_user and product_id = p_product_id) then
    delete from public.follows where user_id = v_user and product_id = p_product_id;
    update public.products set likes = greatest(likes - 1, 0) where id = p_product_id;
    return false;
  end if;
  insert into public.follows (user_id, product_id) values (v_user, p_product_id);
  update public.products set likes = likes + 1 where id = p_product_id;
  return true;
end;
$$;

create or replace function public.toggle_idea_follow(p_idea_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Sign in to follow a board';
  end if;
  if exists (select 1 from public.idea_follows where user_id = v_user and idea_id = p_idea_id) then
    delete from public.idea_follows where user_id = v_user and idea_id = p_idea_id;
    return false;
  end if;
  insert into public.idea_follows (user_id, idea_id) values (v_user, p_idea_id);
  return true;
end;
$$;

create or replace function public.subscribe_newsletter(p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email';
  end if;
  insert into public.newsletter_subscribers (email) values (lower(trim(p_email)));
  return 'subscribed';
exception
  when unique_violation then
    return 'exists';
end;
$$;

create or replace function public.set_demo_payments(p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;
  update public.store_settings
  set value = case when p_enabled then 'true' else 'false' end
  where key = 'demo_payments';
end;
$$;

create or replace function public.update_exchange_rate(p_rate numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;
  if p_rate < 1 or p_rate > 100 then
    raise exception 'Rate must be between 1 and 100';
  end if;
  update public.store_settings set value = trim(to_char(p_rate, 'FM999990.00')) where key = 'usd_to_ghs';
end;
$$;

create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item public.order_items%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;
  if v_order.status in ('paid', 'processing', 'shipped', 'delivered') and not v_order.restocked then
    for v_item in select * from public.order_items where order_id = v_order.id
    loop
      if v_item.product_id is not null then
        update public.products set stock = stock + v_item.quantity where id = v_item.product_id;
      end if;
    end loop;
    update public.orders set restocked = true where id = v_order.id;
  end if;
  update public.orders set status = 'cancelled' where id = p_order_id;
end;
$$;

create or replace function public.record_notification(
  p_secret text,
  p_order_id uuid,
  p_channel text,
  p_event text,
  p_recipient text,
  p_status text,
  p_provider_id text,
  p_error text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
begin
  select value into v_secret from public.store_settings where key = 'action_secret';
  if v_secret is null or p_secret is distinct from v_secret then
    raise exception 'Unauthorized';
  end if;
  insert into public.notifications_log (order_id, channel, event, recipient, status, provider_id, error)
  values (p_order_id, p_channel, p_event, p_recipient, p_status, p_provider_id, p_error);
end;
$$;

revoke all on function public._fulfill_payment(text, text) from public, anon, authenticated;
revoke all on function public.place_order(text, text, text, text, text, text, text, jsonb) from public, anon;
revoke all on function public.attach_payment_attempt(uuid, text, text, text, text, jsonb) from public, anon;
revoke all on function public.finalize_payment(text, text, text) from public;
revoke all on function public.apply_moolre_callback(jsonb) from public;
revoke all on function public.demo_complete_payment(uuid) from public, anon;
revoke all on function public.toggle_follow(uuid) from public, anon;
revoke all on function public.toggle_idea_follow(uuid) from public, anon;
revoke all on function public.subscribe_newsletter(text) from public;
revoke all on function public.set_demo_payments(boolean) from public, anon;
revoke all on function public.update_exchange_rate(numeric) from public, anon;
revoke all on function public.cancel_order(uuid) from public, anon;
revoke all on function public.record_notification(text, uuid, text, text, text, text, text, text) from public;
revoke all on sequence public.order_number_seq from public, anon, authenticated;

grant execute on function public.place_order(text, text, text, text, text, text, text, jsonb) to authenticated;
grant execute on function public.attach_payment_attempt(uuid, text, text, text, text, jsonb) to authenticated;
grant execute on function public.finalize_payment(text, text, text) to anon, authenticated;
grant execute on function public.apply_moolre_callback(jsonb) to anon, authenticated;
grant execute on function public.demo_complete_payment(uuid) to authenticated;
grant execute on function public.toggle_follow(uuid) to authenticated;
grant execute on function public.toggle_idea_follow(uuid) to authenticated;
grant execute on function public.subscribe_newsletter(text) to anon, authenticated;
grant execute on function public.set_demo_payments(boolean) to authenticated;
grant execute on function public.update_exchange_rate(numeric) to authenticated;
grant execute on function public.cancel_order(uuid) to authenticated;
grant execute on function public.record_notification(text, uuid, text, text, text, text, text, text) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.ideas enable row level security;
alter table public.idea_products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.follows enable row level security;
alter table public.idea_follows enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.notifications_log enable row level security;
alter table public.store_settings enable row level security;

create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_user_role());

create policy categories_read on public.categories for select using (true);
create policy categories_admin on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy products_read on public.products for select using (true);
create policy products_admin_write on public.products for insert to authenticated
  with check (public.is_admin());
create policy products_admin_update on public.products for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy products_admin_delete on public.products for delete to authenticated
  using (public.is_admin());

create policy ideas_read on public.ideas for select using (true);
create policy ideas_admin on public.ideas for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy idea_products_read on public.idea_products for select using (true);
create policy idea_products_admin on public.idea_products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy orders_select on public.orders for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy orders_admin_update on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy order_items_select on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

create policy payments_select on public.payments for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

create policy follows_select on public.follows for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy idea_follows_select on public.idea_follows for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy newsletter_admin on public.newsletter_subscribers for select to authenticated
  using (public.is_admin());
create policy notifications_admin on public.notifications_log for select to authenticated
  using (public.is_admin());

grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
grant select on public.categories, public.products, public.ideas, public.idea_products to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.ideas, public.idea_products to authenticated;
grant select on public.orders, public.order_items, public.payments to authenticated;
grant update on public.orders to authenticated;
grant select on public.follows, public.idea_follows to authenticated;
grant select on public.newsletter_subscribers, public.notifications_log to authenticated;
grant select on public.public_settings to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set public = true, file_size_limit = 5242880;

create policy product_images_read on storage.objects
  for select to public
  using (bucket_id = 'product-images');
create policy product_images_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
create policy product_images_update on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
create policy product_images_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
