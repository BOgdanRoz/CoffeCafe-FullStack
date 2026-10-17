import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../../components/ui/Button/Button';
import styles from '../admin.module.css';

type LoginFormProps = {
  onSubmit: (email: string, password: string) => Promise<string | null>;
};

export function LoginForm({ onSubmit }: LoginFormProps) {
  const formId = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const message = await onSubmit(email.trim(), password);
    setIsSubmitting(false);
    if (message) {
      setError(message);
      setPassword('');
    }
  }

  return (
    <form className={styles.loginCard} onSubmit={handleSubmit} noValidate>
      <div className={styles.panel}>
        <h1 className={styles.panelTitle}>Вхід для власника</h1>
        <p className={styles.muted}>Керування столиками, блокуваннями та графіком роботи.</p>
      </div>

      <label className={styles.fieldLabel} htmlFor={`${formId}-email`}>
        Email
        <input
          id={`${formId}-email`}
          type="email"
          autoComplete="username"
          required
          className={styles.input}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      <label className={styles.fieldLabel} htmlFor={`${formId}-password`}>
        Пароль
        <input
          id={`${formId}-password`}
          type="password"
          autoComplete="current-password"
          required
          className={styles.input}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      {error ? (
        <p className={`${styles.notice} ${styles.noticeError}`} role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting || !email || !password}>
        {isSubmitting ? 'Входимо…' : 'Увійти'}
      </Button>
    </form>
  );
}
