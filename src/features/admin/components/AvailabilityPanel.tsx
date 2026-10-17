import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../../components/ui/Button/Button';
import { toIsoDate } from '../../tables/schedule';
import { addBlock, listBlocks, listTables, removeBlock } from '../adminService';
import type { BlockRow, CafeTableRow } from '../adminService';
import type { BlockKind } from '../../../lib/supabase/types';
import styles from '../admin.module.css';

type Feedback = { type: 'success' | 'error'; text: string } | null;

const kindLabels: Record<BlockKind, string> = {
  occupied: 'Зайнятий',
  unavailable: 'Недоступний',
};

const emptyForm = { tableId: '', startsAt: '', endsAt: '', kind: 'occupied' as BlockKind, note: '' };

export function AvailabilityPanel() {
  const [date, setDate] = useState(() => toIsoDate(new Date()));
  const [tables, setTables] = useState<CafeTableRow[]>([]);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  // The date whose blocks are currently loaded. Loading means this differs from the chosen date.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  // Reload blocks for the chosen date. Results from an earlier date are ignored.
  useEffect(() => {
    let active = true;
    Promise.all([listTables(), listBlocks(date)])
      .then(([tableRows, blockRows]) => {
        if (!active) return;
        setTables(tableRows);
        setBlocks(blockRows);
        setLoadError(null);
        setLoadedFor(date);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : 'Не вдалося завантажити дані.');
        setLoadedFor(date);
      });
    return () => {
      active = false;
    };
  }, [date, reloadToken]);

  const isLoading = loadedFor !== date;
  const activeTables = tables.filter((table) => table.is_active);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.tableId || !form.startsAt || !form.endsAt) {
      setFeedback({ type: 'error', text: 'Оберіть столик і вкажіть початок та кінець.' });
      return;
    }
    if (form.endsAt <= form.startsAt) {
      setFeedback({ type: 'error', text: 'Час завершення має бути пізніше за час початку.' });
      return;
    }

    setIsSaving(true);
    try {
      await addBlock({
        tableId: form.tableId,
        date,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
        kind: form.kind,
        note: form.note,
      });
      setForm({ ...emptyForm, tableId: form.tableId });
      setFeedback({ type: 'success', text: 'Блокування збережено. Публічна сторінка оновиться протягом хвилини.' });
      setReloadToken((value) => value + 1);
    } catch (error) {
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Не вдалося зберегти блокування.' });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove(id: string) {
    setIsSaving(true);
    try {
      await removeBlock(id);
      setFeedback({ type: 'success', text: 'Блокування знято.' });
      setReloadToken((value) => value + 1);
    } catch (error) {
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Не вдалося зняти блокування.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="availability-admin-title">
      <h2 id="availability-admin-title" className={styles.panelTitle}>
        Доступність столиків
      </h2>
      <p className={styles.muted}>
        Позначте столик зайнятим або недоступним на потрібний період. Без блокування столик вільний у межах графіка.
      </p>

      <div className={styles.card}>
        <label className={styles.fieldLabel}>
          Дата
          <input
            className={styles.input}
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setFeedback(null);
            }}
          />
        </label>
      </div>

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
      {isLoading ? <p className={styles.muted}>Завантажуємо блокування…</p> : null}

      {!isLoading && !loadError ? (
        <>
          <form className={styles.card} onSubmit={handleAdd} aria-labelledby="add-block-title">
            <h3 id="add-block-title" className={styles.rowTitle}>
              Нове блокування
            </h3>
            <div className={`${styles.grid} ${styles['grid-3']}`}>
              <label className={styles.fieldLabel}>
                Столик
                <select
                  className={styles.select}
                  value={form.tableId}
                  onChange={(event) => setForm({ ...form, tableId: event.target.value })}
                >
                  <option value="">Оберіть столик</option>
                  {activeTables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.name} (до {table.capacity})
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.fieldLabel}>
                Початок
                <input
                  className={styles.input}
                  type="time"
                  value={form.startsAt}
                  onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
                />
              </label>
              <label className={styles.fieldLabel}>
                Кінець
                <input
                  className={styles.input}
                  type="time"
                  value={form.endsAt}
                  onChange={(event) => setForm({ ...form, endsAt: event.target.value })}
                />
              </label>
              <label className={styles.fieldLabel}>
                Статус
                <select
                  className={styles.select}
                  value={form.kind}
                  onChange={(event) => setForm({ ...form, kind: event.target.value as BlockKind })}
                >
                  <option value="occupied">Зайнятий</option>
                  <option value="unavailable">Недоступний</option>
                </select>
              </label>
              <label className={styles.fieldLabel}>
                Примітка (видна лише вам)
                <input
                  className={styles.input}
                  maxLength={300}
                  value={form.note}
                  onChange={(event) => setForm({ ...form, note: event.target.value })}
                />
              </label>
            </div>
            <div className={styles.actions}>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Зберігаємо…' : 'Додати блокування'}
              </Button>
            </div>
          </form>

          <div className={styles.grid} style={{ gap: 'var(--space-4)' }}>
            {tables.map((table) => {
              const tableBlocks = blocks.filter((block) => block.table_id === table.id);
              return (
                <article key={table.id} className={styles.card}>
                  <div className={styles.actions} style={{ justifyContent: 'space-between' }}>
                    <h3 className={styles.rowTitle}>
                      {table.name}
                      {table.is_active ? '' : ' (неактивний)'}
                    </h3>
                    <span className={styles.muted}>до {table.capacity} гостей</span>
                  </div>
                  {tableBlocks.length === 0 ? (
                    <p className={styles.muted}>Блокувань немає, столик вільний у межах графіка.</p>
                  ) : (
                    tableBlocks.map((block) => (
                      <div key={block.id} className={styles.blockItem}>
                        <span>
                          {block.starts_at.slice(0, 5)}–{block.ends_at.slice(0, 5)}
                        </span>
                        <span
                          className={`${styles.kindBadge} ${block.kind === 'occupied' ? styles.kindOccupied : styles.kindUnavailable}`}
                        >
                          {kindLabels[block.kind]}
                        </span>
                        {block.note ? <span className={styles.muted}>{block.note}</span> : null}
                        <Button variant="secondary" disabled={isSaving} onClick={() => handleRemove(block.id)}>
                          Зняти
                        </Button>
                      </div>
                    ))
                  )}
                </article>
              );
            })}
          </div>
          {tables.length === 0 ? <p className={styles.muted}>Спочатку додайте столики.</p> : null}
        </>
      ) : null}
    </section>
  );
}
