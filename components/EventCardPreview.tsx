'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Typography, Stack, Button } from '@eventbrite/marmalade';
import { type VideoInfo } from '@/lib/videoUtils';
import styles from './EventCardPreview.module.css';

interface EventCardPreviewProps {
  videoInfo: VideoInfo | null;
  startTime: number;
  endTime: number;
  onDurationDetected?: (duration: number) => void;
  onPlaybackTimeUpdate?: (currentTime: number) => void;
}

export const EventCardPreview: React.FC<EventCardPreviewProps> = ({
  videoInfo,
  startTime,
  endTime,
  onDurationDetected,
  onPlaybackTimeUpdate,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Default: no sound (muted)
  const [isPaused, setIsPaused] = useState(false); // Track pause/play state
  const durationDetectedRef = useRef(false);
  const playbackTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playbackStartTimeRef = useRef<number>(Date.now());
  const lastPlaybackTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number | null>(null);

  // Detect duration for YouTube videos using iframe API
  useEffect(() => {
    if (!videoInfo || videoInfo.platform !== 'youtube' || durationDetectedRef.current) return;

    const detectYouTubeDuration = () => {
      // Create a hidden div-based player to get duration
      const hiddenPlayerId = `youtube-duration-${videoInfo.videoId}`;
      let hiddenDiv: HTMLDivElement | null = null;
      let playerInstance: any = null;

      const loadYouTubeAPI = () => {
        if (window.YT && window.YT.Player) {
          try {
            // Create a hidden div for the player
            hiddenDiv = document.createElement('div');
            hiddenDiv.id = hiddenPlayerId;
            hiddenDiv.style.display = 'none';
            hiddenDiv.style.width = '1px';
            hiddenDiv.style.height = '1px';
            hiddenDiv.style.position = 'absolute';
            hiddenDiv.style.top = '-9999px';
            document.body.appendChild(hiddenDiv);

            // Create player just to get duration
            playerInstance = new window.YT.Player(hiddenPlayerId, {
              videoId: videoInfo.videoId,
              playerVars: {
                autoplay: 0,
                controls: 0,
                rel: 0,
                showinfo: 0,
              },
              events: {
                onReady: (event: any) => {
                  // Try multiple times as duration might not be available immediately
                  const tryGetDuration = (attempts = 0) => {
                    try {
                      const duration = event.target.getDuration();
                      if (duration && duration > 0 && !durationDetectedRef.current) {
                        durationDetectedRef.current = true;
                        onDurationDetected?.(duration);
                        // Clean up
                        setTimeout(() => {
                          try {
                            if (playerInstance) {
                              playerInstance.destroy();
                              playerInstance = null;
                            }
                            if (hiddenDiv && hiddenDiv.parentNode) {
                              try {
                                hiddenDiv.parentNode.removeChild(hiddenDiv);
                              } catch (e) {
                                // Element may have already been removed
                              }
                              hiddenDiv = null;
                            }
                          } catch (e) {
                            // Ignore cleanup errors
                          }
                        }, 100);
                      } else if (attempts < 10 && !durationDetectedRef.current) {
                        // Retry if duration not available yet
                        setTimeout(() => tryGetDuration(attempts + 1), 500);
                      }
                    } catch (e) {
                      // Duration not available, retry
                      if (attempts < 10 && !durationDetectedRef.current) {
                        setTimeout(() => tryGetDuration(attempts + 1), 500);
                      }
                    }
                  };
                  
                  tryGetDuration();
                },
                onError: (event: any) => {
                  console.error('YouTube player error:', event);
                  // Clean up on error
                  if (hiddenDiv && hiddenDiv.parentNode) {
                    try {
                      hiddenDiv.parentNode.removeChild(hiddenDiv);
                    } catch (e) {
                      // Element may have already been removed
                    }
                    hiddenDiv = null;
                  }
                },
              },
            });
          } catch (e) {
            console.error('Error creating YouTube player for duration:', e);
            if (hiddenDiv && hiddenDiv.parentNode) {
              try {
                hiddenDiv.parentNode.removeChild(hiddenDiv);
              } catch (removeError) {
                // Element may have already been removed
              }
              hiddenDiv = null;
            }
          }
        }
      };

      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        const originalCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (originalCallback) originalCallback();
          loadYouTubeAPI();
        };
      } else {
        // Small delay to ensure API is fully ready
        setTimeout(loadYouTubeAPI, 100);
      }

      return () => {
        if (playerInstance) {
          try {
            playerInstance.destroy();
            playerInstance = null;
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        if (hiddenDiv) {
          try {
            if (hiddenDiv.parentNode) {
              hiddenDiv.parentNode.removeChild(hiddenDiv);
            }
          } catch (e) {
            // Element may have already been removed or parent is null
          }
          hiddenDiv = null;
        }
      };
    };

    const cleanup = detectYouTubeDuration();
    return cleanup;
  }, [videoInfo, onDurationDetected]);

  // Listen for YouTube iframe messages to get duration
  useEffect(() => {
    if (videoInfo?.platform !== 'youtube' || durationDetectedRef.current) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // Check for duration in various message formats
        if (data?.info?.videoData?.length_seconds) {
          const duration = parseFloat(data.info.videoData.length_seconds);
          if (duration > 0 && !durationDetectedRef.current) {
            durationDetectedRef.current = true;
            onDurationDetected?.(duration);
          }
        } else if (data?.info?.length_seconds) {
          const duration = parseFloat(data.info.length_seconds);
          if (duration > 0 && !durationDetectedRef.current) {
            durationDetectedRef.current = true;
            onDurationDetected?.(duration);
          }
        }
      } catch (e) {
        // Not a JSON message or not the format we expect
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [videoInfo, onDurationDetected]);

  // Detect duration for non-YouTube platforms
  useEffect(() => {
    if (!videoInfo || videoInfo.platform === 'youtube' || durationDetectedRef.current) return;

    // For TikTok/Instagram, use reasonable estimates
    // Most TikTok videos are 15-60 seconds, Instagram Reels are up to 90 seconds
    const estimatedDuration = videoInfo.platform === 'tiktok' ? 60 : 90;
    if (!durationDetectedRef.current) {
      durationDetectedRef.current = true;
      onDurationDetected?.(estimatedDuration);
    }
  }, [videoInfo, onDurationDetected]);

  useEffect(() => {
    if (!videoInfo || !iframeRef.current) return;

    setIsReady(false);
    setIsMuted(true); // Reset to muted when new video loads
    setIsPaused(false); // Reset pause state when new video loads
    playbackStartTimeRef.current = Date.now();
    lastPlaybackTimeRef.current = startTime;
    pausedTimeRef.current = null; // Reset paused time for new video
    
    // For YouTube, we can control playback with API
    if (videoInfo.platform === 'youtube') {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 1000);
      return () => clearTimeout(timer);
    }

    setIsReady(true);
  }, [videoInfo]);

  useEffect(() => {
    if (!videoInfo || !isReady || videoInfo.platform !== 'youtube') return;

    // YouTube API control for seeking via postMessage
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'seekTo',
            args: [startTime, true],
          }),
          'https://www.youtube.com'
        );
      } catch (error) {
        console.error('Error controlling YouTube player:', error);
      }
    }
  }, [videoInfo, startTime, isReady]);

  // Control mute/unmute state
  useEffect(() => {
    if (!videoInfo || !isReady || videoInfo.platform !== 'youtube') return;

    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: isMuted ? 'mute' : 'unMute',
            args: [],
          }),
          'https://www.youtube.com'
        );
      } catch (error) {
        console.error('Error controlling YouTube mute state:', error);
      }
    }
  }, [videoInfo, isReady, isMuted]);

  // Track playback time - simulate based on video playback
  // For YouTube, we track time starting from startTime and looping within the range

  useEffect(() => {
    if (!videoInfo || !isReady || !onPlaybackTimeUpdate) {
      if (playbackTimeIntervalRef.current) {
        clearInterval(playbackTimeIntervalRef.current);
        playbackTimeIntervalRef.current = null;
      }
      return;
    }

    if (isPaused) {
      // Pause: stop the interval and store current time
      if (playbackTimeIntervalRef.current) {
        clearInterval(playbackTimeIntervalRef.current);
        playbackTimeIntervalRef.current = null;
        
        // Store the current playback time when pausing
        const rangeDuration = endTime - startTime;
        const elapsed = (Date.now() - playbackStartTimeRef.current) / 1000;
        const currentTimeInRange = elapsed % rangeDuration;
        const currentTime = startTime + currentTimeInRange;
        pausedTimeRef.current = currentTime;
        lastPlaybackTimeRef.current = currentTime;
        
        // Update UI with paused time
        onPlaybackTimeUpdate(currentTime);
      }
      return;
    }

    // Resume or start: calculate the offset based on last known time
    const rangeDuration = endTime - startTime;
    
    // Determine the time to resume from
    let resumeTime: number;
    if (pausedTimeRef.current !== null) {
      // Resuming from pause - use the stored paused time
      resumeTime = pausedTimeRef.current;
      // Clear paused time now that we're resuming
      pausedTimeRef.current = null;
    } else if (lastPlaybackTimeRef.current >= startTime && lastPlaybackTimeRef.current <= endTime) {
      // Use last known time if it's still within range
      resumeTime = lastPlaybackTimeRef.current;
    } else {
      // Start from beginning of range
      resumeTime = startTime;
    }
    
    // Calculate the offset from startTime
    const timeOffset = resumeTime - startTime;
    playbackStartTimeRef.current = Date.now() - (timeOffset * 1000);

    // Update playback time based on elapsed time within the selected range
    playbackTimeIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - playbackStartTimeRef.current) / 1000; // Convert to seconds
      const currentTimeInRange = elapsed % rangeDuration; // Loop within range
      const currentTime = startTime + currentTimeInRange;
      lastPlaybackTimeRef.current = currentTime;
      
      onPlaybackTimeUpdate(currentTime);
    }, 100); // Update every 100ms for smooth progress

    return () => {
      if (playbackTimeIntervalRef.current) {
        clearInterval(playbackTimeIntervalRef.current);
        playbackTimeIntervalRef.current = null;
      }
    };
  }, [videoInfo, isReady, startTime, endTime, isPaused, onPlaybackTimeUpdate]);

  // Control pause/play state
  useEffect(() => {
    if (!videoInfo || !isReady || videoInfo.platform !== 'youtube') return;

    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: isPaused ? 'pauseVideo' : 'playVideo',
            args: [],
          }),
          'https://www.youtube.com'
        );
      } catch (error) {
        console.error('Error controlling YouTube playback:', error);
      }
    }
  }, [videoInfo, isReady, isPaused]);

  // Toggle mute/unmute
  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
  };

  // Toggle pause/play
  const handleTogglePause = () => {
    setIsPaused(prev => !prev);
  };

  if (!videoInfo) {
    return (
      <div className={styles.previewContainer}>
        <div className={styles.placeholder}>
          <Typography variant="body-md" color="neutral-600">
            Load a video to see preview
          </Typography>
        </div>
      </div>
    );
  }

  const embedUrl = videoInfo.embedUrl;

  return (
    <div className={styles.previewContainer}>
      <div className={styles.eventCard}>
        {/* Media Frame Section */}
        <div className={styles.mediaFrame}>
          <div className={styles.videoContainer}>
            <iframe
              ref={iframeRef}
              src={embedUrl}
              className={styles.videoFrame}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Event card video preview"
            />
          </div>
          
          {/* Gradient Overlay */}
          <div className={styles.gradientOverlay} />
          
          {/* Pause/Play Icon Button - Center */}
          <button
            className={styles.playPauseButton}
            aria-label={isPaused ? "Play video" : "Pause video"}
            type="button"
            onClick={handleTogglePause}
          >
            {isPaused ? (
              // Play icon
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5V19L19 12L8 5Z" fill="white" />
              </svg>
            ) : (
              // Pause icon
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 4H10V20H6V4Z" fill="white" />
                <path d="M14 4H18V20H14V4Z" fill="white" />
              </svg>
            )}
          </button>
          
          {/* Mute/Unmute Icon Button - Top Right */}
          <button
            className={styles.muteButton}
            aria-label={isMuted ? "Unmute video (play sound)" : "Mute video"}
            type="button"
            onClick={handleToggleMute}
          >
            {isMuted ? (
              // Muted icon (speaker with X)
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2L6 6H2V14H6L10 18V2Z" fill="white" />
                <path d="M13 7L17 11M17 7L13 11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              // Unmuted icon (sound on - speaker with sound waves)
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2L6 6H2V14H6L10 18V2Z" fill="white" />
                <path d="M13 7C13.5 7.5 14 8.5 14 10C14 11.5 13.5 12.5 13 13M15 5C16 6 16.5 7.5 16.5 10C16.5 12.5 16 14 15 15" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
          
          {/* Swap Icon Button - Bottom Left */}
          <button
            className={styles.swapButton}
            aria-label="Swap media"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 8L1 11L4 14M16 8L19 11L16 14M13 3L7 17" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          
          {/* Event Title Overlay */}
          <div className={styles.titleOverlay}>
            <h1 className={styles.eventTitle}>
              San Francisco Coffee Festival
            </h1>
          </div>
          
          {/* Date and Time Overlay */}
          <div className={styles.dateTimeOverlay}>
            <span className={styles.dateTime}>
              Sat, Mar 27
            </span>
            <span className={styles.dot}>•</span>
            <span className={styles.dateTime}>
              10am
            </span>
          </div>
          
          {/* Location Overlay */}
          <div className={styles.locationOverlay}>
            <span className={styles.location}>
              Fort Mason Center for Arts & Culture
            </span>
          </div>
        </div>
        
        {/* Content Section */}
        <div className={styles.contentSection}>
          <div className={styles.description}>
            <Typography variant="body-md" color="neutral-700">
              A lively coffee showcase to taste from 75+ roasters, discover new brewing trends, and enjoy a lively social atmosphere.
            </Typography>
          </div>
        </div>
        
        {/* Footer Section */}
        <div className={styles.footer}>
          <div className={styles.priceButtonWrapper}>
            <Button variant="primary" className={styles.priceButton}>
              From $24
            </Button>
          </div>
          <div className={styles.actionButtons}>
            <button
              className={styles.iconButton}
              aria-label="Save event"
              type="button"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </button>
            <button
              className={styles.iconButton}
              aria-label="Share event"
              type="button"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8a3 3 0 1 0-2.83-2M9 14a3 3 0 1 0 2.83 2M13.41 10.59a3 3 0 1 1 4.24 4.24M6.41 13.59a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

