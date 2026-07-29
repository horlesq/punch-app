import { supabase } from '@/src/lib/supabase';
import type { Tables, TablesUpdate } from '@/src/types/database';

export type PunchCorrection = Tables<'punch_corrections'>;

/** A correction joined with the employee's full_name for admin views. */
export interface CorrectionWithEmployee extends PunchCorrection {
  employee_name: string;
}

/**
 * Create a new punch correction request.
 * If punch_id is null, this represents a fully missed shift (no existing punch row).
 */
export async function createCorrection(
  employeeId: string,
  punchId: string | null,
  requestedClockIn?: string,
  requestedClockOut?: string,
  reason?: string,
  status: 'pending' | 'approved' = 'pending',
): Promise<{ data: PunchCorrection | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('punch_corrections')
    .insert({
      employee_id: employeeId,
      punch_id: punchId,
      requested_clock_in_at: requestedClockIn ?? null,
      requested_clock_out_at: requestedClockOut ?? null,
      reason: reason ?? null,
      status,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as PunchCorrection, error: null };
}

/**
 * Apply an approved correction: update the related punch row and mark
 * the correction as approved. Used for both auto-approve and admin-approve paths.
 */
export async function applyCorrection(
  correctionId: string,
  reviewerId?: string,
): Promise<{ error: Error | null }> {
  // 1. Fetch the correction
  const { data: correction, error: fetchError } = await supabase
    .from('punch_corrections')
    .select('*')
    .eq('id', correctionId)
    .single();

  if (fetchError || !correction) {
    return { error: new Error(fetchError?.message ?? 'Correction not found') };
  }

  let finalPunchId = correction.punch_id;

  // 2. Update the related punch (if it exists) or create a new one
  if (correction.punch_id) {
    const updatePayload: TablesUpdate<'punches'> = {
      source: 'correction',
      status: 'approved',
    };
    if (correction.requested_clock_in_at) {
      updatePayload.clock_in_at = correction.requested_clock_in_at;
    }
    if (correction.requested_clock_out_at) {
      updatePayload.clock_out_at = correction.requested_clock_out_at;
    }

    const { error: punchError } = await supabase
      .from('punches')
      .update(updatePayload)
      .eq('id', correction.punch_id);

    if (punchError) {
      return { error: new Error(punchError.message) };
    }
  } else {
    // Missing shift: create the new punch row
    if (!correction.requested_clock_in_at || !correction.requested_clock_out_at) {
      return { error: new Error('Missed shift correction must have both clock in and clock out times') };
    }

    const { data: newPunch, error: insertError } = await supabase
      .from('punches')
      .insert({
        employee_id: correction.employee_id,
        clock_in_at: correction.requested_clock_in_at,
        clock_out_at: correction.requested_clock_out_at,
        source: 'correction',
        status: 'approved',
      })
      .select()
      .single();

    if (insertError || !newPunch) {
      return { error: new Error(insertError?.message ?? 'Failed to create punch') };
    }

    finalPunchId = newPunch.id;
  }

  // 3. Mark the correction as approved
  const { error: approveError } = await supabase
    .from('punch_corrections')
    .update({
      punch_id: finalPunchId,
      status: 'approved',
      reviewed_by: reviewerId ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', correctionId);

  if (approveError) {
    return { error: new Error(approveError.message) };
  }

  return { error: null };
}

/**
 * Reject a correction: marks status = 'rejected' with reviewer info.
 */
export async function rejectCorrection(
  correctionId: string,
  reviewerId: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('punch_corrections')
    .update({
      status: 'rejected',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', correctionId);

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}

/**
 * Get all pending corrections for a given employee.
 */
export async function getPendingCorrections(
  employeeId: string,
): Promise<{ data: PunchCorrection[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('punch_corrections')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: data ?? [], error: null };
}

/**
 * Get all pending corrections across all employees (admin view).
 * Returns corrections joined with employee full_name.
 */
export async function getAllPendingCorrections(): Promise<{
  data: CorrectionWithEmployee[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from('punch_corrections')
    .select('*, profiles!punch_corrections_employee_id_fkey(full_name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  // Flatten the joined profile data
  const result: CorrectionWithEmployee[] = (data ?? []).map((row: any) => ({
    ...row,
    employee_name: row.profiles?.full_name ?? '',
    profiles: undefined,
  }));

  return { data: result, error: null };
}

/**
 * Count all pending corrections (for dashboard badge).
 */
export async function getPendingCorrectionsCount(): Promise<{
  count: number;
  error: Error | null;
}> {
  const { count, error } = await supabase
    .from('punch_corrections')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) {
    return { count: 0, error: new Error(error.message) };
  }

  return { count: count ?? 0, error: null };
}
