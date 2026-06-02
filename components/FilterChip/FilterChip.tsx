/**
 * GEN3 FilterChip
 * Source: Containers, Layout 🟡
 * Used in: Discover feed filter row ("San Francisco", "Today", "This weekend")
 */

import React from 'react';
import styles from './FilterChip.module.css';

export interface FilterChipProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  disabled?: boolean;
}

export function FilterChip({
  children,
  selected = false,
  onClick,
  icon,
  trailingIcon,
  disabled = false,
}: FilterChipProps) {
  return (
    <button
      type="button"
      className={[
        styles.chip,
        selected ? styles.selected : '',
        disabled ? styles.disabled : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className={styles.leadIcon}>{icon}</span>}
      <span className={styles.label}>{children}</span>
      {trailingIcon && <span className={styles.trailIcon}>{trailingIcon}</span>}
    </button>
  );
}

export default FilterChip;
