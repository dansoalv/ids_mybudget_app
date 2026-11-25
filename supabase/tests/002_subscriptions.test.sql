begin;

select plan(11);

select has_type('public', 'subscription_plan', 'subscription_plan enum exists');
select has_table('public', 'subscriptions', 'subscriptions exists');
select ok((select relrowsecurity from pg_class where oid = 'public.subscriptions'::regclass), 'subscriptions has RLS');
select has_trigger('public', 'groups', 'groups_enforce_subscription_limit', 'groups enforce the subscription limit');
select has_type('public', 'billing_interval', 'billing interval enum exists');
select has_column('public', 'subscriptions', 'stripe_customer_id', 'subscriptions stores Stripe customer id');
select has_column('public', 'subscriptions', 'stripe_subscription_id', 'subscriptions stores Stripe subscription id');
select has_column('public', 'subscriptions', 'billing_interval', 'subscriptions stores billing interval');
select has_table('public', 'stripe_events', 'Stripe webhook events are idempotent');
select ok(has_table_privilege('service_role', 'public.stripe_events', 'SELECT'), 'service role reads Stripe events');
select ok(has_table_privilege('service_role', 'public.stripe_events', 'INSERT'), 'service role records Stripe events');

select * from finish();
rollback;
