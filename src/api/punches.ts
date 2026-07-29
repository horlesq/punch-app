import { supabase } from '@/src/lib/supabase';
import type { Tables } from '@/src/types/database';

export type Punch = Tables<'punches'>;

/** A punch joined with the employee's full_name for admin views. */
export interface PunchWithEmployee extends Punch {
  employee_name: string;
}

/**
 * Get the currently-open (no clock_out_at) punch for an employee.
 * Returns null if the employee is not clocked in.
 */
export async function getCurrentOpenPunch(
  employeeId: string,
): Promise<{ data: Punch | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('punches')
    .select('*')
    .eq('employee_id', employeeId)
    .is('clock_out_at', null)
    .order('clock_in_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}

/**
 * Create a new punch (clock in). Sets clock_in_at to now, source = 'live'.
 */
export async function createPunch(
  employeeId: string,
): Promise<{ data: Punch | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('punches')
    .insert({
      employee_id: employeeId,
      clock_in_at: new Date().toISOString(),
      source: 'live',
      status: 'approved',
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}

/**
 * Close an existing punch (clock out). Sets clock_out_at to now.
 */
export async function closePunch(
  punchId: string,
): Promise<{ data: Punch | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('punches')
    .update({ clock_out_at: new Date().toISOString() })
    .eq('id', punchId)
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}

/**
 * Fetch all punches for the given employee, ordered by clock_in_at descending.
 */
export async function getEmployeePunches(
  employeeId: string,
): Promise<{ data: Punch[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('punches')
    .select('*')
    .eq('employee_id', employeeId)
    .order('clock_in_at', { ascending: false });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: data ?? [], error: null };
}

/**
 * Fetch all currently open punches across all employees (admin dashboard).
 * Returns punches joined with employee full_name.
 */
export async function getAllOpenPunches(): Promise<{
  data: PunchWithEmployee[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from('punches')
    .select('*, profiles!punches_employee_id_fkey(full_name)')
    .is('clock_out_at', null)
    .order('clock_in_at', { ascending: true });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  // Flatten the joined profile data
  const result: PunchWithEmployee[] = (data ?? []).map((row: any) => ({
    ...row,
    employee_name: row.profiles?.full_name ?? '',
    profiles: undefined,
  }));

  return { data: result, error: null };
}
