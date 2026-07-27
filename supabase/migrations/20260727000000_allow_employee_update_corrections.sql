-- Allow employees to update their own punch_corrections (required for auto-approval flow)
create policy "Employees can update own corrections"
  on public.punch_corrections for update
  using (auth.uid() = employee_id);
