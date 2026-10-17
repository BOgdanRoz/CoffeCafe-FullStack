// Database tests for the table availability schema.
// Runs the real migration and seed on PGlite (PostgreSQL compiled to WASM) and checks
// constraints, slot logic, timezone handling and RLS for the anon, customer and owner roles.
//
// Run: npm run test:db

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const OWNER_ID = '00000000-0000-4000-8000-000000000001';
const CUSTOMER_ID = '00000000-0000-4000-8000-000000000002';

// 2026-10-19 is a Monday (weekday hours 08:00-21:00).
// 2026-10-25 is a Sunday (weekend hours 09:00-22:00) and the day European DST ends.
const MONDAY = '2026-10-19';
const SUNDAY_DST = '2026-10-25';
const PAST_DATE = '2026-10-01';

let db;

async function setRole(role, userId) {
  await db.exec(`set role ${role}`);
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId ?? '']);
}

async function resetRole() {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub', '', false)");
}

async function asRole(role, userId, fn) {
  await setRole(role, userId);
  try {
    return await fn();
  } finally {
    await resetRole();
  }
}

async function expectSqlError(promise, expectedCode) {
  await assert.rejects(promise, (error) => {
    assert.equal(error.code, expectedCode, `expected SQLSTATE ${expectedCode}, got ${error.code}: ${error.message}`);
    return true;
  });
}

async function publicAvailability(date) {
  const { rows } = await db.query('select public.get_public_availability($1::date) as value', [date]);
  return rows[0].value;
}

async function tableIdByName(name) {
  const { rows } = await db.query('select id from public.cafe_tables where name = $1', [name]);
  return rows[0].id;
}

async function insertBlock({ table, date, start, end, kind = 'occupied' }) {
  const id = await tableIdByName(table);
  const { rows } = await db.query(
    `insert into public.table_availability_blocks (table_id, block_date, starts_at, ends_at, kind)
     values ($1, $2, $3, $4, $5) returning id`,
    [id, date, start, end, kind],
  );
  return rows[0].id;
}

function slotStatus(day, time, tableName) {
  const slot = day.slots.find((item) => item.time === time);
  assert.ok(slot, `slot ${time} is missing`);
  return slot.statuses[tableIdCache.get(tableName)];
}

const tableIdCache = new Map();

before(async () => {
  db = new PGlite({ extensions: { btree_gist } });

  // Minimal stand-in for the Supabase platform: schemas, auth.users, auth.uid() and API roles.
  await db.exec(`
    create schema if not exists extensions;
    create schema if not exists auth;
    create table auth.users (id uuid primary key, email text unique);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
    do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
    grant usage on schema public, extensions, auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    insert into auth.users (id, email) values
      ('${OWNER_ID}', 'owner@morrow.test'),
      ('${CUSTOMER_ID}', 'customer@morrow.test');
  `);

  await db.exec(readFileSync(join(root, 'migrations', '20261017120000_table_availability.sql'), 'utf8'));
  await db.exec(readFileSync(join(root, 'seed.sql'), 'utf8'));

  // Owner row, as the manual script would insert it. The customer has no profile role.
  await db.exec(`
    insert into public.profiles (id, display_name, role) values
      ('${OWNER_ID}', 'Власник', 'owner'),
      ('${CUSTOMER_ID}', 'Гість', 'customer');
  `);

  for (const row of (await db.query('select id, name from public.cafe_tables')).rows) {
    tableIdCache.set(row.name, row.id);
  }
});

after(async () => {
  await db?.close();
});

