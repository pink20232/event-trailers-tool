'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Typography, Stack, Button } from '@eventbrite/marmalade';
import { type VideoInfo } from '@/lib/videoUtils';
import { type EventData } from './EventSidebar';
import styles from './EventCardPreview.module.css';

interface EventCardPreviewProps {
  videoInfo: VideoInfo | null;
  startTime: number;
  endTime: number;
  eventData?: EventData;
  organizerLogo?: string | null; // Optional override for preview logo
  onDurationDetected?: (duration: number) => void;
  onPlaybackTimeUpdate?: (currentTime: number) => void;
}

export const EventCardPreview: React.FC<EventCardPreviewProps> = ({
  videoInfo,
  startTime,
  endTime,
  eventData,
  organizerLogo,
  onDurationDetected,
  onPlaybackTimeUpdate,
}) => {
  // Use organizerLogo prop if provided, otherwise fall back to eventData.organizerLogo
  const displayLogo = organizerLogo !== undefined ? organizerLogo : eventData?.organizerLogo;
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
      
      // If we've reached or passed endTime, seek back to startTime for looping
      if (currentTime >= endTime - 0.1) { // Small buffer to account for timing
        const iframe = iframeRef.current;
        if (iframe && iframe.contentWindow && videoInfo?.platform === 'youtube') {
          try {
            iframe.contentWindow.postMessage(
              JSON.stringify({
                event: 'command',
                func: 'seekTo',
                args: [startTime, true],
              }),
              'https://www.youtube.com'
            );
            // Reset the playback start time to maintain smooth looping
            playbackStartTimeRef.current = Date.now();
          } catch (error) {
            console.error('Error seeking YouTube player for loop:', error);
          }
        }
      }
      
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

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    // Check if it's already in mm/dd format
    if (/^\d{2}\/\d{2}$/.test(dateString)) {
      return dateString;
    }
    // Try to parse as ISO date or other date format
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const month = date.getMonth() + 1; // getMonth() returns 0-11
        const day = date.getDate();
        // Format as mm/dd
        return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
      }
    } catch (e) {
      // If parsing fails, return as-is
    }
    return dateString;
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 || 12;
    return `${displayHour}${minutes !== '00' ? `:${minutes}` : ''}${ampm}`;
  };

  // Truncate description to 160 characters for preview
  const truncateDescription = (text: string, maxLength: number = 160): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Show event card with default/cold start values even without video
  const showEventCard = !videoInfo || eventData;
  
  if (!videoInfo) {
    // Show event card with placeholder media area and event details
    return (
      <div className={styles.previewContainer}>
        <div className={styles.eventCard}>
          {/* Media Frame Section with Placeholder */}
          <div className={styles.mediaFrame}>
            <div className={styles.videoContainer}>
              <div className={styles.placeholder}>
                <Typography variant="body-md" color="neutral-600">
                  Load a video to see preview
                </Typography>
              </div>
            </div>
            
            {/* Gradient Overlay (Scrim) */}
            <div className={styles.gradientOverlay} />
            
            {/* Event Title Overlay */}
            <div className={styles.titleOverlay}>
              <h1 className={styles.eventTitle}>
                {eventData?.title || 'Event title'}
              </h1>
            </div>
            
            {/* Date and Time Overlay */}
            <div className={styles.dateTimeOverlay}>
              <span className={styles.dateTime}>
                {eventData?.date ? formatDate(eventData.date) : 'Date'}
              </span>
              <svg 
                className={styles.dot}
                width="3"
                height="3"
                viewBox="0 0 3 3"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
              </svg>
              <span className={styles.dateTime}>
                {eventData?.time ? formatTime(eventData.time) : 'Time'}
              </span>
            </div>
            
            {/* Venue/Location Overlay */}
            <div className={styles.locationOverlay}>
              <span className={styles.location}>
                {eventData?.venue || 'Venue'}
              </span>
            </div>
          </div>
          
          {/* Content Section - 160 characters event summary */}
          <div className={styles.contentSection}>
            <div className={styles.description}>
              <Typography variant="body-md" color="neutral-700">
                {truncateDescription(eventData?.description || '160 characters event summary. 160 characters event summary. 160 characters event summary.')}
              </Typography>
            </div>
          </div>
          
          {/* Footer Section */}
          <div className={styles.footer}>
            <div>
              <div className={styles.priceButtonWrapper}>
                <Button variant="primary" className={styles.priceButton}>
                  From $-
                </Button>
              </div>
              <div className={styles.actionButtons}>
                <button
                  className={styles.iconButton}
                  aria-label="Save event"
                  type="button"
                >
                  <svg width="24" height="24" viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M11.7039 6.54237C11.4332 7.15291 10.5668 7.15291 10.2961 6.54237L9.17095 4.00472C8.65132 2.82999 7.43966 2 5.92022 2C4.85362 2 3.7053 2.42821 2.89693 3.37669C2.01399 4.41267 1.7457 5.8521 2.26001 7.16517C2.61386 8.06858 3.26491 9.07577 3.80579 9.86126C5.04238 11.6571 7.16263 14.0644 9.03937 16.0816C9.76739 16.8642 10.4453 17.5738 11 18.1468C11.5547 17.5738 12.2326 16.8642 12.9606 16.0816C14.8374 14.0644 16.9576 11.6571 18.1942 9.86127C18.7351 9.07577 19.3861 8.06858 19.74 7.16517C20.2543 5.8521 19.986 4.41267 19.1031 3.37669C18.2947 2.42821 17.1464 2 16.0798 2C14.5603 2 13.3487 2.82999 12.829 4.00472L11.7039 6.54237ZM12.4022 19.5738C12.0346 19.9533 11.7222 20.2718 11.4862 20.5108C11.1779 20.8232 11 21 11 21C11 21 10.8221 20.8232 10.5138 20.5108C10.2778 20.2718 9.96542 19.9533 9.59783 19.5738C7.61304 17.5247 4.01917 13.6976 2.15855 10.9955C1.61622 10.2079 0.843994 9.03384 0.397768 7.89459C-0.391756 5.87888 0.0247803 3.66335 1.37476 2.07938C2.6096 0.630518 4.34345 0 5.92022 0C7.37996 0 8.70787 0.520901 9.69763 1.40636C10.2482 1.89894 10.6942 2.50435 11 3.19565C11.3058 2.50435 11.7518 1.89894 12.3024 1.40636C13.2921 0.520902 14.62 0 16.0798 0C17.6565 0 19.3904 0.630516 20.6252 2.07938C21.9752 3.66335 22.3918 5.87887 21.6022 7.89459C21.156 9.03383 20.3838 10.2079 19.8415 10.9955C17.9808 13.6976 14.387 17.5247 12.4022 19.5738Z" fill="currentColor"/>
                  </svg>
                </button>
                <button
                  className={styles.iconButton}
                  aria-label="Share event"
                  type="button"
                >
                  <svg width="24" height="24" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.99954 0L16.9991 6.99954L15.5849 8.41376L11 3.82889L11 16H9L9 3.82797L4.41421 8.41376L3 6.99954L9.99954 0Z" fill="currentColor"/>
                    <path d="M0 18V11H2V18C2 18.5523 2.44772 19 3 19H17C17.5523 19 18 18.5523 18 18V11H20V18C20 19.6569 18.6569 21 17 21H3C1.34315 21 0 19.6569 0 18Z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            </div>
            <button className={styles.avatarButton} aria-label="Profile" type="button">
              {displayLogo ? (
                <img 
                  src={displayLogo} 
                  alt="Organizer logo"
                  className={styles.organizerLogo}
                />
              ) : (
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="20" fill="#E5E5E5"/>
                  <circle cx="20" cy="15" r="5" fill="#999999"/>
                  <ellipse cx="20" cy="30" rx="8" ry="5" fill="#999999"/>
                </svg>
              )}
            </button>
          </div>
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
          
          {/* Gradient Overlay (Scrim) */}
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
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 2L5 6H2v8h3l6 4V2z" fill="white"/>
                <path d="M14 7l4 4m0-4l-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 2L5 6H2v8h3l6 4V2z" fill="white"/>
                <path d="M14 7l3 3 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            )}
          </button>
          
          {/* Event Title Overlay */}
          <div className={styles.titleOverlay}>
            <h1 className={styles.eventTitle}>
              {eventData?.title || 'Event title'}
            </h1>
          </div>
          
          {/* Date and Time Overlay */}
          <div className={styles.dateTimeOverlay}>
            <span className={styles.dateTime}>
              {eventData?.date ? formatDate(eventData.date) : 'Date'}
            </span>
            <svg 
              className={styles.dot}
              width="3"
              height="3"
              viewBox="0 0 3 3"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
            </svg>
            <span className={styles.dateTime}>
              {eventData?.time ? formatTime(eventData.time) : 'Time'}
            </span>
          </div>
          
          {/* Venue/Location Overlay */}
          <div className={styles.locationOverlay}>
            <span className={styles.location}>
              {eventData?.venue || 'Venue'}
            </span>
          </div>
        </div>
        
        {/* Content Section - 160 characters event summary */}
        <div className={styles.contentSection}>
          <div className={styles.description}>
            <Typography variant="body-md" color="neutral-700">
              {truncateDescription(eventData?.description || '160 characters event summary. 160 characters event summary. 160 characters event summary.')}
            </Typography>
          </div>
        </div>
        
        {/* Footer Section */}
        <div className={styles.footer}>
            <div className={styles.priceButtonWrapper}>
              <Button variant="primary" className={styles.priceButton}>
                From $-
              </Button>
            </div>
            <div className={styles.actionButtons}>
              <button
                className={styles.iconButton}
                aria-label="Save event"
                type="button"
              >
                <svg width="24" height="24" viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M11.7039 6.54237C11.4332 7.15291 10.5668 7.15291 10.2961 6.54237L9.17095 4.00472C8.65132 2.82999 7.43966 2 5.92022 2C4.85362 2 3.7053 2.42821 2.89693 3.37669C2.01399 4.41267 1.7457 5.8521 2.26001 7.16517C2.61386 8.06858 3.26491 9.07577 3.80579 9.86126C5.04238 11.6571 7.16263 14.0644 9.03937 16.0816C9.76739 16.8642 10.4453 17.5738 11 18.1468C11.5547 17.5738 12.2326 16.8642 12.9606 16.0816C14.8374 14.0644 16.9576 11.6571 18.1942 9.86127C18.7351 9.07577 19.3861 8.06858 19.74 7.16517C20.2543 5.8521 19.986 4.41267 19.1031 3.37669C18.2947 2.42821 17.1464 2 16.0798 2C14.5603 2 13.3487 2.82999 12.829 4.00472L11.7039 6.54237ZM12.4022 19.5738C12.0346 19.9533 11.7222 20.2718 11.4862 20.5108C11.1779 20.8232 11 21 11 21C11 21 10.8221 20.8232 10.5138 20.5108C10.2778 20.2718 9.96542 19.9533 9.59783 19.5738C7.61304 17.5247 4.01917 13.6976 2.15855 10.9955C1.61622 10.2079 0.843994 9.03384 0.397768 7.89459C-0.391756 5.87888 0.0247803 3.66335 1.37476 2.07938C2.6096 0.630518 4.34345 0 5.92022 0C7.37996 0 8.70787 0.520901 9.69763 1.40636C10.2482 1.89894 10.6942 2.50435 11 3.19565C11.3058 2.50435 11.7518 1.89894 12.3024 1.40636C13.2921 0.520902 14.62 0 16.0798 0C17.6565 0 19.3904 0.630516 20.6252 2.07938C21.9752 3.66335 22.3918 5.87887 21.6022 7.89459C21.156 9.03383 20.3838 10.2079 19.8415 10.9955C17.9808 13.6976 14.387 17.5247 12.4022 19.5738Z" fill="currentColor"/>
                </svg>
              </button>
              <button
                className={styles.iconButton}
                aria-label="Share event"
                type="button"
              >
                <svg width="24" height="24" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.99954 0L16.9991 6.99954L15.5849 8.41376L11 3.82889L11 16H9L9 3.82797L4.41421 8.41376L3 6.99954L9.99954 0Z" fill="currentColor"/>
                  <path d="M0 18V11H2V18C2 18.5523 2.44772 19 3 19H17C17.5523 19 18 18.5523 18 18V11H20V18C20 19.6569 18.6569 21 17 21H3C1.34315 21 0 19.6569 0 18Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
            <button className={styles.avatarButton} aria-label="Profile" type="button">
              {displayLogo ? (
                <img 
                  src={displayLogo} 
                  alt="Organizer logo"
                  className={styles.organizerLogo}
                />
              ) : (
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="20" fill="#E5E5E5"/>
                  <circle cx="20" cy="15" r="5" fill="#999999"/>
                  <ellipse cx="20" cy="30" rx="8" ry="5" fill="#999999"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
  );
};

