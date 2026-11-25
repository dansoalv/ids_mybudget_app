create type public.recurrence_frequency as enum ('weekly', 'monthly');

create table public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null check (month = date_trunc('month', month)::date),
  category text not null check (category in ('food', 'home', 'transport', 'entertainment', 'other')),
  limit_cents bigint not null check (limit_cents > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month, category)
);

create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.transaction_kind not null,
  title text not null check (char_length(title) between 2 and 120),
  category text not null check (category in ('food', 'home', 'transport', 'entertainment', 'salary', 'other')),
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'MXN' check (currency ~ '^[A-Z]{3}$'),
  frequency public.recurrence_frequency not null,
  next_run_on date not null,
  reminder_days_before integer not null default 1 check (reminder_days_before between 0 and 30),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions
  add column recurring_transaction_id uuid references public.recurring_transactions(id) on delete set null,
  add column recurrence_date date;

alter table public.transactions
  add constraint transactions_recurrence_pair_check check (
    (recurring_transaction_id is null and recurrence_date is null)
    or
    (recurring_transaction_id is not null and recurrence_date is not null)
  );

create unique index transactions_recurrence_occurrence_key
on public.transactions (recurring_transaction_id, recurrence_date)
where recurring_transaction_id is not null;

create index monthly_budgets_user_month_idx on public.monthly_budgets(user_id, month);
create index recurring_transactions_user_next_idx on public.recurring_transactions(user_id, next_run_on) where active;

create function private.has_paid_access(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = p_user_id
      and s.plan in ('plus', 'family')
      and (
        s.status::text in ('active', 'trialing')
        or (
          s.status::text = 'past_due'
          and s.grace_period_ends_at is not null
          and s.grace_period_ends_at > now()
        )
      )
  );
$$;

create function private.enforce_paid_feature()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or new.user_id <> auth.uid() or not private.has_paid_access(new.user_id) then
    raise exception using errcode = 'P0001', message = 'PLUS_REQUIRED';
  end if;

  return new;
end;
$$;

create trigger monthly_budgets_set_updated_at
before update on public.monthly_budgets
for each row execute function private.set_updated_at();

create trigger recurring_transactions_set_updated_at
before update on public.recurring_transactions
for each row execute function private.set_updated_at();

create trigger monthly_budgets_require_paid_access
before insert or update on public.monthly_budgets
for each row execute function private.enforce_paid_feature();

create trigger recurring_transactions_require_paid_access
before insert or update on public.recurring_transactions
for each row execute function private.enforce_paid_feature();

create function public.materialize_due_recurring_transactions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  rule public.recurring_transactions%rowtype;
  occurrence_date date;
  generated_count integer := 0;
  iteration_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not private.has_paid_access(auth.uid()) then
    return 0;
  end if;

  for rule in
    select rt.*
    from public.recurring_transactions rt
    where rt.user_id = auth.uid()
      and rt.active
      and rt.next_run_on <= current_date
    for update
  loop
    occurrence_date := rule.next_run_on;
    iteration_count := 0;

    while occurrence_date <= current_date and iteration_count < 60 loop
      insert into public.transactions (
        owner_id,
        created_by,
        kind,
        title,
        category,
        amount_cents,
        currency,
        occurred_at,
        recurring_transaction_id,
        recurrence_date
      ) values (
        rule.user_id,
        rule.user_id,
        rule.kind,
        rule.title,
        rule.category,
        rule.amount_cents,
        rule.currency,
        occurrence_date::timestamptz,
        rule.id,
        occurrence_date
      )
      on conflict (recurring_transaction_id, recurrence_date)
      where recurring_transaction_id is not null
      do nothing;

      if found then
        generated_count := generated_count + 1;
      end if;

      occurrence_date := case rule.frequency
        when 'weekly' then occurrence_date + 7
        when 'monthly' then (occurrence_date + interval '1 month')::date
      end;
      iteration_count := iteration_count + 1;
    end loop;

    update public.recurring_transactions
    set next_run_on = occurrence_date
    where id = rule.id;
  end loop;

  return generated_count;
end;
$$;

alter table public.monthly_budgets enable row level security;
alter table public.recurring_transactions enable row level security;

revoke all on table public.monthly_budgets from anon, authenticated;
revoke all on table public.recurring_transactions from anon, authenticated;
grant select, insert, update, delete on table public.monthly_budgets to authenticated;
grant select, insert, update, delete on table public.recurring_transactions to authenticated;

create policy "Users read their own monthly budgets"
on public.monthly_budgets for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users create their own monthly budgets"
on public.monthly_budgets for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Users update their own monthly budgets"
on public.monthly_budgets for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users delete their own monthly budgets"
on public.monthly_budgets for delete
to authenticated
using (user_id = (select auth.uid()));

create policy "Users read their own recurring transactions"
on public.recurring_transactions for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users create their own recurring transactions"
on public.recurring_transactions for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Users update their own recurring transactions"
on public.recurring_transactions for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users delete their own recurring transactions"
on public.recurring_transactions for delete
to authenticated
using (user_id = (select auth.uid()));

revoke all on function private.has_paid_access(uuid) from public;
revoke all on function private.enforce_paid_feature() from public;
revoke all on function public.materialize_due_recurring_transactions() from public;
grant execute on function private.has_paid_access(uuid) to authenticated;
grant execute on function public.materialize_due_recurring_transactions() to authenticated;
