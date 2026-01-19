# Event Card Preview Tool

A desktop web tool to simulate and preview event card videos. Upload videos from YouTube, TikTok, or Instagram Reels and preview how they'll appear in a 1:1 aspect ratio event card format.

## Features

- **Multi-platform Support**: Paste links from YouTube, TikTok, or Instagram Reels
- **1:1 Video Preview**: See exactly how your video will look on the event card
- **30-Second Preview Editor**: Drag and select your desired 30-second preview segment
- **Interactive Timeline**: Visual timeline scrubber with drag-to-select functionality
- **Video Thumbnail Filmstrip**: Click thumbnails to jump to specific moments in YouTube videos
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
│   ├── globals.css         # Global styles
│   └── api/
│       └── youtube-thumbnails/
│           └── route.ts    # API route for fetching YouTube thumbnails
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
- **YouTube Thumbnails**: Thumbnails are fetched server-side to bypass CORS restrictions
- **Optional YouTube API Key**: For more reliable thumbnail access, set `YOUTUBE_API_KEY` in your `.env.local` file
  - Get your API key from: https://console.cloud.google.com/apis/credentials
  - Enable "YouTube Data API v3" in your Google Cloud project
- **Description Suggestions**: AI-powered description suggestions use Eventbrite's self-service LLM endpoints
  - **Eventbrite LLM (Hackathon)**: 
    - Generate your API key from the "Self-Service LLM Endpoints for Hackathon" announcement
    - Follow the instructions to generate your API key in ~30 seconds
    - Add it to `.env.local`: `EVENTBRITE_LLM_API_KEY=your_key_here`
    - Optional: Set `EVENTBRITE_LLM_MODEL=qwen` or `mistral` (default: qwen)
    - Optional: Set `EVENTBRITE_LLM_BASE_URL` if different from default
    - Uses OpenAI-compatible proxy, so standard OpenAI client libraries work
    - Restart your dev server after adding the key

## Future Enhancements

- Detect actual video duration from APIs
- Support for more video platforms
- Export selected video segment
- Save/load preview configurations
- Keyboard shortcuts for timeline navigation

