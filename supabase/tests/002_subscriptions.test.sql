begin;

select plan(24);

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
select has_table('public', 'monthly_budgets', 'Monthly budgets exist');
select has_table('public', 'recurring_transactions', 'Plus recurring transactions exist');
select has_type('public', 'recurrence_frequency', 'recurrence frequency enum exists');
select has_column('public', 'transactions', 'recurring_transaction_id', 'transactions track their recurrence');
select ok((select relrowsecurity from pg_class where oid = 'public.monthly_budgets'::regclass), 'monthly budgets have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.recurring_transactions'::regclass), 'recurring transactions have RLS');
select has_function('public', 'materialize_due_recurring_transactions', array[]::text[], 'recurring materialization function exists');
select hasnt_trigger('public', 'monthly_budgets', 'monthly_budgets_require_paid_access', 'budgets are available on the free plan');
select has_column('public', 'recurring_transactions', 'day_of_month', 'monthly recurrences preserve their calendar day');
select has_function('public', 'update_shared_expense', array['uuid', 'uuid', 'text', 'text', 'bigint', 'uuid', 'jsonb', 'timestamp with time zone'], 'shared expenses can be updated atomically');
select ok(pg_get_functiondef('private.enforce_group_update_permissions()'::regprocedure) like '%not private.has_paid_access%', 'group editing requires a paid plan');
select ok(pg_get_functiondef('public.update_shared_expense(uuid,uuid,text,text,bigint,uuid,jsonb,timestamp with time zone)'::regprocedure) like '%not private.has_paid_access%', 'shared expense editing requires a paid plan');
select ok(
  (select qual from pg_policies where schemaname = 'public' and tablename = 'transactions' and policyname = 'Users delete permitted transactions') like '%created_by%'
  and (select qual from pg_policies where schemaname = 'public' and tablename = 'transactions' and policyname = 'Users delete permitted transactions') like '%has_paid_access%',
  'creators delete shared expenses on every plan while paid admins retain access'
);

select * from finish();
rollback;
