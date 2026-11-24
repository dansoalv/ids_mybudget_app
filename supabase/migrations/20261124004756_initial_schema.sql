create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

create schema if not exists private;
revoke all on schema private from public;

create type public.group_kind as enum ('household', 'trip', 'friends', 'other');
create type public.group_role as enum ('owner', 'admin', 'member');
create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');
create type public.transaction_kind as enum ('income', 'expense');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80),
  avatar_url text,
  default_currency text not null default 'MXN' check (default_currency ~ '^[A-Z]{3}$'),
  locale text not null default 'es-MX',
  timezone text not null default 'America/Mexico_City',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 80),
  kind public.group_kind not null default 'household',
  currency text not null default 'MXN' check (currency ~ '^[A-Z]{3}$'),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.group_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.group_invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  email extensions.citext,
  token_hash text not null unique check (char_length(token_hash) = 64),
  role public.group_role not null default 'member' check (role <> 'owner'),
  status public.invitation_status not null default 'pending',
  invited_by uuid not null references auth.users(id) on delete cascade,
  accepted_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  paid_by uuid references auth.users(id) on delete restrict,
  kind public.transaction_kind not null,
  title text not null check (char_length(title) between 2 and 120),
  category text not null check (category in ('food', 'home', 'transport', 'entertainment', 'salary', 'other')),
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'MXN' check (currency ~ '^[A-Z]{3}$'),
  notes text check (notes is null or char_length(notes) <= 500),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_scope_check check (
    (group_id is null and owner_id is not null and paid_by is null)
    or
    (group_id is not null and owner_id is null and paid_by is not null)
  )
);

create table public.expense_splits (
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  amount_cents bigint not null check (amount_cents > 0),
  created_at timestamptz not null default now(),
  primary key (transaction_id, user_id)
);

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  payer_id uuid not null references auth.users(id) on delete restrict,
  payee_id uuid not null references auth.users(id) on delete restrict,
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'MXN' check (currency ~ '^[A-Z]{3}$'),
  note text check (note is null or char_length(note) <= 300),
  settled_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint settlements_different_parties_check check (payer_id <> payee_id)
);

create index profiles_display_name_idx on public.profiles(display_name);
create index groups_owner_id_idx on public.groups(owner_id);
create index group_members_user_id_idx on public.group_members(user_id);
create index group_invitations_group_id_idx on public.group_invitations(group_id);
create index group_invitations_email_idx on public.group_invitations(email);
create index group_invitations_status_expires_idx on public.group_invitations(status, expires_at);
create index transactions_owner_date_idx on public.transactions(owner_id, occurred_at desc) where group_id is null;
create index transactions_group_date_idx on public.transactions(group_id, occurred_at desc) where group_id is not null;
create index transactions_created_by_idx on public.transactions(created_by);
create index transactions_paid_by_idx on public.transactions(paid_by) where paid_by is not null;
create index expense_splits_user_id_idx on public.expense_splits(user_id);
create index settlements_group_date_idx on public.settlements(group_id, settled_at desc);
create index settlements_payer_id_idx on public.settlements(payer_id);
create index settlements_payee_id_idx on public.settlements(payee_id);

create function private.is_group_member(p_group_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = p_user_id
  );
$$;

create function private.is_group_admin(p_group_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = p_user_id
      and gm.role in ('owner', 'admin')
  );
$$;

create function private.is_group_owner(p_group_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.groups g
    where g.id = p_group_id and g.owner_id = p_user_id
  );
$$;

create function private.shares_group(p_other_user_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members mine
    join public.group_members theirs on theirs.group_id = mine.group_id
    where mine.user_id = p_user_id and theirs.user_id = p_other_user_id
  );
$$;

create function private.can_view_transaction(p_transaction_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.transactions t
    where t.id = p_transaction_id
      and (
        (t.group_id is null and t.owner_id = p_user_id)
        or
        (t.group_id is not null and private.is_group_member(t.group_id, p_user_id))
      )
  );
$$;

