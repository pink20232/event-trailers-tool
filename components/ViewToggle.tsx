'use client';

import React from 'react';
import styles from './ViewToggle.module.css';

interface ViewToggleProps {
  value: 'mobile' | 'desktop';
  onChange: (value: 'mobile' | 'desktop') => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ value, onChange }) => {
  return (
    <div className={styles.toggleContainer}>
      <div className={styles.toggleGroup} role="group" aria-label="View mode toggle">
        {/* Buttons removed as requested */}
      </div>
    </div>
  );
};

