'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Container, Stack, Button, Typography } from '@eventbrite/marmalade';
import { VideoUrlInput } from '@/components/VideoUrlInput';
import { EventCardPreview } from '@/components/EventCardPreview';
import { VideoEditor } from '@/components/VideoEditor';
import { EventSidebar, type EventData } from '@/components/EventSidebar';
import { MobileMockup } from '@/components/MobileMockup';
import { ViewToggle } from '@/components/ViewToggle';
import { type VideoInfo } from '@/lib/videoUtils';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import styles from './page.module.css';

const initialEventData: EventData = {
  title: '',
  date: '',
  time: '',
  venue: '',
  description: '',
  organizerLogo: null,
};

// Component to force black color on publish button
const PublishButtonContainer: React.FC<{
  isFormValid: boolean;
  handlePublish: () => void;
  className: string;
  buttonClassName: string;
}> = ({ isFormValid, handlePublish, className, buttonClassName }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const applyStyles = () => {
      if (containerRef.current) {
        const button = containerRef.current.querySelector('button');
        if (button) {
          // Force black background
          button.style.setProperty('background-color', 'rgba(0, 0, 0, 1)', 'important');
          button.style.setProperty('background', 'rgba(0, 0, 0, 1)', 'important');
          button.style.setProperty('border-color', 'rgba(0, 0, 0, 1)', 'important');
          button.style.setProperty('color', 'rgba(255, 255, 255, 1)', 'important');
          
          // Gen 3 LG base button dimensions - matching Figma design
          button.style.setProperty('height', '44px', 'important');
          button.style.setProperty('min-height', '44px', 'important');
          button.style.setProperty('max-height', '44px', 'important');
          button.style.setProperty('padding', '12px 20px', 'important');
          button.style.setProperty('border-radius', '9999px', 'important');
          button.style.setProperty('font-size', '16px', 'important');
          button.style.setProperty('font-weight', '500', 'important');
          button.style.setProperty('line-height', '1.333', 'important');
          button.style.setProperty('letter-spacing', '0.1px', 'important');
          
          // Center alignment with 8px gap - matching Figma design
          button.style.setProperty('display', 'flex', 'important');
          button.style.setProperty('flex-direction', 'row', 'important');
          button.style.setProperty('align-items', 'center', 'important');
          button.style.setProperty('justify-content', 'center', 'important');
          button.style.setProperty('gap', '8px', 'important');
          
          // Ensure icon is properly aligned
          const svg = button.querySelector('svg');
          if (svg) {
            svg.style.setProperty('display', 'block', 'important');
            svg.style.setProperty('flex-shrink', '0', 'important');
            svg.style.setProperty('margin', '0', 'important');
            svg.style.setProperty('width', '16px', 'important');
            svg.style.setProperty('height', '16px', 'important');
          }
        }
      }
    };
    
    // Apply immediately
    applyStyles();
    
    // Use MutationObserver to watch for DOM changes
    const observer = new MutationObserver(() => {
      applyStyles();
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }
    
    // Also apply after delays to catch any late renders
    const timeout1 = setTimeout(applyStyles, 10);
    const timeout2 = setTimeout(applyStyles, 100);
    const timeout3 = setTimeout(applyStyles, 500);
    
    return () => {
      observer.disconnect();
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [isFormValid]);

  return (
    <div ref={containerRef} className={className}>
      <Button
        variant="primary"
        onClick={handlePublish}
        disabled={!isFormValid}
        className={buttonClassName}
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ 
            flexShrink: 0,
            display: 'block'
          }}
        >
          <path 
            d="M13.3333 4L6 11.3333L2.66667 8" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        Publish
      </Button>
    </div>
  );
};

