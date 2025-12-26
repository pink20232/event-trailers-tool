# Event Card Preview Tool

A desktop web tool to simulate and preview event card videos. Upload videos from YouTube, TikTok, or Instagram Reels and preview how they'll appear in a 1:1 aspect ratio event card format.

## Features

- **Multi-platform Support**: Paste links from YouTube, TikTok, or Instagram Reels
- **1:1 Video Preview**: See exactly how your video will look on the event card
- **60-Second Preview Editor**: Drag and select your desired 60-second preview segment
- **Interactive Timeline**: Visual timeline scrubber with drag-to-select functionality
- **Real-time Preview**: See changes instantly as you adjust the time range

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Paste Video URL**: Enter a YouTube, TikTok, or Instagram Reel link in the input field
2. **Load Video**: Click "Load Video" to fetch and display the video
3. **Preview Card**: The event card preview shows your video in a 1:1 aspect ratio
4. **Edit Time Range**: 
   - Drag the handles on the timeline to select your 60-second preview
   - Use the arrow buttons to fine-tune the selection
   - The preview updates in real-time

## Supported Platforms

- **YouTube**: Full URL support (youtube.com/watch, youtu.be, etc.)
- **TikTok**: Video links from tiktok.com
- **Instagram Reels**: Reel links from instagram.com/reel

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page component
│   ├── page.module.css     # Page styles
│   └── globals.css         # Global styles
├── components/
│   ├── VideoUrlInput.tsx   # URL input component
│   ├── EventCardPreview.tsx # 1:1 video preview
│   ├── VideoEditor.tsx     # Timeline editor
│   └── *.module.css        # Component styles
├── lib/
│   └── videoUtils.ts       # Video URL parsing utilities
└── package.json
```

## Technologies

- **Next.js 14**: React framework
- **TypeScript**: Type safety
- **Marmalade Design System**: UI components from Eventbrite
- **CSS Modules**: Scoped styling

## Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Notes

- The tool uses iframe embeds for video playback
- YouTube videos support seeking via the YouTube API
- TikTok and Instagram Reels use their native embed players
- The default video duration is set to 5 minutes (can be enhanced to detect actual duration)

## Future Enhancements

- Detect actual video duration from APIs
- Support for more video platforms
- Export selected video segment
- Save/load preview configurations
- Keyboard shortcuts for timeline navigation

