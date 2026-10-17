import type { DayAvailability, SlotAvailability, TableStatus } from './types';
import { demoTables, getDemoTableStatus } from './demoData';
import { buildTimeSlots, toIsoDate, toMinutes } from './schedule';

// Public read of table availability for one date.
// Currently returns demo data. The Supabase version (a read-only RPC or view) will replace this
// function and keep the same return shape, so the UI does not change.
export async function getDayAvailability(date: string, now: Date = new Date()): Promise<DayAvailability> {
  const todayIso = toIsoDate(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots: SlotAvailability[] = buildTimeSlots().map((time) => {
    const isPast = date < todayIso || (date === todayIso && toMinutes(time) <= nowMinutes);

    const statuses: Record<string, TableStatus> = {};
    for (const table of demoTables) {
      statuses[table.id] = getDemoTableStatus(date, time, table);
    }

    return { time, isPast, statuses };
  });

  return { date, tables: demoTables, slots };
}
