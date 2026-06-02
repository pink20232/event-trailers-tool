/**
 * GEN3 Badge component
 * Source: Figma bMbnylfOWFK9jaISGAM8Xu, node 1805:11620
 * Badges, Signals 🟢
 *
 * Usage:
 *   <Badge variant="going-fast">Going Fast</Badge>
 *   <Badge variant="opportunity" icon="📣">New</Badge>
 *   <Badge variant="custom" style={{ backgroundColor: '#e11d48', color: '#fff' }}>Sold Out</Badge>
 */

import React from 'react';
import styles from './Badge.module.css';

export type BadgeVariant =
  | 'secondary'   // lime green — "GOING FAST" (default brand accent)
  | 'info'
  | 'opportunity'
  | 'success'
  | 'warning'
  | 'danger'
  | 'bold'
  | 'custom';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  bordered?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export function Badge({
  children,
  variant = 'secondary',
  icon,
  bordered = true,
  style,
  className,
}: BadgeProps) {
  return (
    <span
      className={[
        styles.badge,
        styles[`variant-${variant}`],
        bordered ? styles.bordered : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.label}>{children}</span>
    </span>
  );
}

export default Badge;
