begin;

select plan(12);

select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'groups', 'groups exists');
select has_table('public', 'group_members', 'group_members exists');
select has_table('public', 'group_invitations', 'group_invitations exists');
select has_table('public', 'transactions', 'transactions exists');
select has_table('public', 'expense_splits', 'expense_splits exists');
select has_table('public', 'settlements', 'settlements exists');

select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.groups'::regclass), 'groups has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.group_members'::regclass), 'group_members has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.transactions'::regclass), 'transactions has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.settlements'::regclass), 'settlements has RLS');

select * from finish();
rollback;
