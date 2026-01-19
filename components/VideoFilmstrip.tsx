'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Typography } from '@eventbrite/marmalade';
import { type VideoInfo } from '@/lib/videoUtils';
import styles from './VideoFilmstrip.module.css';

interface VideoFilmstripProps {
  videoInfo: VideoInfo | null;
  duration: number;
  onThumbnailClick: (timestamp: number) => void;
  thumbnailCount?: number;
}

interface ThumbnailData {
  timestamp: number;
  spriteUrl: string;
  spriteX: number;
  spriteY: number;
  width: number;
  height: number;
}

export const VideoFilmstrip: React.FC<VideoFilmstripProps> = ({
  videoInfo,
  duration,
  onThumbnailClick,
  thumbnailCount = 20,
}) => {
  const [thumbnails, setThumbnails] = useState<ThumbnailData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate thumbnail data from YouTube storyboard
  useEffect(() => {
    if (!videoInfo || videoInfo.platform !== 'youtube' || duration <= 0) {
      setThumbnails([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    const generateThumbnails = () => {
      try {
        const videoId = videoInfo.videoId;
        
        // YouTube storyboard sprite sheet URL
        // Format: https://i.ytimg.com/sb/{videoId}/storyboard3_L1/default.jpg
        // Storyboards have 3 columns per row, with multiple rows
        const spriteUrl = `https://i.ytimg.com/sb/${videoId}/storyboard3_L1/default.jpg`;
        
        // Standard YouTube thumbnail dimensions in storyboard
        const thumbnailWidth = 160;
        const thumbnailHeight = 90;
        const columnsPerRow = 3;
        
        // Calculate interval between thumbnails
        const interval = Math.max(1, duration / thumbnailCount);
        
        const generatedThumbnails: ThumbnailData[] = [];
        
        for (let i = 0; i < thumbnailCount; i++) {
          const timestamp = Math.min(i * interval, duration);
          const thumbnailIndex = i;
          const row = Math.floor(thumbnailIndex / columnsPerRow);
          const col = thumbnailIndex % columnsPerRow;
          
          generatedThumbnails.push({
            timestamp,
            spriteUrl,
            spriteX: col * thumbnailWidth,
            spriteY: row * thumbnailHeight,
            width: thumbnailWidth,
            height: thumbnailHeight,
          });
        }
        
        setThumbnails(generatedThumbnails);
        setIsLoading(false);
      } catch (err) {
        console.error('Error generating thumbnails:', err);
        setError('Failed to load thumbnails');
        setIsLoading(false);
      }
    };

    // Small delay to ensure video info is ready
    const timer = setTimeout(generateThumbnails, 100);
    return () => clearTimeout(timer);
  }, [videoInfo, duration, thumbnailCount]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!videoInfo || videoInfo.platform !== 'youtube') {
    return null;
  }

  if (isLoading) {
    return (
      <div className={styles.filmstripContainer}>
        <Typography variant="body-sm" color="neutral-600">
          Loading thumbnails...
        </Typography>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.filmstripContainer}>
        <Typography variant="body-sm" color="neutral-600">
          {error}
        </Typography>
      </div>
    );
  }

  if (thumbnails.length === 0) {
    return null;
  }

  return (
    <div className={styles.filmstripContainer}>
      <div className={styles.filmstripHeader}>
        <Typography variant="body-sm-bold" color="neutral-700">
          Video Timeline
        </Typography>
        <Typography variant="body-sm" color="neutral-600">
          Click a thumbnail to jump to that moment
        </Typography>
      </div>
      
      <div className={styles.filmstrip}>
        {thumbnails.map((thumbnail, index) => (
          <button
            key={index}
            className={styles.thumbnailButton}
            onClick={() => onThumbnailClick(thumbnail.timestamp)}
            aria-label={`Jump to ${formatTime(thumbnail.timestamp)}`}
            type="button"
          >
            <div className={styles.thumbnailWrapper}>
              <img
                src={thumbnail.spriteUrl}
                alt={`Thumbnail at ${formatTime(thumbnail.timestamp)}`}
                className={styles.thumbnailSprite}
                style={{
                  objectPosition: `-${thumbnail.spriteX}px -${thumbnail.spriteY}px`,
                  objectFit: 'none',
                  width: `${thumbnail.width * 3}px`, // Show full sprite width
                  height: `${thumbnail.height * Math.ceil(thumbnailCount / 3)}px`, // Show full sprite height
                  transform: `translate(${-thumbnail.spriteX}px, ${-thumbnail.spriteY}px)`,
                }}
                onError={(e) => {
                  // Fallback: try using default YouTube thumbnail
                  const target = e.target as HTMLImageElement;
                  target.src = `https://img.youtube.com/vi/${videoInfo?.videoId}/mqdefault.jpg`;
                  target.style.objectPosition = 'center';
                  target.style.objectFit = 'cover';
                  target.style.width = '160px';
                  target.style.height = '90px';
                  target.style.transform = 'none';
                }}
              />
              <div
                className={styles.thumbnailMask}
                style={{
                  width: `${thumbnail.width}px`,
                  height: `${thumbnail.height}px`,
                }}
              />
            </div>
            <div className={styles.thumbnailTime}>
              <Typography variant="body-sm" color="neutral-700">
                {formatTime(thumbnail.timestamp)}
              </Typography>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

