export const SAO_PAULO_TIME_ZONE = 'America/Sao_Paulo';

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

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function getPartsMap(date: Date) {
  return TIME_ZONE_FORMATTER.formatToParts(date).reduce<Record<string, string>>(
    (acc, part) => {
      if (part.type !== 'literal') {
        acc[part.type] = part.value;
      }

      return acc;
    },
    {},
  );
}

function getSaoPauloTimeZoneParts(value: string | Date): TimeZoneParts {
  const parts = getPartsMap(toDate(value));

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function getSaoPauloTimeZoneOffsetMinutes(date: Date): number {
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

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return { year, month, day };
}

export function parseSaoPauloDateTime(dateKey: string, time: string): Date {
  const { year, month, day } = parseDateKey(dateKey);
  const [hour, minute] = time.split(':').map(Number);

  let utcTimestamp = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
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

export function toSaoPauloUtcIso(dateKey: string, time: string): string {
  return parseSaoPauloDateTime(dateKey, time).toISOString();
}

export function toSaoPauloUtcIsoFromInput(value: string): string {
  return parseSaoPauloDateTimeInput(value).toISOString();
}

export function formatSaoPauloDate(
  value: string | Date,
  options?: Intl.DateTimeFormatOptions,
) {
  return toDate(value).toLocaleDateString('pt-BR', {
    timeZone: SAO_PAULO_TIME_ZONE,
    ...options,
  });
}

export function formatSaoPauloTime(
  value: string | Date,
  options?: Intl.DateTimeFormatOptions,
) {
  return toDate(value).toLocaleTimeString('pt-BR', {
    timeZone: SAO_PAULO_TIME_ZONE,
    ...options,
  });
}

export function formatSaoPauloDateTime(
  value: string | Date,
  options?: Intl.DateTimeFormatOptions,
) {
  return toDate(value).toLocaleString('pt-BR', {
    timeZone: SAO_PAULO_TIME_ZONE,
    ...options,
  });
}

export function getSaoPauloDateKey(value: string | Date): string {
  const parts = getSaoPauloTimeZoneParts(value);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function getNowSaoPauloDateKey() {
  return getSaoPauloDateKey(new Date());
}

export function formatCalendarDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDateKeyLabel(
  dateKey: string,
  options?: Intl.DateTimeFormatOptions,
) {
  const { year, month, day } = parseDateKey(dateKey);
  return new Date(year, month - 1, day, 12, 0, 0).toLocaleDateString(
    'pt-BR',
    options,
  );
}
