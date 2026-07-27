/**
 * Pure pay calculation functions.
 *
 * These functions have zero imports from Supabase, React, or any external
 * dependency. They are fully unit-testable and serve as the single source
 * of truth for all break-deduction and pay math in the app.
 */

/** Minimal shift shape needed by the week-total aggregator. */
export interface Shift {
  clock_in_at: string;
  clock_out_at: string | null;
}

/**
 * Calculate net worked hours for a single shift after applying break deduction.
 *
 * Break rule (per ARCHITECTURE.md §3):
 *   If shift duration **strictly exceeds** `breakThresholdHours`,
 *   deduct `breakDurationMinutes` from the total.
 *   At exactly the threshold → no deduction.
 *
 * @returns Net hours worked (always ≥ 0).
 */
export function calculateShiftHours(
  clockIn: Date,
  clockOut: Date,
  breakThresholdHours: number = 4,
  breakDurationMinutes: number = 60,
): number {
  const diffMs = clockOut.getTime() - clockIn.getTime();

  if (diffMs <= 0) return 0;

  let totalHours = diffMs / (1000 * 60 * 60);

  if (totalHours > breakThresholdHours) {
    totalHours -= breakDurationMinutes / 60;
  }

  return Math.max(0, totalHours);
}

/**
 * Calculate pay for a single shift.
 *
 * @returns Pay amount (hours × rate), rounded to 2 decimal places.
 */
export function calculateShiftPay(
  hoursWorked: number,
  hourlyRate: number,
): number {
  return Math.round(hoursWorked * hourlyRate * 100) / 100;
}

/**
 * Aggregate hours and pay across multiple shifts in a week.
 *
 * Skips shifts that are still in progress (null clock_out_at).
 *
 * @returns `{ totalHours, totalPay }` — both rounded to 2 decimal places.
 */
export function calculateWeekTotals(
  shifts: Shift[],
  hourlyRate: number,
  breakThresholdHours: number = 4,
  breakDurationMinutes: number = 60,
): { totalHours: number; totalPay: number } {
  let totalHours = 0;

  for (const shift of shifts) {
    if (!shift.clock_out_at) continue;

    const clockIn = new Date(shift.clock_in_at);
    const clockOut = new Date(shift.clock_out_at);

    totalHours += calculateShiftHours(
      clockIn,
      clockOut,
      breakThresholdHours,
      breakDurationMinutes,
    );
  }

  totalHours = Math.round(totalHours * 100) / 100;
  const totalPay = calculateShiftPay(totalHours, hourlyRate);

  return { totalHours, totalPay };
}