create function private.can_manage_transaction(p_transaction_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.transactions t
    where t.id = p_transaction_id
      and (
        (t.group_id is null and t.owner_id = p_user_id)
        or
        (t.group_id is not null and (t.created_by = p_user_id or private.is_group_admin(t.group_id, p_user_id)))
      )
  );
$$;

revoke all on all functions in schema private from public;
grant usage on schema private to authenticated;
grant execute on function private.is_group_member(uuid, uuid) to authenticated;
grant execute on function private.is_group_admin(uuid, uuid) to authenticated;
grant execute on function private.is_group_owner(uuid, uuid) to authenticated;
grant execute on function private.shares_group(uuid, uuid) to authenticated;
grant execute on function private.can_view_transaction(uuid, uuid) to authenticated;
grant execute on function private.can_manage_transaction(uuid, uuid) to authenticated;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function private.handle_new_user()
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
  return new;
end;
$$;

create function private.add_group_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create function private.prevent_transaction_reassignment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.owner_id is distinct from old.owner_id
    or new.group_id is distinct from old.group_id
    or new.created_by is distinct from old.created_by
    or new.currency is distinct from old.currency then
    raise exception 'Transaction ownership and currency cannot be reassigned';
  end if;
  return new;
end;
$$;

create function private.prevent_settlement_reassignment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.group_id is distinct from old.group_id
    or new.payer_id is distinct from old.payer_id
    or new.payee_id is distinct from old.payee_id
    or new.created_by is distinct from old.created_by
    or new.currency is distinct from old.currency then
    raise exception 'Settlement parties and currency cannot be reassigned';
  end if;
  return new;
end;
$$;

create function private.validate_expense_splits()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_transaction_id uuid;
  transaction_total bigint;
  split_total bigint;
  transaction_group_id uuid;
begin
  target_transaction_id := coalesce(new.transaction_id, old.transaction_id);

  select t.amount_cents, t.group_id
  into transaction_total, transaction_group_id
  from public.transactions t
  where t.id = target_transaction_id and t.kind = 'expense';

  if transaction_group_id is null then
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

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger groups_set_updated_at
before update on public.groups
for each row execute function private.set_updated_at();

create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function private.set_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create trigger on_group_created
after insert on public.groups
for each row execute function private.add_group_owner();

create trigger transactions_prevent_reassignment
before update on public.transactions
for each row execute function private.prevent_transaction_reassignment();

create trigger settlements_prevent_reassignment
before update on public.settlements
for each row execute function private.prevent_settlement_reassignment();

create constraint trigger expense_splits_match_total
after insert or update or delete on public.expense_splits
deferrable initially deferred
for each row execute function private.validate_expense_splits();

