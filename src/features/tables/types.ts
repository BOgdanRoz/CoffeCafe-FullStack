// Shapes returned by get_public_availability (see supabase/migrations).

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
  timezone: string;
  isOpen: boolean;
  tables: CafeTable[];
  slots: SlotAvailability[];
};
