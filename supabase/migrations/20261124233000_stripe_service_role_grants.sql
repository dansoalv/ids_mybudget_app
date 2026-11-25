grant select, insert on table public.stripe_events to service_role;
grant select, insert, update on table public.subscriptions to service_role;

grant usage on type public.subscription_plan to service_role;
grant usage on type public.subscription_status to service_role;
grant usage on type public.billing_interval to service_role;