create function public.create_shared_expense(
  p_group_id uuid,
  p_title text,
  p_category text,
  p_amount_cents bigint,
  p_paid_by uuid,
  p_splits jsonb,
  p_occurred_at timestamptz default now(),
  p_notes text default null,
  p_client_id uuid default gen_random_uuid()
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  new_transaction_id uuid;
  group_currency text;
  split_total bigint;
begin
  if auth.uid() is null or not private.is_group_member(p_group_id, auth.uid()) then
    raise exception 'Not authorized for this group';
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

  select g.currency into group_currency
  from public.groups g
  where g.id = p_group_id;

  insert into public.transactions (
    id,
    group_id,
    created_by,
    paid_by,
    kind,
    title,
    category,
    amount_cents,
    currency,
    notes,
    occurred_at
  ) values (
    p_client_id,
    p_group_id,
    auth.uid(),
    p_paid_by,
    'expense',
    p_title,
    p_category,
    p_amount_cents,
    group_currency,
    p_notes,
    p_occurred_at
  ) returning id into new_transaction_id;

  insert into public.expense_splits (transaction_id, user_id, amount_cents)
  select new_transaction_id, split.user_id, split.amount_cents
  from jsonb_to_recordset(p_splits) as split(user_id uuid, amount_cents bigint);

  return new_transaction_id;
end;
$$;

create function public.accept_group_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.group_invitations%rowtype;
  current_email text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  current_email := auth.jwt() ->> 'email';

  select gi.* into invitation
  from public.group_invitations gi
  where gi.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and gi.status = 'pending'
    and gi.expires_at > now()
    and (gi.email is null or lower(gi.email::text) = lower(current_email))
  for update;

  if invitation.id is null then
    raise exception 'Invitation is invalid, expired, or belongs to another email';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (invitation.group_id, auth.uid(), invitation.role)
  on conflict (group_id, user_id) do update set role = excluded.role;

  update public.group_invitations
  set status = 'accepted', accepted_by = auth.uid(), accepted_at = now()
  where id = invitation.id;

  return invitation.group_id;
end;
$$;

revoke all on function public.create_shared_expense(uuid, text, text, bigint, uuid, jsonb, timestamptz, text, uuid) from public;
revoke all on function public.accept_group_invitation(text) from public;
grant execute on function public.create_shared_expense(uuid, text, text, bigint, uuid, jsonb, timestamptz, text, uuid) to authenticated;
grant execute on function public.accept_group_invitation(text) to authenticated;

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invitations enable row level security;
alter table public.transactions enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.groups from anon, authenticated;
revoke all on table public.group_members from anon, authenticated;
revoke all on table public.group_invitations from anon, authenticated;
revoke all on table public.transactions from anon, authenticated;
revoke all on table public.expense_splits from anon, authenticated;
revoke all on table public.settlements from anon, authenticated;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.groups to authenticated;
grant select, update, delete on table public.group_members to authenticated;
grant select, insert, update, delete on table public.group_invitations to authenticated;
grant select, insert, update, delete on table public.transactions to authenticated;
grant select, insert, update, delete on table public.expense_splits to authenticated;
grant select, insert, update, delete on table public.settlements to authenticated;

create policy "Profiles are visible to self and group peers"
on public.profiles for select
to authenticated
using (id = (select auth.uid()) or private.shares_group(id, (select auth.uid())));

create policy "Users update their own profile"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "Members read their groups"
on public.groups for select
to authenticated
using (private.is_group_member(id, (select auth.uid())));

create policy "Users create groups they own"
on public.groups for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "Admins update groups"
on public.groups for update
to authenticated
using (private.is_group_admin(id, (select auth.uid())))
with check (private.is_group_admin(id, (select auth.uid())));

create policy "Owners delete groups"
on public.groups for delete
to authenticated
using (owner_id = (select auth.uid()));

create policy "Members read group memberships"
on public.group_members for select
to authenticated
using (private.is_group_member(group_id, (select auth.uid())));

create policy "Owners update group memberships"
on public.group_members for update
to authenticated
using (private.is_group_owner(group_id, (select auth.uid())) and role <> 'owner')
with check (private.is_group_owner(group_id, (select auth.uid())) and role <> 'owner');

create policy "Owners remove group members"
on public.group_members for delete
to authenticated
using (private.is_group_owner(group_id, (select auth.uid())) and role <> 'owner');

create policy "Admins and invitees read invitations"
on public.group_invitations for select
to authenticated
using (
  private.is_group_admin(group_id, (select auth.uid()))
  or (email is not null and lower(email::text) = lower((select auth.jwt() ->> 'email')))
);

create policy "Admins create invitations"
on public.group_invitations for insert
to authenticated
with check (private.is_group_admin(group_id, (select auth.uid())) and invited_by = (select auth.uid()));

create policy "Admins update invitations"
on public.group_invitations for update
to authenticated
using (private.is_group_admin(group_id, (select auth.uid())))
with check (private.is_group_admin(group_id, (select auth.uid())));

create policy "Admins delete invitations"
on public.group_invitations for delete
to authenticated
using (private.is_group_admin(group_id, (select auth.uid())));

create policy "Users read accessible transactions"
on public.transactions for select
to authenticated
using (
  (group_id is null and owner_id = (select auth.uid()))
  or
  (group_id is not null and private.is_group_member(group_id, (select auth.uid())))
);

create policy "Users create accessible transactions"
on public.transactions for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (
    (group_id is null and owner_id = (select auth.uid()) and paid_by is null)
    or
    (group_id is not null and owner_id is null and private.is_group_member(group_id, (select auth.uid())) and private.is_group_member(group_id, paid_by))
  )
);

