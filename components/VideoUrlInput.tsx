'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TextField, Button, Stack } from '@eventbrite/marmalade';
import { parseVideoUrl, isValidVideoUrl, getPlatformName, type VideoInfo } from '@/lib/videoUtils';
import styles from './VideoUrlInput.module.css';

interface VideoUrlInputProps {
  onVideoLoad: (videoInfo: VideoInfo) => void;
  disabled?: boolean;
}

export const VideoUrlInput: React.FC<VideoUrlInputProps> = ({ 
  onVideoLoad, 
  disabled = false 
}) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Ensure button background is #E4E5E6 and text is 100% black with no opacity
  useEffect(() => {
    if (buttonRef.current) {
      const button = buttonRef.current.querySelector('button');
      if (button) {
        // Set background color
        button.style.setProperty('background-color', '#E4E5E6', 'important');
        button.style.setProperty('background', '#E4E5E6', 'important');
        button.style.setProperty('border-color', '#E4E5E6', 'important');
        
        // Set color and opacity on button itself
        button.style.setProperty('color', '#000000', 'important');
        button.style.setProperty('opacity', '1', 'important');
        button.style.setProperty('-webkit-text-fill-color', '#000000', 'important');
        
        // Set color and opacity on all child elements (including text nodes' parent elements)
        const allChildren = button.querySelectorAll('*');
        allChildren.forEach((child) => {
          if (child instanceof HTMLElement) {
            child.style.setProperty('color', '#000000', 'important');
            child.style.setProperty('opacity', '1', 'important');
            child.style.setProperty('-webkit-text-fill-color', '#000000', 'important');
          }
        });
        
        // Also target text nodes by finding their parent elements
        const walker = document.createTreeWalker(
          button,
          NodeFilter.SHOW_TEXT,
          null
        );
        let node;
        while (node = walker.nextNode()) {
          if (node.parentElement) {
            node.parentElement.style.setProperty('color', '#000000', 'important');
            node.parentElement.style.setProperty('opacity', '1', 'important');
            node.parentElement.style.setProperty('-webkit-text-fill-color', '#000000', 'important');
          }
        }
      }
    }
  }, [isLoading, url]);

  const handleUrlChange = (value: string, name?: string) => {
    setUrl(value);
    setError(null);
  };

  const handleLoad = async () => {
    if (!url.trim()) {
      setError('Please enter a video URL');
      return;
    }

    const videoInfo = parseVideoUrl(url.trim());
    
    if (!videoInfo) {
      setError('Invalid URL. Please enter a YouTube, TikTok, or Instagram Reel link.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      onVideoLoad(videoInfo);
      setError(null);
    } catch (err) {
      setError('Failed to load video. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !disabled && !isLoading) {
      e.preventDefault();
      handleLoad();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputRow}>
        <div className={styles.inputWrapper} onKeyDown={handleKeyPress}>
          <TextField
            label="Video URL"
            placeholder="Paste YouTube, TikTok, or Instagram Reel link"
            value={url}
            onChange={handleUrlChange}
            disabled={disabled || isLoading}
            hasError={!!error}
            helperText={error || undefined}
          />
        </div>
        
        <div ref={buttonRef} className={styles.buttonWrapper}>
          <Button
            variant="secondary"
            onClick={handleLoad}
            disabled={disabled || isLoading || !url.trim()}
            className={styles.loadButton}
          >
            {isLoading ? 'Loading...' : 'Load video'}
          </Button>
        </div>
      </div>
    </div>
  );
};

