import { supabase } from '../../lib/supabase/client';
import type { Json } from '../../lib/supabase/types';
import type { DayAvailability, SlotAvailability, TableStatus } from './types';

export class AvailabilityError extends Error {
  readonly kind: 'not-configured' | 'request-failed' | 'invalid-response';

  constructor(kind: AvailabilityError['kind'], message: string) {
    super(message);
    this.name = 'AvailabilityError';
    this.kind = kind;
  }
}

const statusValues: TableStatus[] = ['available', 'occupied', 'unavailable'];

function isRecord(value: Json | undefined): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Validates the JSON shape from the database instead of trusting it blindly.
function parseDayAvailability(value: Json): DayAvailability {
  if (!isRecord(value) || typeof value.date !== 'string' || typeof value.isOpen !== 'boolean') {
    throw new AvailabilityError('invalid-response', 'Некоректна відповідь сервера.');
  }
  if (!Array.isArray(value.tables) || !Array.isArray(value.slots)) {
    throw new AvailabilityError('invalid-response', 'Некоректна відповідь сервера.');
  }

  const tables = value.tables.map((table) => {
    if (!isRecord(table) || typeof table.id !== 'string' || typeof table.name !== 'string' || typeof table.capacity !== 'number') {
      throw new AvailabilityError('invalid-response', 'Некоректний список столиків.');
    }
    return { id: table.id, name: table.name, capacity: table.capacity };
  });

  const slots: SlotAvailability[] = value.slots.map((slot) => {
    if (!isRecord(slot) || typeof slot.time !== 'string' || typeof slot.isPast !== 'boolean' || !isRecord(slot.statuses)) {
      throw new AvailabilityError('invalid-response', 'Некоректні часові інтервали.');
    }
    const statuses: Record<string, TableStatus> = {};
    for (const [tableId, status] of Object.entries(slot.statuses)) {
      if (typeof status !== 'string' || !statusValues.includes(status as TableStatus)) {
        throw new AvailabilityError('invalid-response', 'Некоректний статус столика.');
      }
      statuses[tableId] = status as TableStatus;
    }
    return { time: slot.time, isPast: slot.isPast, statuses };
  });

  return {
    date: value.date,
    timezone: typeof value.timezone === 'string' ? value.timezone : 'Europe/Kyiv',
    isOpen: value.isOpen,
    tables,
    slots,
  };
}

// Reads availability for one date through the public RPC. Nothing is inferred on the client.
export async function getDayAvailability(date: string): Promise<DayAvailability> {
  if (!supabase) {
    throw new AvailabilityError('not-configured', 'Сервіс бронювання тимчасово недоступний.');
  }

  const { data, error } = await supabase.rpc('get_public_availability', { p_date: date });
  if (error) {
    throw new AvailabilityError('request-failed', 'Не вдалося завантажити доступність. Спробуйте пізніше.');
  }
  if (data === null) {
    throw new AvailabilityError('invalid-response', 'Некоректна відповідь сервера.');
  }
  return parseDayAvailability(data);
}
