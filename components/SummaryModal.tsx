'use client';

import React, { useState, useEffect, useRef } from 'react';
import { trimToWordBoundary } from '@/lib/summaryLimits';
import styles from './SummaryModal.module.css';

interface SummaryModalProps {
  initialDescription: string;
  onDone: (description: string) => void;
  onClose: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  initialDescription,
  onDone,
  onClose,
}) => {
  const [description, setDescription] = useState(initialDescription);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [suggested, setSuggested] = useState<string | null>(null);
  const [why, setWhy] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on open
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleOptimize = async () => {
    if (!description.trim() || isOptimizing) return;
    setIsOptimizing(true);
    setSuggested(null);
    setWhy(null);

    try {
      const res = await fetch('/api/description-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      if (res.ok) {
        const data = await res.json();
        // Only surface if we actually got real copy back
        if (data.suggestion && data.suggestion.trim()) {
          setSuggested(data.suggestion.trim());
          setWhy(data.explanation?.trim() ?? '');
        }
      }
    } catch (err) {
      console.error('Optimize error:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleDone = () => {
    onDone(description.trim());
  };

  const handleApplySuggestion = () => {
    onDone(suggested ?? '');
  };

  const handleKeepOriginal = () => {
    onDone(trimToWordBoundary(description));
  };

  const hasSuggestion = suggested !== null && suggested !== '';

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Event Summary">
        {/* TopBar */}
        <div className={styles.topBar}>
          <p className={styles.modalTitle}>Event Summary</p>
          <button className={styles.closeBtn} type="button" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className={styles.divider} />

        {/* Scrollable content */}
        <div className={styles.content}>
          {/* Description field */}
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Description</p>
            <textarea
              ref={textareaRef}
              className={styles.textareaField}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what attendees will experience and take away. Include specifics: what they'll taste, see, learn, or feel."
            />
          </div>

          {/* Optimize button */}
          <button
            className={styles.optimizeBtn}
            type="button"
            onClick={handleOptimize}
            disabled={isOptimizing || !description.trim()}
          >
            {isOptimizing ? (
              <span className={styles.spinner} />
            ) : (
              <img src="/icons/Icon_Optimize.svg" className={styles.optimizeBtnIcon} width={16} height={16} alt="" />
            )}
            <span className={styles.optimizeBtnText}>Sharpen with AI</span>
          </button>

          {/* Suggested section — appears after optimization */}
          {hasSuggestion && (
            <>
              <div className={styles.divider} />
              <div className={styles.suggestedSection}>
                <div className={styles.section}>
                  <p className={styles.sectionLabel}>Suggested</p>
                  <textarea
                    className={styles.suggestedField}
                    value={suggested}
                    onChange={(e) => setSuggested(e.target.value)}
                    readOnly
                  />
                </div>
                {why && (
                  <div className={styles.whySection}>
                    <p className={styles.whyLabel}>Why this works</p>
                    <p className={styles.whyBody}>{why}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Bottom action bar */}
        <div className={styles.bottomBar}>
          {hasSuggestion ? (
            <>
              <button className={styles.keepBtn} type="button" onClick={handleKeepOriginal}>
                Keep original
              </button>
              <button className={styles.applyBtn} type="button" onClick={handleApplySuggestion}>
                Apply suggestion
              </button>
            </>
          ) : (
            <button className={styles.doneBtn} type="button" onClick={handleDone}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="#161719" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
