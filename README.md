# SoulEcho

SoulEcho is a local-first AI emotion companion PWA. It is designed for GitHub cloning and local use only.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`, then fill in your own local API keys:

```env
VITE_OPENAI_API_KEY=
VITE_NETEASE_API_URL=http://localhost:3000
VITE_OPENWEATHER_API_KEY=
```

Never commit `.env.local`, `.env`, API keys, cookies, or tokens.

## NeteaseCloudMusicApi

SoulEcho uses a local NeteaseCloudMusicApi service for NetEase music search and playback URLs.

Start it before developing NetEase-related features. The original `Binaryify/NeteaseCloudMusicApi` GitHub repository currently points people away from the old repo, but the community-maintained enhanced fork is available here:

```bash
git clone https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced.git
cd api-enhanced
pnpm install
node app.js
```

You can also use the npm package:

```bash
npx NeteaseCloudMusicApi@latest
```

The service should run at `http://localhost:3000`.

To verify it:

```bash
http://localhost:3000/search?keywords=广陵散
```
一个治愈音乐app
