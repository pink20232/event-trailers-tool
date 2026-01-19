'use client';

import React from 'react';
import styles from './MobileMockup.module.css';

interface MobileMockupProps {
  children: React.ReactNode;
  isMobile: boolean;
}

export const MobileMockup: React.FC<MobileMockupProps> = ({ 
  children, 
  isMobile 
}) => {
  if (!isMobile) {
    return (
      <div className={styles.desktopContainer}>
        {children}
      </div>
    );
  }

  return (
    <div className={styles.mobileMockup}>
      <div className={styles.phoneFrame}>
        <div className={styles.phoneNotch} />
        <div className={styles.phoneScreen}>
          {children}
        </div>
      </div>
    </div>
  );
};


