-- Initial configuration for Morrow Coffee. Safe to run more than once: every insert is idempotent.
-- Contains no availability blocks, so every table starts as available inside opening hours.

insert into public.cafe_tables (name, capacity, sort_order)
values
  ('Столик 01', 2, 1),
  ('Столик 02', 2, 2),
  ('Столик 03', 2, 3),
  ('Столик 04', 4, 4),
  ('Столик 05', 4, 5),
  ('Столик 06', 4, 6),
  ('Столик 07', 6, 7),
  ('Столик 08', 8, 8)
on conflict (name) do nothing;

-- ISO weekdays: 1 = Monday ... 7 = Sunday. Times are cafe-local (Europe/Kyiv).
insert into public.opening_hours (weekday, is_closed, opens_at, closes_at)
values
  (1, false, time '08:00', time '21:00'),
  (2, false, time '08:00', time '21:00'),
  (3, false, time '08:00', time '21:00'),
  (4, false, time '08:00', time '21:00'),
  (5, false, time '08:00', time '21:00'),
  (6, false, time '09:00', time '22:00'),
  (7, false, time '09:00', time '22:00')
on conflict (weekday) do nothing;

-- One settings row: 30-minute slot grid, 90-minute visit window, first and last slot start.
insert into public.booking_settings (id, slot_minutes, visit_minutes, first_slot, last_slot)
values (1, 30, 90, time '08:00', time '19:30')
on conflict (id) do nothing;
