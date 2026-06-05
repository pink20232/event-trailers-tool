'use client';

import React, { useState, useRef } from 'react';
import { parseVideoUrl, type VideoInfo } from '@/lib/videoUtils';
import { SummaryModal } from './SummaryModal';
import styles from './EventSidebar.module.css';

export interface EventData {
  title: string;
  summary: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  organizerLogo: string | null;
}

interface EventSidebarProps {
  eventData: EventData;
  onEventDataChange: (data: EventData) => void;
  onDialogStateChange?: (isOpen: boolean) => void;
  onVideoLoad: (videoInfo: VideoInfo) => void;
  onVideoRemove: () => void;
  videoInfo: VideoInfo | null;
  embeddingBlocked?: boolean;
}

export const EventSidebar: React.FC<EventSidebarProps> = ({
  eventData,
  onEventDataChange,
  onVideoLoad,
  onVideoRemove,
  videoInfo,
  embeddingBlocked = false,
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoUrlError, setVideoUrlError] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  const handleRemoveVideo = () => {
    setVideoUrl('');
    setVideoUrlError(null);
    onVideoRemove();
  };

  const update = (partial: Partial<EventData>) => {
    onEventDataChange({ ...eventData, ...partial });
  };

  const handleVideoUrlChange = async (value: string) => {
    setVideoUrl(value);
    setVideoUrlError(null);
    if (!value.trim()) return;

    const info = parseVideoUrl(value.trim());

    // Platform-specific error messages
    if (!info) {
      if (value.includes('.') && value.length > 10) {
        setVideoUrlError('Invalid URL — paste a YouTube link instead.');
      }
      return;
    }
    if (info.platform === 'tiktok') {
      setVideoUrlError("TikTok isn’t supported yet — paste a YouTube link instead.");
      return;
    }
    if (info.platform === 'instagram') {
      setVideoUrlError("Instagram Reels aren’t supported yet — paste a YouTube link instead.");
      return;
    }

    setIsVideoLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    onVideoLoad(info);
    setIsVideoLoading(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      update({ organizerLogo: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    update({ organizerLogo: null });
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  return (
    <div className={styles.formPanel}>
      {/* General Info */}
      <div className={styles.card}>
        <div className={styles.section}>
          <label className={styles.sectionLabel}>Event name</label>
          <input
            className={styles.field56}
            type="text"
            value={eventData.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="A short, distinct event name"
          />
        </div>
        <div className={styles.section}>
          <label className={styles.sectionLabel}>Event summary</label>
          <div
            className={`${styles.textarea} ${styles.textareaTrigger} ${!eventData.summary ? styles.textareaPlaceholder : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => setIsSummaryModalOpen(true)}
            onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? setIsSummaryModalOpen(true) : undefined}
          >
            {eventData.summary || 'Describe what attendees will experience and take away. Include specifics: what they\'ll taste, see, learn, or feel.'}
          </div>
        </div>
      </div>

      {/* Event Trailer */}
      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleRow}>
            <span className={styles.sectionLabel}>Event trailer</span>
            <span className={styles.recommendedBadge}>Recommended</span>
          </div>
        </div>
        {/* Boost alert — above the URL input per new design */}
        <div className={styles.blueAlert}>
          <span className={styles.alertIconWrap}><FlameIcon /></span>
          <div className={styles.alertText}>
            <p className={styles.alertTitle}>Boost sales with video</p>
            <p className={styles.alertBody}>Events like yours sell 16% more tickets when video is added to the listing.</p>
          </div>
        </div>
        <div className={styles.videoInputGroup}>
          <div className={`${styles.iconField} ${isVideoLoading ? styles.loadingField : ''} ${videoUrlError || embeddingBlocked ? styles.iconFieldError : ''}`}>
            <div className={styles.iconContainer}>
              <LinkIcon state={
                videoUrlError || embeddingBlocked ? 'error'
                : videoInfo ? 'success'
                : 'default'
              } />
            </div>
            {videoUrl && (videoInfo || videoUrlError) ? (
              <a
                href={videoInfo ? videoInfo.originalUrl : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.urlDisplay}
              >
                {videoUrl}
              </a>
            ) : (
              <input
                className={styles.iconInput}
                type="text"
                value={videoUrl}
                onChange={(e) => handleVideoUrlChange(e.target.value)}
                placeholder={isVideoLoading ? 'Loading video…' : 'Paste video URL'}
              />
            )}
            {videoUrl && (
              <button
                className={styles.deleteBtnImg}
                type="button"
                onClick={handleRemoveVideo}
                aria-label="Remove video"
              >
                <img src="/icons/IconButton_Delete.png" width={32} height={32} alt="" />
              </button>
            )}
          </div>
          {videoUrlError && (
            <p className={styles.errorText}>{videoUrlError}</p>
          )}
          {embeddingBlocked && (
            <p className={styles.errorText}>
              This video has embedding disabled by its owner and can&apos;t be previewed here. Try a different video.
            </p>
          )}
          {!videoInfo && !videoUrlError && (
            <p className={styles.helperText}>
              Already shared on YouTube? Paste the link, and we&apos;ll pull the best moment as your event card preview.
            </p>
          )}
        </div>
        <div className={`${styles.iconField} ${styles.disabledField} ${styles.uploadField}`}>
          <div className={styles.iconContainer}>
            <UploadIcon />
          </div>
          <span className={styles.iconPlaceholder}>Upload video</span>
        </div>
      </div>

      {/* Event Schedule */}
      <div className={styles.card}>
        <label className={styles.sectionLabel}>Event schedule</label>
        <div className={styles.scheduleGrid}>
          <div className={styles.floatingField}>
            <div className={styles.floatingContent}>
              <span className={styles.floatingLabel}>Start date</span>
              <input
                className={styles.floatingInput}
                type="text"
                value={eventData.startDate}
                onChange={(e) => update({ startDate: e.target.value })}
                placeholder="mm/dd/yyyy"
              />
            </div>
            <CalendarIcon />
          </div>
          <div className={styles.floatingField}>
            <div className={styles.floatingContent}>
              <span className={styles.floatingLabel}>Start time</span>
              <input
                className={styles.floatingInput}
                type="text"
                value={eventData.startTime}
                onChange={(e) => update({ startTime: e.target.value })}
                placeholder="hh:mm AM"
              />
            </div>
            <ClockIcon />
          </div>
          <div className={styles.floatingField}>
            <div className={styles.floatingContent}>
              <span className={styles.floatingLabel}>End date</span>
              <input
                className={styles.floatingInput}
                type="text"
                value={eventData.endDate}
                onChange={(e) => update({ endDate: e.target.value })}
                placeholder="mm/dd/yyyy"
              />
            </div>
            <CalendarIcon />
          </div>
          <div className={styles.floatingField}>
            <div className={styles.floatingContent}>
              <span className={styles.floatingLabel}>End time</span>
              <input
                className={styles.floatingInput}
                type="text"
                value={eventData.endTime}
                onChange={(e) => update({ endTime: e.target.value })}
                placeholder="hh:mm AM"
              />
            </div>
            <ClockIcon />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className={styles.card}>
        <label className={styles.sectionLabel}>Location</label>
        <div className={styles.iconField}>
          <div className={styles.iconContainer}>
            <SearchIcon />
          </div>
          <input
            className={styles.iconInput}
            type="text"
            value={eventData.venue}
            onChange={(e) => update({ venue: e.target.value })}
            placeholder="Address or venue name"
          />
        </div>
      </div>

      {/* Add Your Logo */}
      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Add your logo</span>
          <p className={styles.sectionSubtitle}>
            Upload your logo to build trust and help attendees explore your other events.
          </p>
        </div>
        <div
          className={styles.iconField}
          style={{ cursor: eventData.organizerLogo ? 'default' : 'pointer' }}
          onClick={() => !eventData.organizerLogo && logoInputRef.current?.click()}
        >
          <div className={styles.iconContainer}>
            <LogoUploadIcon hasLogo={!!eventData.organizerLogo} />
          </div>
          {eventData.organizerLogo ? (
            <>
              <div className={styles.logoPreviewWrap}>
                <img
                  src={eventData.organizerLogo}
                  className={styles.logoPreview}
                  alt="Organizer logo"
                />
              </div>
              <button
                className={styles.deleteBtnImg}
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemoveLogo(); }}
                aria-label="Remove logo"
              >
                <img src="/icons/IconButton_Delete.png" width={32} height={32} alt="" />
              </button>
            </>
          ) : (
            <span className={styles.iconPlaceholder}>Upload image</span>
          )}
        </div>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Event Summary modal */}
      {isSummaryModalOpen && (
        <SummaryModal
          initialDescription={eventData.summary}
          onDone={(text) => {
            update({ summary: text });
            setIsSummaryModalOpen(false);
          }}
          onClose={() => setIsSummaryModalOpen(false)}
        />
      )}
    </div>
  );
};

/* ── Icon Components ─────────────────────────────────────── */

const iconStyle: React.CSSProperties = { display: 'block', height: 20, width: 'auto' };

function FlameIcon() {
  return <img src="/icons/Icon_Boost.png" style={iconStyle} alt="" />;
}

function LinkIcon({ state = 'default' }: { state?: 'default' | 'success' | 'error' }) {
  return (
    <div style={{ position: 'relative', width: 20, height: 20, flexShrink: 0 }}>
      <img src="/icons/Icon_Link.png" style={{ display: 'block', width: 20, height: 20 }} alt="" />
      {state === 'success' && (
        <img
          src="/icons/Icon_Success.png"
          width={12} height={12}
          style={{ position: 'absolute', bottom: -4, right: -4, display: 'block' }}
          alt=""
        />
      )}
      {state === 'error' && (
        <img
          src="/icons/alert.png"
          width={12} height={12}
          style={{ position: 'absolute', bottom: -4, right: -4, display: 'block' }}
          alt=""
        />
      )}
    </div>
  );
}

function UploadIcon() {
  return <img src="/icons/Icon_Upload.png" style={iconStyle} alt="" />;
}

function LogoUploadIcon({ hasLogo }: { hasLogo: boolean }) {
  return (
    <div style={{ position: 'relative', width: 20, height: 20, flexShrink: 0 }}>
      <img src="/icons/Icon_Upload.png" style={{ display: 'block', width: 20, height: 20 }} alt="" />
      {hasLogo && (
        <img
          src="/icons/Icon_Success.png"
          width={12} height={12}
          style={{ position: 'absolute', bottom: -1, right: -6, display: 'block' }}
          alt=""
        />
      )}
    </div>
  );
}

function CalendarIcon() {
  return <img src="/icons/Icon_Calendar.png" style={iconStyle} alt="" />;
}

function ClockIcon() {
  return <img src="/icons/Icon_Clock.png" style={iconStyle} alt="" />;
}

function SearchIcon() {
  return <img src="/icons/Icon_Search.png" style={iconStyle} alt="" />;
}

function ArrowRightIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5 12H19M19 12L13 6M19 12L13 18"
        stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}
