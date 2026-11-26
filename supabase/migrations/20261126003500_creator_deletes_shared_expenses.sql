drop policy if exists "Users delete permitted transactions" on public.transactions;

create policy "Users delete permitted transactions"
on public.transactions for delete
to authenticated
using (
  (group_id is null and owner_id = (select auth.uid()))
  or
  (
    group_id is not null
    and (
      created_by = (select auth.uid())
      or (
        private.has_paid_access((select auth.uid()))
        and private.is_group_admin(group_id, (select auth.uid()))
      )
    )
  )
);
