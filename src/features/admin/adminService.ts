import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase/client';
import type { BlockKind } from '../../lib/supabase/types';

// Every call goes through RLS. The owner check is enforced by PostgreSQL (public.is_owner()),
// so hiding buttons in React is only a convenience, never the security boundary.

export type CafeTableRow = {
  id: string;
  name: string;
  capacity: number;
  is_active: boolean;
  sort_order: number;
};

export type OpeningHourRow = {
  weekday: number;
  is_closed: boolean;
  opens_at: string | null;
  closes_at: string | null;
};

export type BookingSettingsRow = {
  slot_minutes: number;
  visit_minutes: number;
  first_slot: string;
  last_slot: string;
};

export type BlockRow = {
  id: string;
  table_id: string;
  block_date: string;
  starts_at: string;
  ends_at: string;
  kind: BlockKind;
  note: string | null;
};

export class AdminServiceError extends Error {}

function requireClient() {
  if (!supabase) {
    throw new AdminServiceError('Сервер не налаштовано. Перевірте змінні середовища.');
  }
  return supabase;
}

// Turns PostgreSQL and PostgREST errors into messages the owner can act on.
export function describeDbError(error: PostgrestError | null | undefined): string {
  if (!error) {
    return 'Невідома помилка.';
  }
  switch (error.code) {
    case '23P01':
      return 'Цей період уже перетинається з іншим блокуванням цього столика.';
    case '23505':
      return 'Столик із такою назвою вже існує.';
    case '23514':
      if (error.message.includes('opening hours')) {
        return 'Блокування має бути в межах графіка роботи цього дня.';
      }
      if (error.message.includes('end after')) {
        return 'Час завершення має бути пізніше за час початку.';
      }
      return 'Значення не відповідає правилам (перевірте місткість, час і тривалість).';
    case '42501':
      return 'Недостатньо прав. Увійдіть як власник.';
    default:
      return 'Не вдалося зберегти зміни. Спробуйте ще раз.';
  }
}

function fail(error: PostgrestError): never {
  throw new AdminServiceError(describeDbError(error));
}

export async function listTables(): Promise<CafeTableRow[]> {
  const { data, error } = await requireClient()
    .from('cafe_tables')
    .select('id, name, capacity, is_active, sort_order')
    .order('sort_order')
    .order('name');
  if (error) fail(error);
  return data ?? [];
}

export async function saveTable(table: Omit<CafeTableRow, 'id'> & { id?: string }): Promise<void> {
  const client = requireClient();
  const values = {
    name: table.name,
    capacity: table.capacity,
    is_active: table.is_active,
    sort_order: table.sort_order,
  };
  const result = table.id
    ? await client.from('cafe_tables').update(values).eq('id', table.id)
    : await client.from('cafe_tables').insert(values);
  if (result.error) fail(result.error);
}

export async function listOpeningHours(): Promise<OpeningHourRow[]> {
  const { data, error } = await requireClient()
    .from('opening_hours')
    .select('weekday, is_closed, opens_at, closes_at')
    .order('weekday');
  if (error) fail(error);
  return data ?? [];
}

export async function saveOpeningHour(row: OpeningHourRow): Promise<void> {
  const { error } = await requireClient()
    .from('opening_hours')
    .update({
      is_closed: row.is_closed,
      opens_at: row.is_closed ? null : row.opens_at,
      closes_at: row.is_closed ? null : row.closes_at,
    })
    .eq('weekday', row.weekday);
  if (error) fail(error);
}

export async function getBookingSettings(): Promise<BookingSettingsRow> {
  const { data, error } = await requireClient()
    .from('booking_settings')
    .select('slot_minutes, visit_minutes, first_slot, last_slot')
    .eq('id', 1)
    .single();
  if (error) fail(error);
  return data;
}

export async function saveBookingSettings(settings: BookingSettingsRow): Promise<void> {
  const { error } = await requireClient().from('booking_settings').update(settings).eq('id', 1);
  if (error) fail(error);
}

export async function listBlocks(date: string): Promise<BlockRow[]> {
  const { data, error } = await requireClient()
    .from('table_availability_blocks')
    .select('id, table_id, block_date, starts_at, ends_at, kind, note')
    .eq('block_date', date)
    .order('starts_at');
  if (error) fail(error);
  return data ?? [];
}

export async function addBlock(input: {
  tableId: string;
  date: string;
  startsAt: string;
  endsAt: string;
  kind: BlockKind;
  note: string;
}): Promise<void> {
  const { error } = await requireClient()
    .from('table_availability_blocks')
    .insert({
      table_id: input.tableId,
      block_date: input.date,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      kind: input.kind,
      note: input.note.trim() || null,
    });
  if (error) fail(error);
}

export async function removeBlock(id: string): Promise<void> {
  const { error } = await requireClient().from('table_availability_blocks').delete().eq('id', id);
  if (error) fail(error);
}
