create function private.enforce_group_update_permissions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'Group ownership cannot be reassigned';
  end if;

  if not private.has_paid_access(auth.uid()) and (
    new.kind is distinct from old.kind
    or new.currency is distinct from old.currency
    or new.archived_at is distinct from old.archived_at
  ) then
    raise exception using errcode = 'P0001', message = 'FREE_GROUP_RENAME_ONLY';
  end if;

  return new;
end;
$$;
create trigger groups_enforce_update_permissions
before update on public.groups
for each row execute function private.enforce_group_update_permissions();
drop policy "Owners delete groups" on public.groups;
create policy "Paid owners delete groups"
on public.groups for delete
to authenticated
using (
  owner_id = (select auth.uid())
  and private.has_paid_access((select auth.uid()))
);
drop policy "Creators and admins update transactions" on public.transactions;
create policy "Users update permitted transactions"
on public.transactions for update
to authenticated
using (
  (group_id is null and owner_id = (select auth.uid()))
  or
  (
    group_id is not null
    and private.has_paid_access((select auth.uid()))
    and (created_by = (select auth.uid()) or private.is_group_admin(group_id, (select auth.uid())))
  )
)
with check (
  (group_id is null and owner_id = (select auth.uid()))
  or
  (
    group_id is not null
    and private.has_paid_access((select auth.uid()))
    and (created_by = (select auth.uid()) or private.is_group_admin(group_id, (select auth.uid())))
  )
);
create function public.update_shared_expense(
  p_transaction_id uuid,
  p_title text,
  p_category text,
  p_amount_cents bigint,
  p_paid_by uuid,
  p_splits jsonb
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  target_group_id uuid;
  split_total bigint;
begin
  if auth.uid() is null or not private.has_paid_access(auth.uid()) then
    raise exception using errcode = 'P0001', message = 'PLUS_REQUIRED';
  end if;

  select t.group_id
  into target_group_id
  from public.transactions t
  where t.id = p_transaction_id and t.kind = 'expense';

  if target_group_id is null or not private.can_manage_transaction(p_transaction_id, auth.uid()) then
    raise exception 'Not authorized for this expense';
  end if;

  if char_length(trim(p_title)) not between 2 and 120
    or p_category not in ('food', 'home', 'transport', 'entertainment', 'other')
    or p_amount_cents <= 0 then
    raise exception 'Invalid expense data';
  end if;

  if not private.is_group_member(target_group_id, p_paid_by) then
    raise exception 'Payer must be a group member';
  end if;

  if jsonb_typeof(p_splits) <> 'array' or jsonb_array_length(p_splits) = 0 then
    raise exception 'At least one split is required';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_splits) as split(user_id uuid, amount_cents bigint)
    where split.amount_cents <= 0 or not private.is_group_member(target_group_id, split.user_id)
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
      paid_by = p_paid_by
  where id = p_transaction_id;

  delete from public.expense_splits where transaction_id = p_transaction_id;
  insert into public.expense_splits (transaction_id, user_id, amount_cents)
  select p_transaction_id, split.user_id, split.amount_cents
  from jsonb_to_recordset(p_splits) as split(user_id uuid, amount_cents bigint);

  return p_transaction_id;
end;
$$;
revoke all on function private.enforce_group_update_permissions() from public;
revoke all on function public.update_shared_expense(uuid, text, text, bigint, uuid, jsonb) from public;
grant execute on function public.update_shared_expense(uuid, text, text, bigint, uuid, jsonb) to authenticated;
