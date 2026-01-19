'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Typography, Stack, Button } from '@eventbrite/marmalade';
import { type VideoInfo } from '@/lib/videoUtils';
import styles from './VideoEditor.module.css';

interface VideoEditorProps {
  videoInfo: VideoInfo | null;
  onTimeRangeChange: (startTime: number, endTime: number) => void;
  duration?: number; // Total video duration in seconds
  currentPlaybackTime?: number; // Current playback time in seconds
}

const MAX_PREVIEW_DURATION = 30; // 30 seconds

// Inline thumbnail strip component
const ThumbnailStrip: React.FC<{
  videoId: string;
  duration: number;
  thumbnailCount: number;
}> = ({ videoId, duration, thumbnailCount }) => {
  const [thumbnails, setThumbnails] = useState<Array<{ timestamp: number; spriteX: number; spriteY: number; url: string; frameIndex: number }>>([]);
  const [spriteUrl, setSpriteUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  
  useEffect(() => {
    setIsLoading(true);
    setUseFallback(false);
    
    // Strategy 1: Try to load storyboard sprite sheet via API
    const apiSpriteUrl = `/api/youtube-thumbnails?videoId=${videoId}&type=sprite`;
    
    // Calculate thumbnail positions based on actual timestamps
    const thumbnailWidth = 160;
    const thumbnailHeight = 90;
    const columnsPerRow = 3;
    
    // YouTube storyboards have frames at fixed intervals (typically 5 seconds)
    // The storyboard has frames at: 0, 5, 10, 15, 20, 25... seconds
    // We need to use the actual storyboard frame timestamps so thumbnails match the video
    
    // YouTube storyboard frame interval (typically 5 seconds)
    const storyboardFrameInterval = 5;
    // Calculate how many frames YouTube provides (max ~20 frames)
    const maxStoryboardFrames = Math.min(20, Math.ceil(duration / storyboardFrameInterval));
    
    // Generate thumbnails at actual storyboard frame positions
    // This ensures each thumbnail shows the correct frame from the video
    const actualFrameCount = Math.min(thumbnailCount, maxStoryboardFrames);
    const generated: Array<{ timestamp: number; spriteX: number; spriteY: number; url: string; frameIndex: number }> = [];
    
    for (let i = 0; i < actualFrameCount; i++) {
      // Use actual storyboard frame timestamps (0, 5, 10, 15...)
      const timestamp = Math.min(i * storyboardFrameInterval, duration);
      const frameIndex = i;
      
      // Calculate sprite position (3 columns per row)
      const row = Math.floor(frameIndex / columnsPerRow);
      const col = frameIndex % columnsPerRow;
      
      // Calculate sprite position for this specific frame
      const spriteX = col * thumbnailWidth;
      const spriteY = row * thumbnailHeight;
      
      // For fallback, use individual thumbnail URL
      const fallbackUrl = `/api/youtube-thumbnails?videoId=${videoId}`;
      
      generated.push({
        timestamp, // Use the actual storyboard frame time
        spriteX,
        spriteY,
        url: fallbackUrl,
        frameIndex,
      });
    }
    
    // If we need more thumbnails than storyboard frames, duplicate the last frame
    while (generated.length < thumbnailCount) {
      const lastFrame = generated[generated.length - 1];
      generated.push({
        ...lastFrame,
        timestamp: duration, // Place at end of video
      });
    }
    
    setThumbnails(generated);
    
    // Try to preload the sprite sheet with timeout
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;
    
    const img = new Image();
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('Sprite sheet load timeout, using fallback');
        setSpriteUrl(null);
        setUseFallback(true);
        setIsLoading(false);
      }
    }, 5000); // 5 second timeout
    
    img.onload = () => {
      if (isMounted) {
        clearTimeout(timeoutId);
        setSpriteUrl(apiSpriteUrl);
        setIsLoading(false);
      }
    };
    img.onerror = () => {
      if (isMounted) {
        clearTimeout(timeoutId);
        console.warn('Sprite sheet failed, using fallback thumbnails');
        // Use fallback: show default thumbnail repeated
        setSpriteUrl(null);
        setUseFallback(true);
        setIsLoading(false);
      }
    };
    img.src = apiSpriteUrl;
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [videoId, duration, thumbnailCount]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading || thumbnails.length === 0) {
    return (
      <div className={styles.thumbnailStrip}>
        <div className={styles.thumbnailPlaceholder}>
          <Typography variant="body-sm" color="neutral-600">
            {isLoading ? 'Loading thumbnails...' : 'Thumbnails unavailable'}
          </Typography>
        </div>
      </div>
    );
  }

  const columnsPerRow = 3;
  const thumbnailWidth = 160;
  const thumbnailHeight = 90;

  return (
    <div className={styles.thumbnailStrip}>
      {thumbnails.map((thumb, idx) => {
        // If sprite sheet failed, use fallback individual thumbnails
        if (useFallback || !spriteUrl) {
          return (
            <div
              key={idx}
              className={styles.thumbnailItem}
              style={{ width: `${100 / thumbnailCount}%` }}
              aria-label={`Thumbnail at ${formatTime(thumb.timestamp)}`}
            >
              <img
                src={thumb.url}
                alt={`Thumbnail at ${formatTime(thumb.timestamp)}`}
                className={styles.thumbnailImg}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.style.backgroundColor = 'var(--color-neutral-200)';
                  }
                }}
              />
            </div>
          );
        }

        // Use sprite sheet extraction - each thumbnail shows a different frame
        // Calculate the total rows needed for the sprite sheet
        const totalRows = Math.ceil(thumbnailCount / columnsPerRow);
        const spriteSheetWidth = thumbnailWidth * columnsPerRow;
        const spriteSheetHeight = thumbnailHeight * totalRows;
        
        return (
          <div
            key={idx}
            className={styles.thumbnailItem}
            style={{ width: `${100 / thumbnailCount}%` }}
            aria-label={`Thumbnail at ${formatTime(thumb.timestamp)}`}
          >
            <div 
              className={styles.thumbnailImgWrapper}
              style={{
                backgroundImage: spriteUrl ? `url("${spriteUrl}")` : 'none',
                backgroundPosition: `-${thumb.spriteX}px -${thumb.spriteY}px`,
                backgroundSize: `${spriteSheetWidth}px ${spriteSheetHeight}px`,
                backgroundRepeat: 'no-repeat',
                width: `${thumbnailWidth}px`,
                height: `${thumbnailHeight}px`,
              }}
              title={`Frame at ${formatTime(thumb.timestamp)}`}
            />
          </div>
        );
      })}
    </div>
  );
};

