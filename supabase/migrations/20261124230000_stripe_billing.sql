alter type public.subscription_status add value if not exists 'trialing';
alter type public.subscription_status add value if not exists 'incomplete';
alter type public.subscription_status add value if not exists 'unpaid';
alter type public.subscription_status add value if not exists 'paused';

create type public.billing_interval as enum ('month', 'year');

alter table public.subscriptions
  add column stripe_customer_id text,
  add column stripe_subscription_id text,
  add column stripe_price_id text,
  add column billing_interval public.billing_interval,
  add column current_period_starts_at timestamptz,
  add column trial_ends_at timestamptz,
  add column trial_used_at timestamptz,
  add column grace_period_ends_at timestamptz,
  add column cancel_at_period_end boolean not null default false;

create unique index subscriptions_stripe_customer_id_key
on public.subscriptions (stripe_customer_id)
where stripe_customer_id is not null;

create unique index subscriptions_stripe_subscription_id_key
on public.subscriptions (stripe_subscription_id)
where stripe_subscription_id is not null;

create table public.stripe_events (
  event_id text primary key,
  event_type text not null,
  livemode boolean not null,
  api_version text,
  event_created_at timestamptz not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
revoke all on table public.stripe_events from anon, authenticated;

create or replace function private.enforce_group_subscription_limit()
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
  where s.user_id = new.owner_id
    and (
      s.status::text in ('active', 'trialing')
      or (
        s.status::text = 'past_due'
        and s.grace_period_ends_at is not null
        and s.grace_period_ends_at > now()
      )
    );

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

revoke all on function private.enforce_group_subscription_limit() from public;

