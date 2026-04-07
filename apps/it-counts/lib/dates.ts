const YYYY_MM_DD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Returns today's device-local calendar day as `YYYY-MM-DD`.
 */
export function getTodayString(): string {
  return formatLocalDate(new Date());
}

/**
 * Returns the Monday that starts the week for a device-local calendar day.
 */
export function getWeekStart(date: string): string {
  const parsedDate = parseLocalDate(date);
  const dayOfWeek = parsedDate.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  return formatLocalDate(
    new Date(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate() - daysSinceMonday
    )
  );
}

/**
 * Returns the number of full 7-day periods completed in the current level.
 */
export function getWeeksElapsedInLevel(
  levelStartDate: string,
  today: string
): number {
  const startDayNumber = getLocalDayNumber(parseLocalDate(levelStartDate));
  const todayDayNumber = getLocalDayNumber(parseLocalDate(today));
  const daysElapsed = todayDayNumber - startDayNumber;

  return daysElapsed <= 0 ? 0 : Math.floor(daysElapsed / 7);
}

/**
 * Checks whether two persisted day keys represent the same calendar day.
 */
export function isSameDay(a: string, b: string): boolean {
  return a === b;
}

/**
 * Formats one local `Date` instance as a stable `YYYY-MM-DD` key.
 */
function formatLocalDate(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Converts a validated local calendar day into an integer day number.
 * UTC math keeps day-difference calculations stable across DST changes.
 */
function getLocalDayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY
  );
}

/**
 * Parses one persisted local day key and rejects impossible dates early.
 */
function parseLocalDate(value: string): Date {
  if (YYYY_MM_DD_PATTERN.test(value) === false) {
    throw new RangeError(
      `Expected YYYY-MM-DD date string, received "${value}".`
    );
  }

  const [yearString, monthString, dayString] = value.split('-');
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);
  const parsedDate = new Date(year, month - 1, day);

  if (
    Number.isInteger(year) === false ||
    Number.isInteger(month) === false ||
    Number.isInteger(day) === false ||
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    throw new RangeError(`Invalid calendar day "${value}".`);
  }

  return parsedDate;
}