export default function Home() {
  
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(30);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number | undefined>(undefined);
  const [eventData, setEventData] = useState<EventData>(initialEventData);
  const [previewEventData, setPreviewEventData] = useState<EventData>(initialEventData);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  

  const handleVideoLoad = (info: VideoInfo) => {
    setVideoInfo(info);
    setStartTime(0);
    setEndTime(30);
    setVideoDuration(null);
    setCurrentPlaybackTime(undefined);
  };

  const handleBackToInput = () => {
    setVideoInfo(null);
    setStartTime(0);
    setEndTime(30);
    setVideoDuration(null);
    setCurrentPlaybackTime(undefined);
  };

  const handleDurationDetected = (duration: number) => {
    setVideoDuration(duration);
    if (endTime > duration) {
      setEndTime(Math.min(30, duration));
    }
  };

  const handleTimeRangeChange = (start: number, end: number) => {
    setStartTime(start);
    setEndTime(end);
  };

  const handleSeek = (timestamp: number) => {
    // Seek to the specified timestamp
    // This will update startTime, which will trigger the video player to seek
    const newStart = Math.max(0, Math.min(timestamp - 15, (videoDuration || 300) - 30));
    const newEnd = Math.min(newStart + 30, videoDuration || 300);
    setStartTime(newStart);
    setEndTime(newEnd);
    setCurrentPlaybackTime(timestamp);
  };

  const isFormValid = useMemo(() => {
    return !!(
      eventData.title &&
      eventData.date &&
      eventData.time &&
      eventData.venue &&
      eventData.description &&
      videoInfo
    );
  }, [eventData, videoInfo]);

  const handlePublish = () => {
    if (isFormValid) {
      // Handle publish logic here
      console.log('Publishing event:', { ...previewEventData, videoInfo });
      alert('Event published successfully!');
    }
  };

  
  try {
    return (
      <>
        <noscript>
          <div style={{ padding: '50px', backgroundColor: 'red', color: 'white', fontSize: '24px' }}>
            JavaScript is disabled! Please enable JavaScript to view this page.
          </div>
        </noscript>
        <ErrorBoundary>
          <main className={styles.main} style={{ minHeight: '100vh', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        <div className={styles.layout}>
          {/* Left Sidebar */}
          <EventSidebar
            eventData={eventData}
            onEventDataChange={(newData) => {
              setEventData(newData);
              // Keep preview logo when logo is uploaded, but don't clear it when removed
              if (newData.organizerLogo) {
                setPreviewLogo(newData.organizerLogo);
              }
            }}
            onDialogStateChange={setIsDialogOpen}
          />

          {/* Main Canvas Area */}
          <div className={`${styles.canvasArea} ${isDialogOpen ? styles.dialogOpen : ''}`}>
            {/* Publish Button - Top Right */}
            <PublishButtonContainer 
              isFormValid={isFormValid}
              handlePublish={handlePublish}
              className={styles.publishButtonContainer}
              buttonClassName={styles.publishButton}
            />
            
            {/* Banner - Underneath Publish Button, Right Aligned */}
            <div className={styles.bannerContainer}>
              <div className={styles.banner}>
                <Typography variant="body-md-bold" className={styles.bannerHeadline}>
                  Boost Sales With Video
                </Typography>
                <Typography variant="body-sm" className={styles.bannerDescription}>
                  Events like yours sell 16% more tickets when video is added to the listing.
                </Typography>
                <div className={styles.bannerImage}>
                  <img 
                    src="/assets/b28cab8812d5e92dea5ae0e35ddefa3ffe3c1f8c.png" 
                    alt="Event activities collage"
                    className={styles.bannerImageElement}
                  />
                </div>
              </div>
            </div>
            
            {/* Top Header with View Toggle */}
            <div className={styles.viewToggleContainer}>
              <ViewToggle value={viewMode} onChange={setViewMode} />
            </div>
            
            {videoInfo ? (
              <>
                <div className={styles.canvasContent}>
                  <MobileMockup isMobile={viewMode === 'mobile'}>
                    <EventCardPreview
                      videoInfo={videoInfo}
                      startTime={startTime}
                      endTime={endTime}
                      eventData={eventData}
                      organizerLogo={previewLogo}
                      onDurationDetected={handleDurationDetected}
                      onPlaybackTimeUpdate={setCurrentPlaybackTime}
                    />
                  </MobileMockup>
                </div>

                {/* Video Editor and Back Button - Positioned at bottom */}
                <div className={styles.videoInputSection}>
                  {/* Video Editor - Above back button */}
                  <div className={styles.editorSection}>
                    <VideoEditor
                      videoInfo={videoInfo}
                      onTimeRangeChange={handleTimeRangeChange}
                      duration={videoDuration || 300}
                      currentPlaybackTime={currentPlaybackTime}
                    />
                  </div>

                  {/* Back Button */}
                  <div className={styles.backButtonWrapper}>
                    <Button
                      variant="ghost"
                      onClick={handleBackToInput}
                      className={styles.backButton}
                    >
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 16 16" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        className={styles.backIcon}
                      >
                        <path 
                          d="M10 12L6 8L10 4" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                      Back to URL Input
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={styles.canvasContent}>
                  <MobileMockup isMobile={viewMode === 'mobile'}>
                    <EventCardPreview
                      videoInfo={videoInfo}
                      startTime={startTime}
                      endTime={endTime}
                      eventData={eventData}
                      organizerLogo={previewLogo}
                      onDurationDetected={handleDurationDetected}
                      onPlaybackTimeUpdate={setCurrentPlaybackTime}
                    />
                  </MobileMockup>
                </div>

                {/* Video URL Input - Only visible when no video is loaded */}
                <div className={styles.videoInputSection}>
                  <div className={styles.videoInputWrapper}>
                    <VideoUrlInput
                      onVideoLoad={handleVideoLoad}
                      disabled={false}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      </ErrorBoundary>
      </>
    );
  } catch (error) {
    console.error('[DEBUG] Render error:', error);
    return (
      <div style={{ padding: '50px', backgroundColor: 'red', color: 'white', fontSize: '24px' }}>
        <h1>RENDER ERROR</h1>
        <pre>{String(error)}</pre>
        <pre>{error instanceof Error ? error.stack : ''}</pre>
      </div>
    );
  }
}