create policy "Creators and admins update transactions"
on public.transactions for update
to authenticated
using (
  (group_id is null and owner_id = (select auth.uid()))
  or
  (group_id is not null and (created_by = (select auth.uid()) or private.is_group_admin(group_id, (select auth.uid()))))
)
with check (
  (group_id is null and owner_id = (select auth.uid()))
  or
  (group_id is not null and (created_by = (select auth.uid()) or private.is_group_admin(group_id, (select auth.uid()))))
);

create policy "Creators and admins delete transactions"
on public.transactions for delete
to authenticated
using (
  (group_id is null and owner_id = (select auth.uid()))
  or
  (group_id is not null and (created_by = (select auth.uid()) or private.is_group_admin(group_id, (select auth.uid()))))
);

create policy "Users read accessible expense splits"
on public.expense_splits for select
to authenticated
using (private.can_view_transaction(transaction_id, (select auth.uid())));

create policy "Creators manage expense splits"
on public.expense_splits for insert
to authenticated
with check (private.can_manage_transaction(transaction_id, (select auth.uid())));

create policy "Creators update expense splits"
on public.expense_splits for update
to authenticated
using (private.can_manage_transaction(transaction_id, (select auth.uid())))
with check (private.can_manage_transaction(transaction_id, (select auth.uid())));

create policy "Creators delete expense splits"
on public.expense_splits for delete
to authenticated
using (private.can_manage_transaction(transaction_id, (select auth.uid())));

create policy "Members read group settlements"
on public.settlements for select
to authenticated
using (private.is_group_member(group_id, (select auth.uid())));

create policy "Members create valid settlements"
on public.settlements for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and private.is_group_member(group_id, (select auth.uid()))
  and private.is_group_member(group_id, payer_id)
  and private.is_group_member(group_id, payee_id)
);

create policy "Creators and admins update settlements"
on public.settlements for update
to authenticated
using (created_by = (select auth.uid()) or private.is_group_admin(group_id, (select auth.uid())))
with check (created_by = (select auth.uid()) or private.is_group_admin(group_id, (select auth.uid())));

create policy "Creators and admins delete settlements"
on public.settlements for delete
to authenticated
using (created_by = (select auth.uid()) or private.is_group_admin(group_id, (select auth.uid())));

create view public.group_member_balances
with (security_invoker = true)
as
select
  gm.group_id,
  gm.user_id,
  g.currency,
  coalesce(paid.total_cents, 0)
    - coalesce(owed.total_cents, 0)
    + coalesce(sent.total_cents, 0)
    - coalesce(received.total_cents, 0) as balance_cents
from public.group_members gm
join public.groups g on g.id = gm.group_id
left join lateral (
  select sum(t.amount_cents)::bigint as total_cents
  from public.transactions t
  where t.group_id = gm.group_id and t.paid_by = gm.user_id and t.kind = 'expense'
) paid on true
left join lateral (
  select sum(es.amount_cents)::bigint as total_cents
  from public.expense_splits es
  join public.transactions t on t.id = es.transaction_id
  where t.group_id = gm.group_id and es.user_id = gm.user_id and t.kind = 'expense'
) owed on true
left join lateral (
  select sum(s.amount_cents)::bigint as total_cents
  from public.settlements s
  where s.group_id = gm.group_id and s.payer_id = gm.user_id
) sent on true
left join lateral (
  select sum(s.amount_cents)::bigint as total_cents
  from public.settlements s
  where s.group_id = gm.group_id and s.payee_id = gm.user_id
) received on true;

revoke all on table public.group_member_balances from anon, authenticated;
grant select on table public.group_member_balances to authenticated;
