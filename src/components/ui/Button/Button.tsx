import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'secondaryLight' | 'inverse';

type SharedProps = {
  variant?: ButtonVariant;
};

function buildClassName(variant: ButtonVariant, className?: string) {
  return [styles.button, styles[variant], className].filter(Boolean).join(' ');
}

export function Button({
  variant = 'primary',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & SharedProps) {
  return <button type={type} className={buildClassName(variant, className)} {...props} />;
}

export function LinkButton({
  variant = 'primary',
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & SharedProps) {
  return <a className={buildClassName(variant, className)} {...props} />;
}
