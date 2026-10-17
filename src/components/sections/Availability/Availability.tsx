import { useState } from 'react';
import { Container } from '../../layout/Container/Container';
import { SectionHeading } from '../../ui/SectionHeading/SectionHeading';
import { Botanical } from '../../ui/Botanical/Botanical';
import { LinkButton, Button } from '../../ui/Button/Button';
import { StatusIcon } from '../../ui/StatusIcon/StatusIcon';
import { cafe } from '../../../data/cafe';
import { useDayAvailability } from '../../../features/tables/useDayAvailability';
import type { TableStatus } from '../../../features/tables/types';
import { formatDisplayDate, toIsoDate } from '../../../features/tables/schedule';
import styles from './Availability.module.css';

const statusMeta: Record<TableStatus, { label: string }> = {
  available: { label: 'Вільний' },
  occupied: { label: 'Зайнятий' },
  unavailable: { label: 'Недоступний' },
};

// Must match the server limit in get_public_availability (120 days).
const MAX_DAYS_AHEAD = 120;

const statusOrder: TableStatus[] = ['available', 'occupied', 'unavailable'];

export function Availability() {
  // Default to today. Changing the date clears the chosen time and table.
  // Date limits are computed once per mount, so render stays pure.
  const [dateLimits] = useState(() => ({
    min: toIsoDate(new Date()),
    max: toIsoDate(new Date(Date.now() + MAX_DAYS_AHEAD * 86_400_000)),
  }));
  const [date, setDate] = useState(dateLimits.min);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const { status, data, errorMessage, retry } = useDayAvailability(date);

  const slot = data?.slots.find((item) => item.time === selectedTime) ?? null;
  const tables = data?.tables ?? [];

  // A table stays selected only while it is still free for the chosen slot.
  const selectedTable =
    slot && !slot.isPast && selectedTableId && slot.statuses[selectedTableId] === 'available'
      ? tables.find((table) => table.id === selectedTableId) ?? null
      : null;

  function handleDateChange(value: string) {
    setDate(value);
    setSelectedTime(null);
    setSelectedTableId(null);
  }

  function handleTimeChange(time: string) {
    setSelectedTime(time);
    setSelectedTableId(null);
  }

  return (
    <section id="availability" className={styles.availability} aria-labelledby="availability-title">
      <Botanical variant="rise" className={styles.vine} />
      <Container className={styles.inner}>
        <SectionHeading
          id="availability-title"
          eyebrow="Столики"
          title="Перевірте вільні столики"
          description="Оберіть дату і час, щоб побачити вільні столики. Вибір столика на сайті не є бронюванням: узгодьте його з кав’ярнею напряму."
        />

        <div className={styles.controls}>
          <div className={styles.field}>
            <label htmlFor="availability-date" className={styles.label}>
              Дата
            </label>
            <input
              id="availability-date"
              type="date"
              className={styles.control}
              min={dateLimits.min}
              max={dateLimits.max}
              value={date}
              onChange={(event) => handleDateChange(event.target.value)}
            />
          </div>

          <fieldset className={styles.fieldset}>
            <legend className={styles.label}>Часовий інтервал</legend>
            {status === 'loading' ? (
              <p className={styles.muted} role="status">
                Завантажуємо доступність…
              </p>
            ) : null}
            {status === 'error' ? (
              <div className={styles.errorBox} role="alert">
                <p>{errorMessage ?? "Не вдалося завантажити доступність."}</p>
                <Button variant="secondary" onClick={retry}>
                  Спробувати ще раз
                </Button>
              </div>
            ) : null}
            {status === 'ready' && data && !data.isOpen ? (
              <p className={styles.muted} role="status">
                Кав’ярня цього дня зачинена. Оберіть іншу дату.
              </p>
            ) : null}
            {status === 'ready' && data && data.isOpen ? (
              <ul className={styles.slots}>
                {data.slots.map((item) => {
                  const freeCount = tables.filter((table) => item.statuses[table.id] === 'available').length;
                  const isSelected = item.time === selectedTime;
                  return (
                    <li key={item.time}>
                      <button
                        type="button"
                        className={`${styles.slot} ${isSelected ? styles.slotSelected : ''}`}
                        aria-pressed={isSelected}
                        disabled={item.isPast}
                        onClick={() => handleTimeChange(item.time)}
                      >
                        <span className={styles.slotTime}>{item.time}</span>
                        <span className={styles.slotMeta}>
                          {item.isPast ? 'Час минув' : `вільно ${freeCount} з ${tables.length}`}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </fieldset>
        </div>

        <div className={styles.tablesBlock}>
          <ul className={styles.legend} aria-label="Легенда статусів">
            {statusOrder.map((key) => (
              <li key={key} className={styles.legendItem}>
                <StatusIcon status={key} />
                <span>{statusMeta[key].label}</span>
              </li>
            ))}
          </ul>

          {status === 'ready' && data?.isOpen && !slot ? (
            <p className={styles.muted}>Оберіть часовий інтервал, щоб побачити статуси столиків.</p>
          ) : null}

          {status === 'ready' && slot ? (
            <ul className={styles.tables} aria-label={`Столики на ${formatDisplayDate(date)} о ${slot.time}`}>
              {tables.map((table) => {
                const tableStatus = slot.statuses[table.id];
                const isSelectable = tableStatus === 'available' && !slot.isPast;
                const isSelected = selectedTable?.id === table.id;
                return (
                  <li
                    key={table.id}
                    className={`${styles.table} ${styles[tableStatus]} ${isSelected ? styles.tableSelected : ''}`}
                  >
                    <h3 className={styles.tableName}>{table.name}</h3>
                    <span className={styles.badge}>
                      <StatusIcon status={tableStatus} />
                      {statusMeta[tableStatus].label}
                    </span>
                    <p className={styles.capacity}>
                      <svg className={styles.seatIcon} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                        <circle cx="8" cy="4" r="2.5" fill="currentColor" />
                        <path d="M3.5 14v-4.2a4.5 4.5 0 0 1 9 0V14" fill="currentColor" />
                      </svg>
                      До {table.capacity} гостей
                    </p>
                    <div className={styles.action}>
                      {isSelectable ? (
                        <Button
                          variant="secondary"
                          className={styles.pick}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedTableId(table.id)}
                        >
                          {isSelected ? 'Обрано' : 'Обрати столик'}
                        </Button>
                      ) : (
                        <span className={styles.unavailableText}>
                          {slot.isPast ? 'Час минув' : 'Не можна обрати'}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <div className={styles.summary} aria-live="polite">
          <div className={styles.summaryMain}>
            {selectedTable && slot ? (
              <p className={styles.summaryText}>
                Обрано: <strong>{selectedTable.name}</strong>, {formatDisplayDate(date)} о {slot.time}. Це ще
                не бронювання.
              </p>
            ) : (
              <p className={styles.summaryText}>Оберіть вільний столик, щоб продовжити.</p>
            )}
            <p className={styles.policy}>
              Щоб підтвердити столик, напишіть кав’ярні в Instagram і назвіть дату, час та номер столика.
              Бронювання узгоджується безпосередньо з кав’ярнею.
            </p>
          </div>

          <LinkButton
            href={cafe.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.cta}
          >
            Написати в Instagram
          </LinkButton>
        </div>
      </Container>
    </section>
  );
}
