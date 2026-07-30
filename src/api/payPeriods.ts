import { supabase } from '@/src/lib/supabase';
import type { Tables } from '@/src/types/database';

export type PayPeriod = Tables<'pay_periods'>;

/**
 * Fetch a pay_periods row for a given employee and week start date.
 * Returns null if no snapshot exists yet.
 */
export async function getPayPeriod(
  employeeId: string,
  weekStartDate: string,
): Promise<{ data: PayPeriod | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('pay_periods')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('week_start_date', weekStartDate)
    .maybeSingle();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}

/**
 * Fetch all pay_periods rows for a given week start date.
 * Used by the admin weekly pay table to know which employees are already paid/locked.
 */
export async function getAllPayPeriodsForWeek(
  weekStartDate: string,
): Promise<{ data: PayPeriod[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('pay_periods')
    .select('*')
    .eq('week_start_date', weekStartDate);

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: data ?? [], error: null };
}

/**
 * Fetch all pay_periods rows for a specific employee.
 * Used by employee's My Pay screen to show paid vs unpaid status per week.
 */
export async function getEmployeePayPeriods(
  employeeId: string,
): Promise<{ data: PayPeriod[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('pay_periods')
    .select('*')
    .eq('employee_id', employeeId);

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: data ?? [], error: null };
}

/**
 * Create a pay_periods snapshot when marking an employee/week as paid.
 * Sets is_paid = true, locked = true, paid_at = now().
 */
export async function createPayPeriod(
  employeeId: string,
  weekStart: string,
  weekEnd: string,
  totalHours: number,
  totalPay: number,
): Promise<{ data: PayPeriod | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('pay_periods')
    .upsert(
      {
        employee_id: employeeId,
        week_start_date: weekStart,
        week_end_date: weekEnd,
        total_hours: totalHours,
        total_pay: totalPay,
        is_paid: true,
        paid_at: new Date().toISOString(),
        locked: true,
      },
      { onConflict: 'employee_id, week_start_date' }
    )
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}

/**
 * Unlock a pay period by setting locked = false.
 * This allows corrections to be made for punches in that week.
 * The row is NOT deleted — it remains as a historical record.
 */
export async function unlockPayPeriod(
  payPeriodId: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('pay_periods')
    .update({ locked: false })
    .eq('id', payPeriodId);

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}

/**
 * Check if a given week is locked for an employee.
 * Used by the corrections flow to block submissions for locked weeks.
 */
export async function isWeekLockedForEmployee(
  employeeId: string,
  weekStartDate: string,
): Promise<{ locked: boolean; error: Error | null }> {
  const { data, error } = await supabase
    .from('pay_periods')
    .select('locked')
    .eq('employee_id', employeeId)
    .eq('week_start_date', weekStartDate)
    .eq('locked', true)
    .maybeSingle();

  if (error) {
    return { locked: false, error: new Error(error.message) };
  }

  return { locked: !!data, error: null };
}
