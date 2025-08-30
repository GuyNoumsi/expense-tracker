create or replace function public.get_expenses_by_month_year(
  uid int,
  month int,
  year int
)
returns setof expenses
language sql
as $$
  select *
  from expenses
  where user_id = uid
    and extract(month from created_at) = month
    and extract(year from created_at) = year
  order by created_at desc;
$$;

-- Ensure the function is available to authenticated users
grant execute on function public.get_expenses_by_month_year(int, int, int) to authenticated;
