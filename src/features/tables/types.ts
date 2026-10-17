// Shapes shared by the public availability view and, later, the Supabase-backed services.

// Status is per table, per date and time slot. It is never a single global value.
export type TableStatus = 'available' | 'occupied' | 'unavailable';

export type CafeTable = {
  id: string;
  name: string;
  capacity: number;
};

export type SlotAvailability = {
  time: string;
  isPast: boolean;
  statuses: Record<string, TableStatus>;
};

export type DayAvailability = {
  date: string;
  tables: CafeTable[];
  slots: SlotAvailability[];
};
