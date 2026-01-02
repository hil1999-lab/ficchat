# FicChat Studio

A lightweight, client-side tool to compose fictional chat transcripts and export chat screenshots.

## Key properties

- Static, front-end only (no backend).
- No AI features, no API calls, no API keys.
- Images can be added by uploading files (stored as local base64 data URLs), which keeps screenshot export reliable.

## Local development

Prerequisites: Node.js (LTS recommended)

```bash
npm install
npm run dev
```

## Build for static hosting

```bash
npm run build
```

The static output will be in `dist/`.

## Deploy

Any static host works. For Tencent Cloud Pages, set:

- Build command: `npm ci && npm run build`
- Output directory: `dist`
