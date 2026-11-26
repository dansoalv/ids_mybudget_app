create or replace function private.validate_expense_splits()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_transaction_id uuid;
  transaction_total bigint;
  split_total bigint;
  transaction_group_id uuid;
  transaction_kind public.transaction_kind;
begin
  target_transaction_id := coalesce(new.transaction_id, old.transaction_id);

  select t.amount_cents, t.group_id, t.kind
  into transaction_total, transaction_group_id, transaction_kind
  from public.transactions t
  where t.id = target_transaction_id;

  -- Cascading deletion removes the parent transaction before this deferred
  -- constraint trigger runs. There is nothing left to validate in that case.
  if not found then
    return null;
  end if;

  if transaction_kind <> 'expense' or transaction_group_id is null then
    raise exception 'Only shared expenses can have splits';
  end if;

  select coalesce(sum(es.amount_cents), 0)
  into split_total
  from public.expense_splits es
  where es.transaction_id = target_transaction_id;

  if split_total <> transaction_total then
    raise exception 'Expense splits (%) must equal transaction amount (%)', split_total, transaction_total;
  end if;

  return null;
end;
$$;
