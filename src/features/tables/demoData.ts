import type { CafeTable, TableStatus } from './types';

// DEMO DATA ONLY. These tables and statuses are invented for the portfolio prototype.
// They do not describe real opening schedules or real reservations.

export const demoTables: CafeTable[] = [
  { id: 't01', name: 'Столик 01', capacity: 2 },
  { id: 't02', name: 'Столик 02', capacity: 2 },
  { id: 't03', name: 'Столик 03', capacity: 2 },
  { id: 't04', name: 'Столик 04', capacity: 4 },
  { id: 't05', name: 'Столик 05', capacity: 4 },
  { id: 't06', name: 'Столик 06', capacity: 4 },
  { id: 't07', name: 'Столик 07', capacity: 6 },
  { id: 't08', name: 'Столик 08', capacity: 8 },
];

function hashString(value: string): number {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

// Deterministic demo rules:
// - table 08 is "being prepared" before 10:00 (demo of a time-dependent unavailable state);
// - about one third of the remaining table/slot pairs are marked occupied;
// - everything else is available.
export function getDemoTableStatus(date: string, time: string, table: CafeTable): TableStatus {
  if (table.id === 't08' && time < '10:00') {
    return 'unavailable';
  }
  if (hashString(`${date}|${time}|${table.id}`) % 3 === 0) {
    return 'occupied';
  }
  return 'available';
}
