-- Migration: Create get_expenses_by_category function
-- Description: Summarizes expenses by category for a given user and date range

create or replace function public.get_expenses_by_category(
  uid int,
  start_date date,
  end_date date
)
returns table(
  category text,
  total_amount numeric
)
language sql
as $$
  select
    category,
    sum(amount) as total_amount
  from expenses
  where user_id = uid
    and created_at::date between start_date and end_date
  group by category
  order by total_amount desc;
$$;

-- Ensure the function is available to authenticated users
grant execute on function public.get_expenses_by_category(int, date, date) to authenticated;
