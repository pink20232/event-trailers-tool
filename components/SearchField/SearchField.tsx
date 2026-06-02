/**
 * GEN3 SearchField — Home variant
 * Source: Inputs, Fields 🟡
 * "Find things to do" bar from Discover feed
 */

import React from 'react';
import styles from './SearchField.module.css';

export interface SearchFieldProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onFilterClick?: () => void;
  showFilterButton?: boolean;
}

export function SearchField({
  placeholder = 'Find things to do',
  value,
  onChange,
  onFilterClick,
  showFilterButton = true,
}: SearchFieldProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inputRow}>
        {/* Search icon */}
        <span className={styles.searchIcon} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <input
          type="search"
          className={styles.input}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          aria-label={placeholder}
        />

        {/* Filter / sliders button */}
        {showFilterButton && (
          <button
            type="button"
            className={styles.filterButton}
            onClick={onFilterClick}
            aria-label="Open filters"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M2.5 5.83333H17.5M5.83333 10H14.1667M9.16667 14.1667H10.8333"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchField;