export const VideoEditor: React.FC<VideoEditorProps> = ({
  videoInfo,
  onTimeRangeChange,
  duration = 300, // Default 5 minutes if unknown
  currentPlaybackTime,
}) => {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(Math.min(MAX_PREVIEW_DURATION, duration));
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'range' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Initialize with 30-second window when duration changes
  useEffect(() => {
    if (duration > 0) {
      const initialEnd = Math.min(MAX_PREVIEW_DURATION, duration);
      setStartTime(0);
      setEndTime(initialEnd);
    }
  }, [duration]);

  // Ensure endTime maintains exactly 30-second window (or less if video is shorter)
  useEffect(() => {
    const maxEnd = Math.min(duration, startTime + MAX_PREVIEW_DURATION);
    const minEnd = Math.min(startTime + MAX_PREVIEW_DURATION, duration);
    
    // Maintain 60-second window when start time changes
    if (endTime - startTime !== MAX_PREVIEW_DURATION && endTime < duration) {
      setEndTime(minEnd);
    }
    
    // Ensure endTime doesn't exceed duration
    if (endTime > maxEnd) {
      setEndTime(maxEnd);
    }
    
    // Ensure minimum 5-second window (for very short videos)
    if (endTime < startTime + 5) {
      setEndTime(Math.min(startTime + 5, duration));
    }
  }, [startTime, duration, endTime]);

  // Notify parent of time range changes
  useEffect(() => {
    onTimeRangeChange(startTime, endTime);
  }, [startTime, endTime, onTimeRangeChange]);

  const getTimeFromX = useCallback((clientX: number): number => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    return percentage * duration;
  }, [duration]);

  const handleMouseDown = (e: React.MouseEvent, type: 'start' | 'end' | 'range') => {
    e.preventDefault();
    setIsDragging(type);
    setDragStartX(e.clientX);
    if (type === 'range') {
      setDragStartTime(startTime);
    } else if (type === 'start') {
      setDragStartTime(startTime);
    } else {
      setDragStartTime(endTime);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;

    const deltaX = e.clientX - dragStartX;
    const rect = timelineRef.current.getBoundingClientRect();
    const deltaTime = (deltaX / rect.width) * duration;

    if (isDragging === 'start') {
      // When dragging start, maintain 30-second window
      const newStart = Math.max(0, Math.min(dragStartTime + deltaTime, duration - MAX_PREVIEW_DURATION));
      const newEnd = Math.min(newStart + MAX_PREVIEW_DURATION, duration);
      setStartTime(newStart);
      setEndTime(newEnd);
    } else if (isDragging === 'end') {
      // When dragging end, maintain 30-second window
      const newEnd = Math.min(Math.max(dragStartTime + deltaTime, startTime + MAX_PREVIEW_DURATION), duration);
      const newStart = Math.max(0, newEnd - MAX_PREVIEW_DURATION);
      setStartTime(newStart);
      setEndTime(newEnd);
    } else if (isDragging === 'range') {
      // When dragging the range, maintain the 30-second window
      const rangeDuration = MAX_PREVIEW_DURATION;
      const newStart = Math.max(0, Math.min(dragStartTime + deltaTime, duration - rangeDuration));
      const newEnd = Math.min(newStart + rangeDuration, duration);
      setStartTime(newStart);
      setEndTime(newEnd);
    }
  }, [isDragging, dragStartX, dragStartTime, duration, startTime, endTime]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  const startPercentage = (startTime / duration) * 100;
  const endPercentage = (endTime / duration) * 100;
  const selectedWidth = endPercentage - startPercentage;
  const currentPlaybackPercentage = currentPlaybackTime !== undefined 
    ? (currentPlaybackTime / duration) * 100 
    : null;

  if (!videoInfo) {
    return (
      <div className={styles.editorContainer}>
        <Typography variant="body-md" color="neutral-600">
          Load a video to start editing
        </Typography>
      </div>
    );
  }

  return (
    <div className={styles.editorContainer}>
      <Stack space="spacing-md">
        <div className={styles.header}>
          <Typography variant="heading-sm">Select your 30 second preview</Typography>
        </div>

        <div className={styles.timelineContainer}>
          <div className={styles.timeLabels}>
            <Typography variant="body-sm" color="neutral-600">
              {formatTime(0)}
            </Typography>
            <Typography variant="body-sm" color="neutral-600">
              {formatTime(duration)}
            </Typography>
          </div>

          {/* Thumbnail filmstrip with timeline overlay */}
          <div className={styles.timelineWrapper}>
            {/* Thumbnail filmstrip as base layer */}
            {videoInfo && videoInfo.platform === 'youtube' && duration > 0 && (
              <ThumbnailStrip
                videoId={videoInfo.videoId}
                duration={duration}
                thumbnailCount={Math.min(20, Math.max(10, Math.floor(duration / 10)))}
              />
            )}

            {/* Timeline overlay on top of thumbnails */}
            <div
              ref={timelineRef}
              className={styles.timeline}
              onMouseDown={(e) => {
                const time = getTimeFromX(e.clientX);
                if (time >= startTime && time <= endTime) {
                  handleMouseDown(e, 'range');
                } else {
                  // Click outside selected range - move 30-second window to clicked position
                  const newStart = Math.max(0, Math.min(time - MAX_PREVIEW_DURATION / 2, duration - MAX_PREVIEW_DURATION));
                  const newEnd = Math.min(newStart + MAX_PREVIEW_DURATION, duration);
                  setStartTime(newStart);
                  setEndTime(newEnd);
                }
              }}
            >
            {/* Full timeline background */}
            <div className={styles.timelineBackground} />

            {/* Selected range */}
            <div
              className={styles.selectedRange}
              style={{
                left: `${startPercentage}%`,
                width: `${selectedWidth}%`,
              }}
            >
              {/* Start handle */}
              <div
                className={styles.handle}
                style={{ left: 0 }}
                onMouseDown={(e) => handleMouseDown(e, 'start')}
              >
                <div className={styles.handleIndicator} />
              </div>

              {/* End handle */}
              <div
                className={styles.handle}
                style={{ right: 0 }}
                onMouseDown={(e) => handleMouseDown(e, 'end')}
              >
                <div className={styles.handleIndicator} />
              </div>
            </div>

            {/* Progress indicator - shows current playback position */}
            {currentPlaybackPercentage !== null && (
              <div
                className={styles.progressIndicator}
                style={{ left: `${currentPlaybackPercentage}%` }}
              >
                <div className={styles.progressLine} />
                <div className={styles.progressDot} />
              </div>
            )}

            {/* Time markers - dynamically adjust interval based on duration */}
            <div className={styles.timeMarkers}>
              {(() => {
                // Determine marker interval based on video duration
                let interval = 30; // Default 30 seconds
                if (duration <= 60) interval = 10; // For videos <= 1 min, mark every 10s
                else if (duration <= 180) interval = 30; // For videos <= 3 min, mark every 30s
                else if (duration <= 600) interval = 60; // For videos <= 10 min, mark every 60s
                else interval = 120; // For longer videos, mark every 2 min

                const markers = [];
                for (let time = 0; time <= duration; time += interval) {
                  const position = (time / duration) * 100;
                  markers.push(
                    <div
                      key={time}
                      className={styles.marker}
                      style={{ left: `${position}%` }}
                    >
                      <div className={styles.markerLine} />
                      <span className={styles.markerLabel}>{formatTime(time)}</span>
                    </div>
                  );
                }
                // Always show the final duration marker if it's not already included
                if (duration % interval !== 0) {
                  markers.push(
                    <div
                      key="final"
                      className={styles.marker}
                      style={{ left: '100%' }}
                    >
                      <div className={styles.markerLine} />
                      <span className={styles.markerLabel}>{formatTime(duration)}</span>
                    </div>
                  );
                }
                return markers;
              })()}
            </div>
            </div>
          </div>
        </div>
      </Stack>
    </div>
  );
};

