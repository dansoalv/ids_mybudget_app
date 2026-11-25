drop trigger if exists monthly_budgets_require_paid_access on public.monthly_budgets;
drop function if exists public.update_shared_expense(uuid, text, text, bigint, uuid, jsonb);

create function public.update_shared_expense(
  p_transaction_id uuid,
  p_group_id uuid,
  p_title text,
  p_category text,
  p_amount_cents bigint,
  p_paid_by uuid,
  p_splits jsonb,
  p_occurred_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.transactions%rowtype;
  split_total bigint;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select t.* into target
  from public.transactions t
  where t.id = p_transaction_id
    and t.group_id = p_group_id
    and t.kind = 'expense'
  for update;

  if target.id is null then
    raise exception 'Shared expense not found';
  end if;

  if target.created_by <> auth.uid() and not private.is_group_admin(p_group_id, auth.uid()) then
    raise exception 'Not authorized to edit this expense';
  end if;

  if char_length(trim(p_title)) not between 2 and 120
    or p_category not in ('food', 'home', 'transport', 'entertainment', 'other')
    or p_amount_cents <= 0 then
    raise exception 'Invalid expense data';
  end if;

  if not private.is_group_member(p_group_id, p_paid_by) then
    raise exception 'Payer must be a group member';
  end if;

  if jsonb_typeof(p_splits) <> 'array' or jsonb_array_length(p_splits) = 0 then
    raise exception 'At least one split is required';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_splits) as split(user_id uuid, amount_cents bigint)
    where split.amount_cents <= 0 or not private.is_group_member(p_group_id, split.user_id)
  ) then
    raise exception 'Every split must reference a group member and a positive amount';
  end if;

  select sum(split.amount_cents)
  into split_total
  from jsonb_to_recordset(p_splits) as split(user_id uuid, amount_cents bigint);

  if split_total <> p_amount_cents then
    raise exception 'Split total must equal expense amount';
  end if;

  update public.transactions
  set title = trim(p_title),
      category = p_category,
      amount_cents = p_amount_cents,
      paid_by = p_paid_by,
      occurred_at = p_occurred_at
  where id = p_transaction_id;

  delete from public.expense_splits
  where transaction_id = p_transaction_id;

  insert into public.expense_splits (transaction_id, user_id, amount_cents)
  select p_transaction_id, split.user_id, split.amount_cents
  from jsonb_to_recordset(p_splits) as split(user_id uuid, amount_cents bigint);

  return p_transaction_id;
end;
$$;

revoke all on function public.update_shared_expense(uuid, uuid, text, text, bigint, uuid, jsonb, timestamptz) from public;
grant execute on function public.update_shared_expense(uuid, uuid, text, text, bigint, uuid, jsonb, timestamptz) to authenticated;
