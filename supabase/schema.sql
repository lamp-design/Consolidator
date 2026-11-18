-- Run this in Supabase SQL Editor.
-- Assumes public.faults and public.fault_classifications already exist
-- and your two CSV imports have completed.

alter table public.faults enable row level security;
alter table public.fault_classifications enable row level security;

grant select, insert, update, delete on public.faults to authenticated;
grant select, insert, update, delete on public.fault_classifications to authenticated;

drop policy if exists "authenticated users can read faults" on public.faults;
create policy "authenticated users can read faults"
on public.faults for select to authenticated using (true);

drop policy if exists "authenticated users can insert faults" on public.faults;
create policy "authenticated users can insert faults"
on public.faults for insert to authenticated with check (true);

drop policy if exists "authenticated users can update faults" on public.faults;
create policy "authenticated users can update faults"
on public.faults for update to authenticated using (true) with check (true);

drop policy if exists "authenticated users can delete faults" on public.faults;
create policy "authenticated users can delete faults"
on public.faults for delete to authenticated using (true);

drop policy if exists "authenticated users can read classifications" on public.fault_classifications;
create policy "authenticated users can read classifications"
on public.fault_classifications for select to authenticated using (true);

drop policy if exists "authenticated users can insert classifications" on public.fault_classifications;
create policy "authenticated users can insert classifications"
on public.fault_classifications for insert to authenticated with check (true);

drop policy if exists "authenticated users can update classifications" on public.fault_classifications;
create policy "authenticated users can update classifications"
on public.fault_classifications for update to authenticated using (true) with check (true);

drop policy if exists "authenticated users can delete classifications" on public.fault_classifications;
create policy "authenticated users can delete classifications"
on public.fault_classifications for delete to authenticated using (true);

-- The authenticated role is shared by every signed-in account.
-- This starter grants all signed-in users equal edit rights.
-- Add role-based authorization before inviting users if only selected
-- people should be allowed to edit or delete fault definitions.