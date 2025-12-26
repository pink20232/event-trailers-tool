'use client';

import React, { useState } from 'react';
import { Container, Stack, Typography } from '@eventbrite/marmalade';
import { VideoUrlInput } from '@/components/VideoUrlInput';
import { EventCardPreview } from '@/components/EventCardPreview';
import { VideoEditor } from '@/components/VideoEditor';
import { type VideoInfo } from '@/lib/videoUtils';
import styles from './page.module.css';

export default function Home() {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(30);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number | undefined>(undefined);

  const handleVideoLoad = (info: VideoInfo) => {
    setVideoInfo(info);
    setStartTime(0);
    setEndTime(30);
    setVideoDuration(null); // Reset duration, will be detected
    setCurrentPlaybackTime(undefined); // Reset playback time
  };

  const handleDurationDetected = (duration: number) => {
    setVideoDuration(duration);
    // Adjust endTime if needed
    if (endTime > duration) {
      setEndTime(Math.min(30, duration));
    }
  };

  const handleTimeRangeChange = (start: number, end: number) => {
    setStartTime(start);
    setEndTime(end);
  };

  return (
    <main className={styles.main}>
      <Container 
        className={styles.container}
        tokens={{
          '--ContainerMaxWidth': '1400px',
          '--ContainerPadding': '32px 24px',
        }}
      >
        <Stack space="spacing-xxl">
          {/* Header */}
          <Stack space="spacing-md" className={styles.header}>
            <Typography variant="heading-xl">
              Event Card Preview Tool
            </Typography>
            <Typography variant="body-md" color="neutral-600">
              Upload a video from YouTube, TikTok, or Instagram Reel and preview how it will look on your event card
            </Typography>
          </Stack>

          {/* Video URL Input */}
          <div className={styles.inputSection}>
            <VideoUrlInput 
              onVideoLoad={handleVideoLoad}
              disabled={false}
            />
          </div>

          {/* Event Card Preview */}
          {videoInfo && (
            <div className={styles.previewSection}>
              <EventCardPreview
                videoInfo={videoInfo}
                startTime={startTime}
                endTime={endTime}
                onDurationDetected={handleDurationDetected}
                onPlaybackTimeUpdate={setCurrentPlaybackTime}
              />
            </div>
          )}

          {/* Video Editor */}
          {videoInfo && (
            <div className={styles.editorSection}>
              <VideoEditor
                videoInfo={videoInfo}
                onTimeRangeChange={handleTimeRangeChange}
                duration={videoDuration || 300} // Use detected duration or default
                currentPlaybackTime={currentPlaybackTime}
              />
            </div>
          )}
        </Stack>
      </Container>
    </main>
  );
}

