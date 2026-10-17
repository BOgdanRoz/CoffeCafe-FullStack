import type { TableStatus } from '../../../features/tables/types';
import styles from './StatusIcon.module.css';

type StatusIconProps = {
  status: TableStatus;
};

// Same 14 px glyph box for every status, so icons line up across cards and legend.
export function StatusIcon({ status }: StatusIconProps) {
  return (
    <span className={`${styles.icon} ${styles[status]}`} aria-hidden="true">
      <svg viewBox="0 0 14 14" focusable="false">
        {status === 'available' ? <path d="M3.5 7.2l2.3 2.3 4.7-4.9" /> : null}
        {status === 'occupied' ? <path d="M4 4l6 6M10 4l-6 6" /> : null}
        {status === 'unavailable' ? <path d="M3.5 7h7" /> : null}
      </svg>
    </span>
  );
}
