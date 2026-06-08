'use client';

import React from 'react';
import styles from './MobileMockup.module.css';

interface MobileMockupProps {
  children: React.ReactNode;
  isMobile: boolean;
}

export const MobileMockup: React.FC<MobileMockupProps> = ({
  children,
  isMobile,
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
        {/* Screen — visible through the PNG's transparent window */}
        <div className={styles.phoneScreen}>
          {children}
        </div>

        {/*
         * iPhone 15 Pro Black Titanium frame PNG — sits on top of the screen
         * content.  The screen area inside the PNG is fully transparent, so
         * .phoneScreen (cream bg + event card) shows through naturally.
         * Dynamic Island and bezels are rendered by the PNG itself.
         */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/iphone-frame.png"
          className={styles.phoneFrameOverlay}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      </div>
    </div>
  );
};
