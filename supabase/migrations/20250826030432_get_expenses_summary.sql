create or replace function public.get_expenses_summary(
  uid int,
  start_date date,
  end_date date
)
returns table(day date, total_amount numeric)
language sql
as $$
  select
    created_at::date as day,
    sum(amount) as total_amount
  from expenses
  where user_id = uid
    and created_at::date between start_date and end_date
  group by day
  order by day asc;
$$;

grant execute on function public.get_expenses_summary(int, date, date) to authenticated;
