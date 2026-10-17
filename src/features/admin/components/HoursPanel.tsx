import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/Button/Button';
import { listOpeningHours, saveOpeningHour } from '../adminService';
import type { OpeningHourRow } from '../adminService';
import styles from '../admin.module.css';

const weekdayNames: Record<number, string> = {
  1: 'Понеділок',
  2: 'Вівторок',
  3: 'Середа',
  4: 'Четвер',
  5: 'П’ятниця',
  6: 'Субота',
  7: 'Неділя',
};

type Feedback = { type: 'success' | 'error'; text: string } | null;

export function HoursPanel() {
  const [rows, setRows] = useState<OpeningHourRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    listOpeningHours()
      .then((data) => {
        if (active) setRows(data);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Не вдалося завантажити графік.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function updateRow(weekday: number, patch: Partial<OpeningHourRow>) {
    setRows((current) => current.map((row) => (row.weekday === weekday ? { ...row, ...patch } : row)));
  }

  async function handleSave() {
    for (const row of rows) {
      if (!row.is_closed && (!row.opens_at || !row.closes_at || row.opens_at >= row.closes_at)) {
        setFeedback({
          type: 'error',
          text: `${weekdayNames[row.weekday]}: час відкриття має бути раніше за час закриття.`,
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      for (const row of rows) {
        await saveOpeningHour(row);
      }
      setFeedback({ type: 'success', text: 'Графік роботи збережено.' });
    } catch (error) {
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Не вдалося зберегти графік.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="hours-title">
      <h2 id="hours-title" className={styles.panelTitle}>
        Графік роботи
      </h2>
      <p className={styles.muted}>Час вказано за київським часом. Блокування можна ставити лише в межах графіка.</p>

      {feedback ? (
        <p role="status" className={`${styles.notice} ${feedback.type === 'success' ? styles.noticeSuccess : styles.noticeError}`}>
          {feedback.text}
        </p>
      ) : null}
      {loadError ? (
        <p role="alert" className={`${styles.notice} ${styles.noticeError}`}>
          {loadError}
        </p>
      ) : null}
      {isLoading ? <p className={styles.muted}>Завантажуємо графік…</p> : null}

      {!isLoading && !loadError ? (
        <div className={styles.card}>
          <div className={styles.rowList}>
            {rows.map((row) => (
              <div key={row.weekday} className={`${styles.row} ${styles['row-hours']}`}>
                <span className={styles.rowTitle}>{weekdayNames[row.weekday]}</span>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={row.is_closed}
                    onChange={(event) => updateRow(row.weekday, { is_closed: event.target.checked })}
                  />
                  Зачинено
                </label>
                <label className={styles.fieldLabel}>
                  Відкриття
                  <input
                    className={styles.input}
                    type="time"
                    disabled={row.is_closed}
                    value={row.opens_at?.slice(0, 5) ?? ''}
                    onChange={(event) => updateRow(row.weekday, { opens_at: event.target.value })}
                  />
                </label>
                <label className={styles.fieldLabel}>
                  Закриття
                  <input
                    className={styles.input}
                    type="time"
                    disabled={row.is_closed}
                    value={row.closes_at?.slice(0, 5) ?? ''}
                    onChange={(event) => updateRow(row.weekday, { closes_at: event.target.value })}
                  />
                </label>
              </div>
            ))}
          </div>
          <div className={styles.actions}>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Зберігаємо…' : 'Зберегти графік'}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
