import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../../components/ui/Button/Button';
import { getBookingSettings, saveBookingSettings } from '../adminService';
import type { BookingSettingsRow } from '../adminService';
import styles from '../admin.module.css';

type Feedback = { type: 'success' | 'error'; text: string } | null;

type Draft = {
  slotMinutes: string;
  visitMinutes: string;
  firstSlot: string;
  lastSlot: string;
};

export function SettingsPanel() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getBookingSettings()
      .then((settings: BookingSettingsRow) => {
        if (active) {
          setDraft({
            slotMinutes: String(settings.slot_minutes),
            visitMinutes: String(settings.visit_minutes),
            firstSlot: settings.first_slot.slice(0, 5),
            lastSlot: settings.last_slot.slice(0, 5),
          });
        }
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Не вдалося завантажити налаштування.');
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;

    const slotMinutes = Number(draft.slotMinutes);
    const visitMinutes = Number(draft.visitMinutes);
    if (![15, 30, 60].includes(slotMinutes)) {
      setFeedback({ type: 'error', text: 'Крок слотів має бути 15, 30 або 60 хвилин.' });
      return;
    }
    if (!Number.isInteger(visitMinutes) || visitMinutes < 30 || visitMinutes > 240) {
      setFeedback({ type: 'error', text: 'Тривалість відвідування має бути від 30 до 240 хвилин.' });
      return;
    }
    if (!draft.firstSlot || !draft.lastSlot || draft.firstSlot > draft.lastSlot) {
      setFeedback({ type: 'error', text: 'Перший слот не може бути пізніше за останній.' });
      return;
    }

    setIsSaving(true);
    try {
      await saveBookingSettings({
        slot_minutes: slotMinutes,
        visit_minutes: visitMinutes,
        first_slot: draft.firstSlot,
        last_slot: draft.lastSlot,
      });
      setFeedback({ type: 'success', text: 'Налаштування збережено.' });
    } catch (error) {
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Не вдалося зберегти.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="settings-title">
      <h2 id="settings-title" className={styles.panelTitle}>
        Налаштування бронювання
      </h2>
      <p className={styles.muted}>
        Ці значення визначають сітку часових слотів і тривалість, на яку столик вважається зайнятим.
      </p>

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
      {!draft && !loadError ? <p className={styles.muted}>Завантажуємо налаштування…</p> : null}

      {draft ? (
        <form className={styles.card} onSubmit={handleSubmit} noValidate>
          <div className={`${styles.grid} ${styles['grid-2']}`}>
            <label className={styles.fieldLabel}>
              Крок слотів, хв
              <select
                className={styles.select}
                value={draft.slotMinutes}
                onChange={(event) => setDraft({ ...draft, slotMinutes: event.target.value })}
              >
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="60">60</option>
              </select>
            </label>
            <label className={styles.fieldLabel}>
              Тривалість відвідування, хв
              <input
                className={styles.input}
                type="number"
                min={30}
                max={240}
                step={15}
                value={draft.visitMinutes}
                onChange={(event) => setDraft({ ...draft, visitMinutes: event.target.value })}
              />
            </label>
            <label className={styles.fieldLabel}>
              Перший слот
              <input
                className={styles.input}
                type="time"
                value={draft.firstSlot}
                onChange={(event) => setDraft({ ...draft, firstSlot: event.target.value })}
              />
            </label>
            <label className={styles.fieldLabel}>
              Останній початок слоту
              <input
                className={styles.input}
                type="time"
                value={draft.lastSlot}
                onChange={(event) => setDraft({ ...draft, lastSlot: event.target.value })}
              />
            </label>
          </div>
          <div className={styles.actions}>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Зберігаємо…' : 'Зберегти налаштування'}
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
