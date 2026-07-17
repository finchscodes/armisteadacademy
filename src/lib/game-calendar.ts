export type Quarter = "fall" | "winter" | "spring" | "summer";

export const QUARTER_ORDER: Quarter[] = ["fall", "winter", "spring", "summer"];
export const QUARTER_WEEKS: Record<Quarter, number> = { fall: 5, winter: 5, spring: 5, summer: 3 };
export const WEEK_DAYS = 7;
export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const DAYS_PER_YEAR = QUARTER_ORDER.reduce((sum, q) => sum + QUARTER_WEEKS[q] * WEEK_DAYS, 0); // 126

export type GameDate = {
  dayIndex: number;
  year: number;
  quarter: Quarter;
  /** 1-based within the quarter (1-5, or 1-3 for summer). */
  week: number;
  /** 1 (Monday) - 7 (Sunday). */
  dayOfWeek: number;
  dayName: string;
  /** True on the last day of a week (Sunday) — payroll runs at the end of this day. */
  isEndOfWeek: boolean;
  /** True on the last day of summer — the year rolls over after this. */
  isEndOfYear: boolean;
};

/** Pure function — turns an absolute day count into a calendar position. Nothing here touches the DB. */
export function dateFromDayIndex(dayIndex: number): GameDate {
  const dayInYear = ((dayIndex % DAYS_PER_YEAR) + DAYS_PER_YEAR) % DAYS_PER_YEAR;
  const year = Math.floor(dayIndex / DAYS_PER_YEAR) + 1;

  let remaining = dayInYear;
  let quarter: Quarter = "fall";
  let weekIndex0 = 0; // 0-based week within the quarter
  for (const q of QUARTER_ORDER) {
    const quarterDays = QUARTER_WEEKS[q] * WEEK_DAYS;
    if (remaining < quarterDays) {
      quarter = q;
      weekIndex0 = Math.floor(remaining / WEEK_DAYS);
      break;
    }
    remaining -= quarterDays;
  }
  const dayOfWeek = (remaining % WEEK_DAYS) + 1;
  const week = weekIndex0 + 1;

  const isEndOfWeek = dayOfWeek === WEEK_DAYS;
  const isEndOfYear = quarter === "summer" && week === QUARTER_WEEKS.summer && isEndOfWeek;

  return {
    dayIndex,
    year,
    quarter,
    week,
    dayOfWeek,
    dayName: DAY_NAMES[dayOfWeek - 1],
    isEndOfWeek,
    isEndOfYear,
  };
}

/** Inverse of dateFromDayIndex — used by the admin "set time" control. */
export function dayIndexFromDate(year: number, quarter: Quarter, week: number, dayOfWeek: number): number {
  let daysIntoYear = 0;
  for (const q of QUARTER_ORDER) {
    if (q === quarter) break;
    daysIntoYear += QUARTER_WEEKS[q] * WEEK_DAYS;
  }
  daysIntoYear += (week - 1) * WEEK_DAYS + (dayOfWeek - 1);
  return (year - 1) * DAYS_PER_YEAR + daysIntoYear;
}
