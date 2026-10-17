import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../../components/ui/Button/Button';
import { listTables, saveTable } from '../adminService';
import type { CafeTableRow } from '../adminService';
import styles from '../admin.module.css';

type Feedback = { type: 'success' | 'error'; text: string } | null;

type Draft = { name: string; capacity: string; sortOrder: string; isActive: boolean };

function toDraft(table: CafeTableRow): Draft {
  return {
    name: table.name,
    capacity: String(table.capacity),
    sortOrder: String(table.sort_order),
    isActive: table.is_active,
  };
}

function parseDraft(draft: Draft): { name: string; capacity: number; sort_order: number; is_active: boolean } | string {
  const name = draft.name.trim();
  const capacity = Number(draft.capacity);
  const sortOrder = Number(draft.sortOrder);
  if (!name) return 'Вкажіть назву столика.';
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 20) return 'Місткість має бути від 1 до 20.';
  if (!Number.isInteger(sortOrder) || sortOrder < 0) return 'Порядок має бути невід’ємним цілим числом.';
  return { name, capacity, sort_order: sortOrder, is_active: draft.isActive };
}

export function TablesPanel() {
  const [tables, setTables] = useState<CafeTableRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [newDraft, setNewDraft] = useState<Draft>({ name: '', capacity: '2', sortOrder: '0', isActive: true });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function reload() {
    try {
      const rows = await listTables();
      setTables(rows);
      setDrafts(Object.fromEntries(rows.map((row) => [row.id, toDraft(row)])));
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Не вдалося завантажити столики.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    listTables()
      .then((rows) => {
        if (!active) return;
        setTables(rows);
        setDrafts(Object.fromEntries(rows.map((row) => [row.id, toDraft(row)])));
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Не вдалося завантажити столики.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSave(table: CafeTableRow) {
    const draft = drafts[table.id];
    const parsed = parseDraft(draft);
    if (typeof parsed === 'string') {
      setFeedback({ type: 'error', text: parsed });
      return;
    }
    setSavingId(table.id);
    try {
      await saveTable({ id: table.id, ...parsed });
      setFeedback({ type: 'success', text: `Столик «${parsed.name}» збережено.` });
      await reload();
    } catch (error) {
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Не вдалося зберегти.' });
    } finally {
      setSavingId(null);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseDraft(newDraft);
    if (typeof parsed === 'string') {
      setFeedback({ type: 'error', text: parsed });
      return;
    }
    setSavingId('new');
    try {
      await saveTable(parsed);
      setNewDraft({ name: '', capacity: '2', sortOrder: String(tables.length + 1), isActive: true });
      setFeedback({ type: 'success', text: `Столик «${parsed.name}» додано.` });
      await reload();
    } catch (error) {
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Не вдалося додати столик.' });
    } finally {
      setSavingId(null);
    }
  }

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  return (
    <section className={styles.panel} aria-labelledby="tables-title">
      <h2 id="tables-title" className={styles.panelTitle}>
        Столики
      </h2>
      <p className={styles.muted}>
        Неактивний столик не показується відвідувачам. Видаляти столики не потрібно: зніміть прапорець «Активний».
      </p>

      {feedback ? (
        <p
          role="status"
          className={`${styles.notice} ${feedback.type === 'success' ? styles.noticeSuccess : styles.noticeError}`}
        >
          {feedback.text}
        </p>
      ) : null}
      {loadError ? (
        <p role="alert" className={`${styles.notice} ${styles.noticeError}`}>
          {loadError}
        </p>
      ) : null}
      {isLoading ? <p className={styles.muted}>Завантажуємо столики…</p> : null}
      {!isLoading && !loadError && tables.length === 0 ? (
        <p className={styles.muted}>Столиків ще немає. Додайте перший нижче.</p>
      ) : null}

      <div className={styles.card}>
        <div className={styles.rowList}>
          {tables.map((table) => {
            const draft = drafts[table.id] ?? toDraft(table);
            return (
              <div key={table.id} className={`${styles.row} ${styles['row-table']}`}>
                <label className={styles.fieldLabel}>
                  Назва
                  <input
                    className={styles.input}
                    value={draft.name}
                    onChange={(event) => updateDraft(table.id, { name: event.target.value })}
                  />
                </label>
                <label className={styles.fieldLabel}>
                  Місткість
                  <input
                    className={styles.input}
                    type="number"
                    min={1}
                    max={20}
                    value={draft.capacity}
                    onChange={(event) => updateDraft(table.id, { capacity: event.target.value })}
                  />
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={draft.isActive}
                    onChange={(event) => updateDraft(table.id, { isActive: event.target.checked })}
                  />
                  Активний
                </label>
                <label className={styles.fieldLabel}>
                  Порядок
                  <input
                    className={styles.input}
                    type="number"
                    min={0}
                    value={draft.sortOrder}
                    onChange={(event) => updateDraft(table.id, { sortOrder: event.target.value })}
                  />
                </label>
                <Button variant="secondary" disabled={savingId === table.id} onClick={() => handleSave(table)}>
                  {savingId === table.id ? 'Зберігаємо…' : 'Зберегти'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <form className={styles.card} onSubmit={handleCreate} aria-labelledby="new-table-title">
        <h3 id="new-table-title" className={styles.rowTitle}>
          Новий столик
        </h3>
        <div className={`${styles.grid} ${styles['grid-3']}`}>
          <label className={styles.fieldLabel}>
            Назва
            <input
              className={styles.input}
              required
              value={newDraft.name}
              onChange={(event) => setNewDraft({ ...newDraft, name: event.target.value })}
            />
          </label>
          <label className={styles.fieldLabel}>
            Місткість
            <input
              className={styles.input}
              type="number"
              min={1}
              max={20}
              value={newDraft.capacity}
              onChange={(event) => setNewDraft({ ...newDraft, capacity: event.target.value })}
            />
          </label>
          <label className={styles.fieldLabel}>
            Порядок
            <input
              className={styles.input}
              type="number"
              min={0}
              value={newDraft.sortOrder}
              onChange={(event) => setNewDraft({ ...newDraft, sortOrder: event.target.value })}
            />
          </label>
        </div>
        <div className={styles.actions}>
          <Button type="submit" disabled={savingId === 'new'}>
            {savingId === 'new' ? 'Додаємо…' : 'Додати столик'}
          </Button>
        </div>
      </form>
    </section>
  );
}