describe('schema and seed', () => {
  it('seeds 8 tables with the agreed capacities', async () => {
    const { rows } = await db.query('select name, capacity from public.cafe_tables order by sort_order');
    assert.deepEqual(rows.map((row) => row.capacity), [2, 2, 2, 4, 4, 4, 6, 8]);
    assert.equal(rows.length, 8);
  });

  it('seed can run again without changing data', async () => {
    await db.exec(readFileSync(join(root, 'seed.sql'), 'utf8'));
    const { rows } = await db.query('select count(*)::int as count from public.cafe_tables');
    assert.equal(rows[0].count, 8);
  });

  it('forbids overlapping blocks for the same table', async () => {
    await insertBlock({ table: 'Столик 01', date: '2026-10-20', start: '10:00', end: '12:00' });
    await expectSqlError(
      insertBlock({ table: 'Столик 01', date: '2026-10-20', start: '11:00', end: '13:00', kind: 'unavailable' }),
      '23P01',
    );
  });

  it('allows touching blocks, because intervals are half-open', async () => {
    await insertBlock({ table: 'Столик 02', date: '2026-10-20', start: '10:00', end: '12:00' });
    await insertBlock({ table: 'Столик 02', date: '2026-10-20', start: '12:00', end: '13:00' });
    const { rows } = await db.query(
      "select count(*)::int as count from public.table_availability_blocks where block_date = '2026-10-20' and table_id = $1",
      [await tableIdByName('Столик 02')],
    );
    assert.equal(rows[0].count, 2);
  });

  it('allows overlapping blocks on different tables', async () => {
    await insertBlock({ table: 'Столик 03', date: '2026-10-21', start: '10:00', end: '12:00' });
    await insertBlock({ table: 'Столик 04', date: '2026-10-21', start: '10:00', end: '12:00' });
  });

  it('rejects a block outside opening hours', async () => {
    await expectSqlError(
      insertBlock({ table: 'Столик 05', date: MONDAY, start: '07:00', end: '09:00' }),
      '23514',
    );
    await expectSqlError(
      insertBlock({ table: 'Столик 05', date: MONDAY, start: '20:00', end: '22:00' }),
      '23514',
    );
  });

  it('rejects a block on a closed day', async () => {
    await db.exec(`
      update public.opening_hours set is_closed = true, opens_at = null, closes_at = null where weekday = 2;
    `);
    try {
      await expectSqlError(
        insertBlock({ table: 'Столик 05', date: '2026-10-20', start: '10:00', end: '11:00' }),
        '23514',
      );
    } finally {
      await db.exec(`
        update public.opening_hours set is_closed = false, opens_at = time '08:00', closes_at = time '21:00' where weekday = 2;
      `);
    }
  });

  it('rejects an empty or reversed interval', async () => {
    await expectSqlError(
      insertBlock({ table: 'Столик 05', date: '2026-10-22', start: '12:00', end: '12:00' }),
      '23514',
    );
    await expectSqlError(
      insertBlock({ table: 'Столик 05', date: '2026-10-22', start: '13:00', end: '12:00' }),
      '23514',
    );
  });

  it('rejects an invalid settings row', async () => {
    await expectSqlError(
      db.exec("update public.booking_settings set slot_minutes = 45 where id = 1"),
      '23514',
    );
  });
});

describe('public availability', () => {
  it('offers weekday slots from 08:00 to 19:30 in 30-minute steps', async () => {
    const day = await publicAvailability(MONDAY);
    assert.equal(day.isOpen, true);
    assert.equal(day.timezone, 'Europe/Kyiv');
    assert.equal(day.slots.length, 24);
    assert.equal(day.slots[0].time, '08:00');
    assert.equal(day.slots.at(-1).time, '19:30');
  });

  it('uses weekend hours on Sunday, with the same wall-clock steps across DST', async () => {
    const day = await publicAvailability(SUNDAY_DST);
    assert.equal(day.slots.length, 22);
    assert.equal(day.slots[0].time, '09:00');
    assert.equal(day.slots.at(-1).time, '19:30');
    assert.ok(day.slots.every((slot) => /^\d{2}:(00|30)$/.test(slot.time)));
  });

  it('treats a table as available by default', async () => {
    const day = await publicAvailability('2026-10-26');
    const everyStatusAvailable = day.slots.every((slot) =>
      Object.values(slot.statuses).every((status) => status === 'available'),
    );
    assert.equal(everyStatusAvailable, true);
  });

  it('marks slots whose visit window overlaps a block', async () => {
    await insertBlock({ table: 'Столик 06', date: '2026-10-27', start: '18:00', end: '19:00', kind: 'occupied' });
    await insertBlock({ table: 'Столик 07', date: '2026-10-27', start: '18:00', end: '19:00', kind: 'unavailable' });
    const day = await publicAvailability('2026-10-27');

    // 17:00 visit window is [17:00, 18:30): overlaps the block.
    assert.equal(slotStatus(day, '17:00', 'Столик 06'), 'occupied');
    assert.equal(slotStatus(day, '17:00', 'Столик 07'), 'unavailable');
    // 16:30 visit window is [16:30, 18:00): touches the block only at its start, so it is free.
    assert.equal(slotStatus(day, '16:30', 'Столик 06'), 'available');
    // 19:00 starts exactly when the block ends.
    assert.equal(slotStatus(day, '19:00', 'Столик 06'), 'available');
    // Other tables are not affected.
    assert.equal(slotStatus(day, '17:00', 'Столик 01'), 'available');
  });

  it('applies a block only to its own date', async () => {
    const day = await publicAvailability('2026-10-28');
    assert.equal(slotStatus(day, '18:00', 'Столик 06'), 'available');
  });

  it('hides inactive tables', async () => {
    await db.exec('update public.cafe_tables set is_active = false where name = \'Столик 08\'');
    try {
      const day = await publicAvailability('2026-10-29');
      assert.equal(day.tables.length, 7);
      assert.ok(!day.tables.some((table) => table.name === 'Столик 08'));
    } finally {
      await db.exec('update public.cafe_tables set is_active = true where name = \'Столик 08\'');
    }
  });

  it('reports a closed day without slots', async () => {
    await db.exec(`
      update public.opening_hours set is_closed = true, opens_at = null, closes_at = null where weekday = 3;
    `);
    try {
      const day = await publicAvailability('2026-10-21');
      assert.equal(day.isOpen, false);
      assert.deepEqual(day.slots, []);
    } finally {
      await db.exec(`
        update public.opening_hours set is_closed = false, opens_at = time '08:00', closes_at = time '21:00' where weekday = 3;
      `);
    }
  });

  it('marks every slot of a past date as past', async () => {
    const day = await publicAvailability(PAST_DATE);
    assert.ok(day.slots.length > 0);
    assert.ok(day.slots.every((slot) => slot.isPast === true));
  });

  it('rejects dates more than 120 days ahead and missing dates', async () => {
    await expectSqlError(publicAvailability('2030-01-01'), '22023');
    await expectSqlError(db.query('select public.get_public_availability(null::date)'), '22023');
  });

  it('never returns notes or author ids', async () => {
    await db.exec(`
      update public.table_availability_blocks set note = 'secret internal note' where block_date = '2026-10-27';
    `);
    const day = await publicAvailability('2026-10-27');
    const json = JSON.stringify(day);
    assert.ok(!json.includes('secret internal note'));
    assert.ok(!json.includes(OWNER_ID));
  });
});

