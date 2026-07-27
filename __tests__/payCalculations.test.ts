import {
  calculateShiftHours,
  calculateShiftPay,
  calculateWeekTotals,
} from '../src/utils/payCalculations';

/** Helper: create a Date offset from a base by a given number of hours + minutes. */
function hoursAfter(base: Date, hours: number, minutes: number = 0): Date {
  return new Date(base.getTime() + hours * 3600_000 + minutes * 60_000);
}

describe('calculateShiftHours', () => {
  const base = new Date('2026-07-09T08:00:00Z');

  it('returns 0 for a zero-duration shift', () => {
    expect(calculateShiftHours(base, base)).toBe(0);
  });

  it('returns 0 when clockOut is before clockIn', () => {
    const before = new Date(base.getTime() - 3600_000);
    expect(calculateShiftHours(base, before)).toBe(0);
  });

  it('does NOT deduct break for a shift well under the threshold', () => {
    // 2 hours — well under 4h threshold
    const clockOut = hoursAfter(base, 2);
    expect(calculateShiftHours(base, clockOut)).toBe(2);
  });

  it('does NOT deduct break for a shift exactly at the threshold (4h)', () => {
    const clockOut = hoursAfter(base, 4);
    expect(calculateShiftHours(base, clockOut)).toBe(4);
  });

  it('DOES deduct break for a shift just over the threshold (4h 1min)', () => {
    // 4h 1min gross = 241 minutes → exceeds 4h → deduct 60min break
    // Net = 241 - 60 = 181 minutes = 3.0166… hours
    const clockOut = hoursAfter(base, 4, 1);
    const result = calculateShiftHours(base, clockOut);
    const expected = (4 * 60 + 1 - 60) / 60; // 181 / 60 ≈ 3.0167
    expect(result).toBeCloseTo(expected, 4);
  });

  it('deducts break for a standard 8-hour shift', () => {
    const clockOut = hoursAfter(base, 8);
    // 8h gross - 1h break = 7h net
    expect(calculateShiftHours(base, clockOut)).toBe(7);
  });

  it('respects custom break threshold and duration', () => {
    // 6h shift, threshold = 5h, break = 30min
    const clockOut = hoursAfter(base, 6);
    // 6 > 5 → deduct 30min → 5.5h
    expect(calculateShiftHours(base, clockOut, 5, 30)).toBe(5.5);
  });

  it('never returns negative hours even if break > shift', () => {
    // 1h shift but somehow threshold = 0.5h and break = 120min
    const clockOut = hoursAfter(base, 1);
    // 1 > 0.5 → deduct 2h → would be -1 → clamped to 0
    expect(calculateShiftHours(base, clockOut, 0.5, 120)).toBe(0);
  });
});

describe('calculateShiftPay', () => {
  it('returns correct pay for whole numbers', () => {
    expect(calculateShiftPay(8, 15)).toBe(120);
  });

  it('rounds to 2 decimal places', () => {
    // 7.333... hours * 15 = 110.0
    expect(calculateShiftPay(7.333, 15)).toBe(110);
  });

  it('returns 0 for zero hours', () => {
    expect(calculateShiftPay(0, 25)).toBe(0);
  });

  it('handles fractional rates correctly', () => {
    expect(calculateShiftPay(3, 12.5)).toBe(37.5);
  });
});

describe('calculateWeekTotals', () => {
  const monday = new Date('2026-07-06T08:00:00Z');

  it('aggregates multiple completed shifts', () => {
    const shifts = [
      {
        clock_in_at: monday.toISOString(),
        clock_out_at: hoursAfter(monday, 8).toISOString(),
      },
      {
        clock_in_at: hoursAfter(monday, 24).toISOString(), // next day
        clock_out_at: hoursAfter(monday, 32).toISOString(), // 8h shift
      },
    ];

    // Each 8h shift → 7h net (1h break). Total = 14h.
    const result = calculateWeekTotals(shifts, 15);
    expect(result.totalHours).toBe(14);
    expect(result.totalPay).toBe(210); // 14 * 15
  });

  it('skips in-progress shifts (null clock_out_at)', () => {
    const shifts = [
      {
        clock_in_at: monday.toISOString(),
        clock_out_at: hoursAfter(monday, 8).toISOString(),
      },
      {
        clock_in_at: hoursAfter(monday, 24).toISOString(),
        clock_out_at: null, // still open
      },
    ];

    const result = calculateWeekTotals(shifts, 15);
    expect(result.totalHours).toBe(7); // only first shift counted
    expect(result.totalPay).toBe(105);
  });

  it('returns zero for an empty week', () => {
    const result = calculateWeekTotals([], 15);
    expect(result.totalHours).toBe(0);
    expect(result.totalPay).toBe(0);
  });

  it('handles a mix of short and long shifts', () => {
    const shifts = [
      {
        // 2h shift — under threshold, no break
        clock_in_at: monday.toISOString(),
        clock_out_at: hoursAfter(monday, 2).toISOString(),
      },
      {
        // 6h shift — over threshold, 1h break → 5h net
        clock_in_at: hoursAfter(monday, 24).toISOString(),
        clock_out_at: hoursAfter(monday, 30).toISOString(),
      },
    ];

    const result = calculateWeekTotals(shifts, 20);
    expect(result.totalHours).toBe(7); // 2 + 5
    expect(result.totalPay).toBe(140); // 7 * 20
  });
});
