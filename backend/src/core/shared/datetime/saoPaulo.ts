const SAO_PAULO_TIME_ZONE = 'America/Sao_Paulo';

type TimeZoneParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const TIME_ZONE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: SAO_PAULO_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: SAO_PAULO_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return { year, month, day };
}

function getPartsMap(
  date: Date,
  formatter: Intl.DateTimeFormat,
): Record<string, string> {
  return formatter.formatToParts(date).reduce<Record<string, string>>(
    (acc, part) => {
      if (part.type !== 'literal') {
        acc[part.type] = part.value;
      }

      return acc;
    },
    {},
  );
}

export function getSaoPauloTimeZoneParts(date: Date): TimeZoneParts {
  const parts = getPartsMap(date, TIME_ZONE_FORMATTER);

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

export function getSaoPauloDateKey(date: Date): string {
  const parts = getPartsMap(date, DATE_FORMATTER);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getSaoPauloTimeZoneOffsetMinutes(date: Date): number {
  const parts = getSaoPauloTimeZoneParts(date);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return (asUtc - date.getTime()) / 60000;
}

export function parseSaoPauloDateTime(
  dateKey: string,
  time: string,
  seconds = 0,
  milliseconds = 0,
): Date {
  const { year, month, day } = parseDateKey(dateKey);
  const [hour, minute] = time.split(':').map(Number);

  let utcTimestamp = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    seconds,
    milliseconds,
  );

  let offset = getSaoPauloTimeZoneOffsetMinutes(new Date(utcTimestamp));
  utcTimestamp -= offset * 60 * 1000;

  const adjustedOffset = getSaoPauloTimeZoneOffsetMinutes(
    new Date(utcTimestamp),
  );
  if (adjustedOffset !== offset) {
    utcTimestamp -= (adjustedOffset - offset) * 60 * 1000;
  }

  return new Date(utcTimestamp);
}

export function parseSaoPauloDateTimeInput(value: string): Date {
  const [dateKey, time = '00:00'] = value.split('T');
  return parseSaoPauloDateTime(dateKey, time.slice(0, 5));
}

export function getSaoPauloDayOfWeek(date: Date) {
  const day = new Intl.DateTimeFormat('en-US', {
    timeZone: SAO_PAULO_TIME_ZONE,
    weekday: 'short',
  }).format(date);

  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day);
}

export function getSaoPauloMinutes(date: Date): number {
  const parts = getSaoPauloTimeZoneParts(date);
  return parts.hour * 60 + parts.minute;
}

export function getSaoPauloDayBounds(date: Date) {
  const dateKey = getSaoPauloDateKey(date);
  const start = parseSaoPauloDateTime(dateKey, '00:00');
  const nextDay = addDaysToDateKey(dateKey, 1);
  const end = new Date(parseSaoPauloDateTime(nextDay, '00:00').getTime() - 1);

  return { start, end };
}

export function getSaoPauloTodayDateKey(now = new Date()) {
  return getSaoPauloDateKey(now);
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const { year, month, day } = parseDateKey(dateKey);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function getDayOfWeekFromDateKey(dateKey: string): number {
  const { year, month, day } = parseDateKey(dateKey);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
}

export function getSaoPauloDayBoundsFromDateKey(dateKey: string) {
  const start = parseSaoPauloDateTime(dateKey, '00:00');
  const end = new Date(parseSaoPauloDateTime(addDaysToDateKey(dateKey, 1), '00:00').getTime() - 1);

  return { start, end };
}
