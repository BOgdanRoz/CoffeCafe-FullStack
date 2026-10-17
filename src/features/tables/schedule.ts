// Date helpers for the availability view. All slot and status logic is computed in PostgreSQL
// (get_public_availability), so the browser never decides what is free.

export function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(isoDate: string): string {
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' }).format(
    new Date(`${isoDate}T00:00:00`),
  );
}
