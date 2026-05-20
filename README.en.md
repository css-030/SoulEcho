# SoulEcho

[中文](./README.md) | [English](./README.en.md)

SoulEcho is a cyber wellness music AI and a small emotional healing room you can keep in your pocket. Centered around momo, it blends AI conversation, music recommendations, Five Elements emotion sensing, and Chinese wellness-inspired healing music. On ordinary days, momo recommends music that fits your taste. When you are emotionally low, momo considers the time, weather, and your Five Elements state to suggest gentler healing music and stay with you through that moment.

> SoulEcho is designed for local personal use. API keys, cookies, chat history, and emotion data should stay on your own machine.

## Product Highlights

### 1. momo chats with you and listens with you

momo is not just a player, and not just another blank chat box. You can tell momo what happened today, what you want to hear, or what kind of mood you want to move toward. momo responds through conversation and music, with a tone that feels closer to your current state.

It can remember your nickname, preferred speaking style, and daily interaction rhythm, so SoulEcho feels more like a personal companion space than a one-off tool.

### 2. Daily playlists shaped by your music taste

SoulEcho does not simply throw random tracks at you. You can connect NetEase Cloud Music or YouTube, and momo will recommend music based on your listening taste, the current conversation, and what you ask for in the moment.

If you just want background music, momo can prepare a daily playlist. If a song does not fit, simply say "change it" or "play something else." With a NetEase cookie, momo can also read your liked songs and gradually build a music taste profile that feels more like you.

### 3. Chinese wellness-inspired healing music

When you feel heavy, irritated, exhausted, or close to breaking down, momo does more than offer a few comforting lines. It combines your emotional expression with time, weather, and Five Elements signals to decide what kind of healing music may fit the moment.

SoulEcho connects emotions with Wood, Fire, Earth, Metal, and Water, along with related body imagery and musical atmosphere. In the healing space, music, color, body visuals, and playback rhythm work together to help you slowly step out of the emotional storm.

### 4. Emotion Garden: keep a gentle trace of each day

Some emotions are intense when they arrive, then become blurry a few days later. SoulEcho turns your interactions with momo into an Emotion Garden, where you can review your recent emotional patterns by day.

You can see which days felt calmer and which days leaned toward irritation, sadness, or fatigue. If momo gets a day wrong, you can correct it manually. The goal is not to score you, but to help you see your own rhythm more gently.

### 5. Local-first, like your own quiet room

SoulEcho is a local-first PWA that can be installed as a standalone app window. Chat history, emotion records, settings, and your profile are stored in your browser's local database.

You can export a backup, import data later, or clear the chat history when you want a fresh start. For SoulEcho, companionship and privacy matter together.

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Then fill in the values you need:

```env
VITE_OPENAI_API_KEY=
VITE_NETEASE_API_URL=http://localhost:3000
VITE_OPENWEATHER_API_KEY=
VITE_OPENWEATHER_DEFAULT_CITY=Guangzhou
VITE_YOUTUBE_API_KEY=
VITE_DEBUG_MODE=false
```

Field notes:

- `VITE_OPENAI_API_KEY`: OpenAI API key for momo's AI conversation.
- `VITE_NETEASE_API_URL`: Local NetEase API URL. Default is `http://localhost:3000`.
- `VITE_OPENWEATHER_API_KEY`: OpenWeather API key for weather-aware chat context.
- `VITE_OPENWEATHER_DEFAULT_CITY`: Default city for weather context.
- `VITE_YOUTUBE_API_KEY`: Optional. Enables real YouTube search; when empty, SoulEcho uses a local fallback library.
- `VITE_DEBUG_MODE`: Debug mode switch.

Do not commit `.env.local`, `.env`, API keys, cookies, or tokens.

### 3. Start the frontend

```bash
npm run dev
```

The default URL is:

```text
http://localhost:5173
```

If you only need chat, settings, Emotion Garden, and fallback YouTube music, the frontend is enough.

### 4. Start the local NetEase API (optional)

If you want NetEase music, NetEase cookie checks, liked-song taste analysis, or healing playlists, open another terminal and run:

```bash
npx NeteaseCloudMusicApi@latest
```

The service should run at:

```text
http://localhost:3000
```

You can also use the community enhanced fork:

```bash
git clone https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced.git
cd api-enhanced
pnpm install
node app.js
```

After starting it, you can check the service in your browser:

```text
http://localhost:3000/search?keywords=healing%20music
```

## How to Use

1. Open `http://localhost:5173`.
2. Go to Settings and fill in your OpenAI API key. Add OpenWeather, YouTube, NetEase API, and NetEase cookie if needed.
3. Return to chat and talk with momo directly.
4. If you want music, say things like "play some music", "change this song", or "give me some R&B".
5. When momo offers a healing session, you can enter the healing space.
6. Open Emotion Garden to review monthly emotion records, correct a day, and read the summary.
7. In Settings, you can export a local backup or clear chat history for a fresh start.

## Install as a PWA

### Chrome / Edge

1. Run `npm run dev` and open `http://localhost:5173`.
2. Click the install icon in the address bar, or choose "Install SoulEcho" from the browser menu.
3. After installation, you can open SoulEcho from your desktop, Start menu, or taskbar.

### Daily startup reminder

After restarting your computer, the installed PWA will not start the local services automatically. Start the frontend first:

```bash
npm run dev
```

If you use NetEase-related features, start the local NetEase API in another terminal:

```bash
npx NeteaseCloudMusicApi@latest
```

Once the services are running, open the SoulEcho PWA icon or visit `http://localhost:5173`.

## Common Scripts

```bash
npm run dev
```

Start the local development server.

```bash
npm run build
```

Run TypeScript checks and build the production bundle.

```bash
npm run preview
```

Preview the built app locally.

```bash
npm run typecheck
```

Run TypeScript type checking only.

```bash
npm run test
```

Run Vitest tests.

## Data and Privacy

- Chat history, emotion records, settings, user profile, and long-term memory are stored in browser IndexedDB.
- Requests to OpenAI, OpenWeather, YouTube, or NetEase only happen when the related feature is used.
- NetEase cookies should only be entered in your own local environment and should never be committed.
- Exported JSON backups may contain chat content, settings, and profile data. Keep them private.

## FAQ

### The PWA opens but the page cannot load

The PWA does not start Vite automatically. Run this in the project directory first:

```bash
npm run dev
```

### NetEase music does not work

Make sure the local NetEase API service is running and the API URL in Settings is:

```text
http://localhost:3000
```

If you want to read liked songs from your account, also add a valid NetEase cookie in Settings.

### momo cannot reply with AI responses

Make sure a valid OpenAI API key is set in `.env.local` or in Settings. After saving it, return to chat and send the next message.

### Weather context is unavailable

Make sure `VITE_OPENWEATHER_API_KEY` is set, or add an OpenWeather API key in Settings. Also check that the default city is correct.
