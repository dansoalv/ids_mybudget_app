alter table public.recurring_transactions
  add column day_of_month integer;

update public.recurring_transactions
set day_of_month = extract(day from next_run_on)::integer
where frequency = 'monthly';

alter table public.recurring_transactions
  add constraint recurring_transactions_schedule_day_check check (
    (frequency = 'weekly' and day_of_month is null)
    or
    (frequency = 'monthly' and day_of_month between 1 and 31)
  );

create function private.advance_recurrence_date(
  p_date date,
  p_frequency public.recurrence_frequency,
  p_day_of_month integer
)
returns date
language sql
immutable
set search_path = ''
as $$
  with target_month as (
    select (date_trunc('month', p_date)::date + interval '1 month')::date as first_day
  )
  select case p_frequency
    when 'weekly' then p_date + 7
    when 'monthly' then first_day + (
      least(
        p_day_of_month,
        extract(day from (first_day + interval '1 month - 1 day'))::integer
      ) - 1
    )
  end
  from target_month;
$$;

create or replace function public.materialize_due_recurring_transactions()
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
        occurrence_date + time '12:00',
        rule.id,
        occurrence_date
      )
      on conflict (recurring_transaction_id, recurrence_date)
      where recurring_transaction_id is not null
      do nothing;

      if found then
        generated_count := generated_count + 1;
      end if;

      occurrence_date := private.advance_recurrence_date(
        occurrence_date,
        rule.frequency,
        rule.day_of_month
      );
      iteration_count := iteration_count + 1;
    end loop;

    update public.recurring_transactions
    set next_run_on = occurrence_date
    where id = rule.id;
  end loop;

  return generated_count;
end;
$$;

revoke all on function private.advance_recurrence_date(date, public.recurrence_frequency, integer) from public;