describe('row level security and roles', () => {
  it('anon cannot read the blocks table', async () => {
    await asRole('anon', null, () =>
      expectSqlError(db.query('select count(*) from public.table_availability_blocks'), '42501'),
    );
  });

  it('anon cannot write any table', async () => {
    await asRole('anon', null, async () => {
      await expectSqlError(insertBlock({ table: 'Столик 01', date: MONDAY, start: '10:00', end: '11:00' }), '42501');
      await expectSqlError(db.exec("update public.booking_settings set slot_minutes = 60 where id = 1"), '42501');
      await expectSqlError(db.exec("update public.opening_hours set closes_at = time '23:00' where weekday = 1"), '42501');
    });
  });

  it('anon can read public configuration and call the availability function', async () => {
    await asRole('anon', null, async () => {
      const { rows } = await db.query('select count(*)::int as count from public.cafe_tables');
      assert.equal(rows[0].count, 8);
      const day = await publicAvailability(MONDAY);
      assert.equal(day.isOpen, true);
    });
  });

  it('anon sees only active tables', async () => {
    await db.exec('update public.cafe_tables set is_active = false where name = \'Столик 08\'');
    try {
      await asRole('anon', null, async () => {
        const { rows } = await db.query('select count(*)::int as count from public.cafe_tables');
        assert.equal(rows[0].count, 7);
      });
    } finally {
      await db.exec('update public.cafe_tables set is_active = true where name = \'Столик 08\'');
    }
  });

  it('a signed-in customer cannot write availability blocks', async () => {
    await asRole('authenticated', CUSTOMER_ID, async () => {
      await expectSqlError(
        insertBlock({ table: 'Столик 01', date: MONDAY, start: '10:00', end: '11:00' }),
        '42501',
      );
    });
  });

  it('a signed-in customer cannot promote themselves to owner', async () => {
    await asRole('authenticated', CUSTOMER_ID, async () => {
      await expectSqlError(
        db.exec(`update public.profiles set role = 'owner' where id = '${CUSTOMER_ID}'`),
        '42501',
      );
      await expectSqlError(
        db.exec(`insert into public.profiles (id, role) values ('${OWNER_ID}', 'owner') on conflict (id) do update set role = 'owner'`),
        '42501',
      );
    });
    const { rows } = await db.query('select role from public.profiles where id = $1', [CUSTOMER_ID]);
    assert.equal(rows[0].role, 'customer');
  });

  it('a signed-in customer reads only their own profile', async () => {
    await asRole('authenticated', CUSTOMER_ID, async () => {
      const { rows } = await db.query('select id from public.profiles');
      assert.deepEqual(rows.map((row) => row.id), [CUSTOMER_ID]);
    });
  });

  it('the owner can create, read and delete a block; the author is set by the database', async () => {
    const blockId = await asRole('authenticated', OWNER_ID, async () => {
      const id = await insertBlock({ table: 'Столик 02', date: '2026-10-30', start: '14:00', end: '15:00', kind: 'unavailable' });
      const { rows } = await db.query('select created_by from public.table_availability_blocks where id = $1', [id]);
      assert.equal(rows[0].created_by, OWNER_ID);
      return id;
    });

    await asRole('authenticated', OWNER_ID, async () => {
      await db.query('delete from public.table_availability_blocks where id = $1', [blockId]);
    });
    const { rows } = await db.query('select count(*)::int as count from public.table_availability_blocks where id = $1', [blockId]);
    assert.equal(rows[0].count, 0);
  });

  it('the owner cannot create an overlapping block even though the row passes RLS', async () => {
    await asRole('authenticated', OWNER_ID, async () => {
      await insertBlock({ table: 'Столик 01', date: '2026-10-31', start: '10:00', end: '12:00' });
      await expectSqlError(
        insertBlock({ table: 'Столик 01', date: '2026-10-31', start: '11:30', end: '12:30' }),
        '23P01',
      );
    });
  });

  it('the owner can update settings and tables, and changes reach the public view', async () => {
    await asRole('authenticated', OWNER_ID, async () => {
      await db.exec("update public.booking_settings set slot_minutes = 60 where id = 1");
    });
    try {
      const day = await publicAvailability('2026-11-02');
      assert.equal(day.slots.length, 12);
    } finally {
      await asRole('authenticated', OWNER_ID, async () => {
        await db.exec("update public.booking_settings set slot_minutes = 30 where id = 1");
      });
    }
  });
});
