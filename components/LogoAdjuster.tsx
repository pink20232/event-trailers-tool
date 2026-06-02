'use client';

import React, { useRef, useEffect } from 'react';
import styles from './LogoAdjuster.module.css';

export interface LogoAdjust {
  scale: number; // 1.0 – 3.0
  x: number;     // px offset from center
  y: number;     // px offset from center
}

interface LogoAdjusterProps {
  logoSrc: string;
  adjust: LogoAdjust;
  onChange: (adjust: LogoAdjust) => void;
  onClose: () => void;
}

export const LogoAdjuster: React.FC<LogoAdjusterProps> = ({
  logoSrc, adjust, onChange, onClose,
}) => {
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  // Always read the latest adjust value in the mousemove handler
  const adjustRef = useRef(adjust);
  adjustRef.current = adjust;

  // Clamp offset so the image never shows empty space inside the circle
  const clamp = (val: number, scale: number) => {
    const max = 40 * (scale - 1) / 2;
    return Math.max(-max, Math.min(max, val));
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      const cur = adjustRef.current;
      onChange({
        ...cur,
        x: clamp(cur.x + dx, cur.scale),
        y: clamp(cur.y + dy, cur.scale),
      });
    };
    const onUp = () => { isDragging.current = false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [onChange]);

  const handleScaleChange = (scale: number) => {
    onChange({
      scale,
      x: clamp(adjust.x, scale),
      y: clamp(adjust.y, scale),
    });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Adjust logo</span>
        <button className={styles.doneBtn} type="button" onClick={onClose}>Done</button>
      </div>

      {/* Draggable circular preview */}
      <div
        className={styles.previewCircle}
        onMouseDown={(e) => {
          isDragging.current = true;
          lastPos.current = { x: e.clientX, y: e.clientY };
          e.preventDefault();
        }}
      >
        <img
          src={logoSrc}
          className={styles.previewImg}
          style={{ transform: `translate(${adjust.x}px, ${adjust.y}px) scale(${adjust.scale})` }}
          alt=""
          draggable={false}
        />
      </div>
      <p className={styles.hint}>Drag to reposition</p>

      {/* Zoom slider */}
      <div className={styles.sliderRow}>
        <span className={styles.sliderIcon}>−</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={adjust.scale}
          onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
          className={styles.slider}
        />
        <span className={styles.sliderIcon}>+</span>
      </div>

      <button
        className={styles.resetBtn}
        type="button"
        onClick={() => onChange({ scale: 1, x: 0, y: 0 })}
      >
        Reset
      </button>
    </div>
  );
};
