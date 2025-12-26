declare namespace YT {
  interface Player {
    getDuration(): number;
    getCurrentTime(): number;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    destroy(): void;
  }

  interface PlayerOptions {
    videoId?: string;
    playerVars?: {
      autoplay?: number;
      controls?: number;
      rel?: number;
      showinfo?: number;
      enablejsapi?: number;
    };
    events?: {
      onReady?: (event: { target: Player }) => void;
      onError?: (event: any) => void;
    };
  }

  class Player {
    constructor(elementId: string | HTMLElement, options?: PlayerOptions);
  }
}

interface Window {
  YT?: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
}

