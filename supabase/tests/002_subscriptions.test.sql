begin;

select plan(4);

select has_type('public', 'subscription_plan', 'subscription_plan enum exists');
select has_table('public', 'subscriptions', 'subscriptions exists');
select ok((select relrowsecurity from pg_class where oid = 'public.subscriptions'::regclass), 'subscriptions has RLS');
select has_trigger('public', 'groups', 'groups_enforce_subscription_limit', 'groups enforce the subscription limit');

select * from finish();
rollback;
