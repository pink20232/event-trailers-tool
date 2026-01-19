'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button, Typography, Stack } from '@eventbrite/marmalade';
import styles from './DescriptionSuggestionDialog.module.css';

interface DescriptionSuggestionDialogProps {
  isOpen: boolean;
  originalText: string;
  suggestion: string;
  explanation: string;
  isLoading?: boolean;
  error?: string | null;
  onApply: (editedSuggestion?: string) => void;
  onSkip: () => void;
  onClose: () => void;
  onDialogStateChange?: (isOpen: boolean) => void;
}

export const DescriptionSuggestionDialog: React.FC<DescriptionSuggestionDialogProps> = ({
  isOpen,
  originalText,
  suggestion,
  explanation,
  isLoading = false,
  error = null,
  onApply,
  onSkip,
  onClose,
  onDialogStateChange,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const skipButtonRef = useRef<HTMLDivElement>(null);
  const [editedSuggestion, setEditedSuggestion] = useState(suggestion);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update edited suggestion when suggestion prop changes
  useEffect(() => {
    if (suggestion) {
      setEditedSuggestion(suggestion);
    }
  }, [suggestion]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustTextareaHeight = () => {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 300; // Max height for the editable textarea
      const newHeight = Math.min(scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    };

    adjustTextareaHeight();
  }, [editedSuggestion, isOpen]);

  // Notify parent of dialog state changes
  useEffect(() => {
    onDialogStateChange?.(isOpen);
  }, [isOpen, onDialogStateChange]);

  // Force light gray button styling on skip button to match Load video button
  useEffect(() => {
    if (skipButtonRef.current) {
      const button = skipButtonRef.current.querySelector('button');
      if (button) {
        button.style.setProperty('background-color', '#E4E5E6', 'important');
        button.style.setProperty('background', '#E4E5E6', 'important');
        button.style.setProperty('border-color', '#E4E5E6', 'important');
        button.style.setProperty('color', '#000000', 'important');
        button.style.setProperty('opacity', '1', 'important');
        button.style.setProperty('-webkit-text-fill-color', '#000000', 'important');
        
        const allChildren = button.querySelectorAll('*');
        allChildren.forEach((child) => {
          if (child instanceof HTMLElement) {
            child.style.setProperty('color', '#000000', 'important');
            child.style.setProperty('opacity', '1', 'important');
            child.style.setProperty('-webkit-text-fill-color', '#000000', 'important');
          }
        });
      }
    }
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      // Focus the dialog container for accessibility
      dialogRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      className={styles.dialog}
      role="dialog"
      aria-modal="false"
      aria-labelledby="suggestion-dialog-title"
      tabIndex={-1}
    >
        <div className={styles.dialogContent}>
          <Stack space="spacing-md">
            {/* Header */}
            <div className={styles.header}>
              <Typography variant="heading-sm">
                <span id="suggestion-dialog-title">Enhancement</span>
              </Typography>
              <button
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close dialog"
                type="button"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15 5L5 15M5 5L15 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className={styles.loadingState}>
                <Typography variant="body-md" color="neutral-600">
                  Generating suggestion...
                </Typography>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className={styles.errorState}>
                <Typography variant="body-sm" color="danger">
                  {error}
                </Typography>
                <Typography variant="body-sm" color="neutral-600">
                  You can continue editing your description manually.
                </Typography>
              </div>
            )}

            {/* Content */}
            {!isLoading && !error && (
              <>
                {/* Original Text Preview */}
                <div className={styles.section}>
                  <Typography variant="body-sm-bold" className={styles.sectionLabel}>
                    Original ({originalText.length} characters)
                  </Typography>
                  <div className={styles.textPreview}>
                    <Typography variant="body-sm" color="neutral-600">
                      {originalText}
                    </Typography>
                  </div>
                </div>

                {/* Suggested Text - Editable */}
                <div className={styles.section}>
                  <Typography variant="body-sm-bold" className={styles.sectionLabel}>
                    Suggested ({editedSuggestion.length} characters)
                  </Typography>
                  <textarea
                    ref={textareaRef}
                    className={styles.editableSuggestion}
                    value={editedSuggestion}
                    onChange={(e) => setEditedSuggestion(e.target.value)}
                    placeholder="Edit the suggestion..."
                    rows={3}
                  />
                </div>

                {/* Explanation */}
                <div className={styles.section}>
                  <Typography variant="body-sm-bold" className={styles.sectionLabel}>
                    Why this works
                  </Typography>
                  <div className={styles.explanation}>
                    <Typography variant="body-sm" color="neutral-600">
                      {explanation}
                    </Typography>
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className={styles.actions}>
              {!isLoading && !error && (
                <>
                  <div ref={skipButtonRef} className={styles.skipButtonWrapper}>
                    <Button 
                      variant="secondary" 
                      onClick={onSkip}
                      className={styles.skipButton}
                    >
                      Skip
                    </Button>
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={() => onApply(editedSuggestion)} 
                    className={styles.applyButton}
                  >
                    Apply
                  </Button>
                </>
              )}
              {error && (
                <Button variant="primary" onClick={onClose} className={styles.applyButton}>
                  Close
                </Button>
              )}
            </div>
          </Stack>
        </div>
      </div>
  );
};
