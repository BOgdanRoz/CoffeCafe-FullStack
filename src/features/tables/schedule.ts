import { cafe } from '../../data/cafe';

// Helpers for dates and the "HH:MM" time grid. No business rules live here.

export function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function toTimeLabel(totalMinutes: number): string {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function buildTimeSlots(): string[] {
  const slots: string[] = [];
  const last = toMinutes(cafe.reservationLastSlot);
  for (
    let minutes = toMinutes(cafe.reservationFirstSlot);
    minutes <= last;
    minutes += cafe.reservationSlotMinutes
  ) {
    slots.push(toTimeLabel(minutes));
  }
  return slots;
}

export function formatDisplayDate(isoDate: string): string {
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' }).format(
    new Date(`${isoDate}T00:00:00`),
  );
}
