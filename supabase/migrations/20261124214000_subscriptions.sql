create type public.subscription_plan as enum ('free', 'plus', 'family');
create type public.subscription_status as enum ('active', 'past_due', 'canceled');

create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan public.subscription_plan not null default 'free',
  status public.subscription_status not null default 'active',
  current_period_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.subscriptions (user_id, plan, status)
select p.id, 'free', 'active'
from public.profiles p
on conflict (user_id) do nothing;

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1), 'Usuario')
  );

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active');

  return new;
end;
$$;

create function private.enforce_group_subscription_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_plan public.subscription_plan := 'free';
  active_owned_groups integer;
begin
  select s.plan
  into current_plan
  from public.subscriptions s
  where s.user_id = new.owner_id and s.status = 'active';

  current_plan := coalesce(current_plan, 'free');

  if current_plan = 'free' then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(new.owner_id::text, 0)
    );

    select count(*)::integer
    into active_owned_groups
    from public.groups g
    where g.owner_id = new.owner_id and g.archived_at is null;

    if active_owned_groups >= 1 then
      raise exception using
        errcode = 'P0001',
        message = 'FREE_GROUP_LIMIT';
    end if;
  end if;

  return new;
end;
$$;

create trigger groups_enforce_subscription_limit
before insert on public.groups
for each row execute function private.enforce_group_subscription_limit();

alter table public.subscriptions enable row level security;

revoke all on table public.subscriptions from anon, authenticated;
grant select on table public.subscriptions to authenticated;

create policy "Users read their own subscription"
on public.subscriptions for select
to authenticated
using (user_id = (select auth.uid()));

revoke all on function private.enforce_group_subscription_limit() from public;
