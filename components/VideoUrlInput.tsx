'use client';

import React, { useState } from 'react';
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled && !isLoading) {
      handleLoad();
    }
  };

  return (
    <Stack space="spacing-md" className={styles.container}>
      <Stack space="spacing-sm">
        <TextField
          label="Video URL"
          placeholder="Paste YouTube, TikTok, or Instagram Reel link"
          value={url}
          onChange={handleUrlChange}
          onKeyPress={handleKeyPress}
          disabled={disabled || isLoading}
          hasError={!!error}
          helperText={error || undefined}
        />
        
        <Button
          variant="primary"
          onClick={handleLoad}
          disabled={disabled || isLoading || !url.trim()}
        >
          {isLoading ? 'Loading...' : 'Load Video'}
        </Button>
      </Stack>
    </Stack>
  );
};

