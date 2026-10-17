import { useState } from 'react';
import { Button } from '../../components/ui/Button/Button';
import { Logo } from '../../components/ui/Logo/Logo';
import { useOwnerSession } from '../../features/admin/useOwnerSession';
import { LoginForm } from '../../features/admin/components/LoginForm';
import { AvailabilityPanel } from '../../features/admin/components/AvailabilityPanel';
import { TablesPanel } from '../../features/admin/components/TablesPanel';
import { HoursPanel } from '../../features/admin/components/HoursPanel';
import { SettingsPanel } from '../../features/admin/components/SettingsPanel';
import styles from '../../features/admin/admin.module.css';

type TabId = 'availability' | 'tables' | 'hours' | 'settings';

const tabs: { id: TabId; label: string }[] = [
  { id: 'availability', label: 'Доступність' },
  { id: 'tables', label: 'Столики' },
  { id: 'hours', label: 'Графік' },
  { id: 'settings', label: 'Налаштування' },
];

export function AdminPage() {
  const { status, email, signIn, signOut } = useOwnerSession();
  const [activeTab, setActiveTab] = useState<TabId>('availability');

  if (status === 'unconfigured') {
    return (
      <main className={styles.loginWrap}>
        <p className={`${styles.notice} ${styles.noticeError}`} role="alert">
          Сервер не налаштовано. Перевірте змінні середовища VITE_SUPABASE_URL і VITE_SUPABASE_PUBLISHABLE_KEY.
        </p>
      </main>
    );
  }

  if (status === 'loading') {
    return (
      <main className={styles.loginWrap}>
        <p className={styles.muted} role="status">
          Перевіряємо доступ…
        </p>
      </main>
    );
  }

  if (status === 'signed-out') {
    return (
      <main className={styles.loginWrap}>
        <LoginForm onSubmit={signIn} />
      </main>
    );
  }

  if (status === 'forbidden') {
    return (
      <main className={styles.loginWrap}>
        <div className={styles.loginCard}>
          <h1 className={styles.panelTitle}>Немає доступу</h1>
          <p className={styles.muted}>Цей обліковий запис не має ролі власника.</p>
          <Button variant="secondary" onClick={signOut}>
            Вийти
          </Button>
        </div>
      </main>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarTitle}>
          <Logo tone="light" />
        </div>
        <div className={styles.actions}>
          <span className={styles.topbarUser}>{email}</span>
          <Button variant="inverse" onClick={signOut}>
            Вийти
          </Button>
        </div>
      </header>

      <main className={styles.body}>
        <div className={styles.tabs} role="tablist" aria-label="Розділи адмін-панелі">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`admin-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`admin-panel-${tab.id}`}
                className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" id={`admin-panel-${activeTab}`} aria-labelledby={`admin-tab-${activeTab}`}>
          {activeTab === 'availability' ? <AvailabilityPanel /> : null}
          {activeTab === 'tables' ? <TablesPanel /> : null}
          {activeTab === 'hours' ? <HoursPanel /> : null}
          {activeTab === 'settings' ? <SettingsPanel /> : null}
        </div>
      </main>
    </div>
  );
}
