# SoulEcho

[中文](./README.md) | [English](./README.en.md)

SoulEcho 是一个电子赛博养生音乐 AI，也是一间可以装进口袋里的情绪疗愈小屋。它以 momo 为核心，把 AI 聊天、音乐推荐、五行情绪感知和中医养生式疗愈音乐结合在一起：日常里，momo 会按你的音乐口味陪你听歌；情绪低落时，它会结合时间、天气与五行状态，给你推荐更适合当下的疗愈音乐，陪你慢慢度过那一段。

> 当前项目面向本地运行与个人使用：API Key、Cookie、聊天记录和情绪数据都应只保存在你自己的本机环境中。

## 产品亮点

### 1. 一个会陪你聊天、也会陪你听歌的 momo

momo 不是一个单纯的播放器，也不是冷冰冰的聊天框。你可以和它说今天发生了什么、现在想听什么、想换一种什么样的氛围，它会在对话里理解你的状态，再用更贴近你的方式回应。

它可以记住你的称呼、偏好的说话方式和日常互动节奏，让这个应用更像是一个长期陪伴你的个人空间，而不是一次性的工具。

### 2. 按你的音乐喜好推荐日常歌单

SoulEcho 的音乐推荐不是随便丢一首歌给你。你可以接入网易云或 YouTube，让 momo 根据你的听歌偏好、当前聊天语境和你主动提出的需求，推荐更适合当下的音乐。

比如你只是想找一点背景音乐，momo 可以给你日常歌单；你觉得上一首不合适，也可以直接说“换一首”。如果你愿意配置网易云 Cookie，它还可以读取你喜欢的音乐，慢慢形成更贴近你的音乐口味画像。

### 3. 中医养生式的疗愈音乐陪伴

SoulEcho 的疗愈音乐灵感来自《黄帝内经》中「五音应五脏」和「五志」的养生观念，也借鉴了「子午流注」里顺应时辰调养气机的思路。简单来说，它不是只看你说了“难过”或“烦”，而是尝试把情绪、身体感受、时间节律和音乐气质放在一起理解。

在这套逻辑里，木、火、土、金、水分别对应肝、心、脾、肺、肾，也关联怒、喜、思、忧、恐等情绪倾向；角、徵、宫、商、羽五种音律则被用来塑造不同的音乐氛围。比如烦躁压抑时，momo 可能会偏向古琴、流水或竹笛一类更舒展的声音，帮助你把郁结慢慢松开；深夜不安时，它会更倾向低频、雨声、钟声这类下沉的音乐，让身心从紧绷里落下来。

momo 还会参考当下时辰与天气：午间更适合养心小憩，夜晚更适合安神助眠，雨天和晴天也会带来不一样的听感选择。进入疗愈空间后，音乐、色彩、身体视觉和播放节奏会一起工作，像一次轻量的赛博调息，帮你从一团乱的情绪里慢慢退出来。

> 这是一套面向情绪陪伴和音乐放松的产品体验，不构成医疗建议；如果你正在经历严重的身心困扰，请及时寻求专业帮助。

### 4. 情绪花园：把每天的状态留下来

很多情绪当下很强烈，过几天就变成模糊的一团。SoulEcho 会把你和 momo 的互动沉淀成一座情绪花园，让你按天回看最近的状态变化。

你可以看到这个月哪些天更平稳，哪些天更容易焦躁、低落或疲惫；如果 momo 识别得不准，也可以手动修正。它不是为了给你打分，而是帮你更温柔地看见自己的节律。

### 5. 本地优先，像自己的小房间

SoulEcho 是本地优先的 PWA，可以安装成独立窗口使用。聊天记录、情绪记录、设置和用户画像会保存在你自己的浏览器本地数据库中。

你可以导出备份，也可以在需要的时候清空聊天历史。对这个项目来说，陪伴感和私密感一样重要。

## 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

Windows PowerShell 可以使用：

```powershell
Copy-Item .env.example .env.local
```

然后在 `.env.local` 中填写需要的配置：

```env
VITE_OPENAI_API_KEY=
VITE_NETEASE_API_URL=http://localhost:3000
VITE_OPENWEATHER_API_KEY=
VITE_OPENWEATHER_DEFAULT_CITY=Guangzhou
VITE_YOUTUBE_API_KEY=
VITE_DEBUG_MODE=false
```

字段说明：

- `VITE_OPENAI_API_KEY`：OpenAI API Key，用于 momo 的 AI 对话。
- `VITE_NETEASE_API_URL`：本地网易云 API 地址，默认 `http://localhost:3000`。
- `VITE_OPENWEATHER_API_KEY`：OpenWeather API Key，用于把天气作为聊天上下文。
- `VITE_OPENWEATHER_DEFAULT_CITY`：默认天气城市。
- `VITE_YOUTUBE_API_KEY`：可选，用于 YouTube 真实搜索；为空时使用本地兜底曲库。
- `VITE_DEBUG_MODE`：调试开关。

请不要提交 `.env.local`、`.env`、API Key、Cookie 或 Token。

### 3. 启动前端

```bash
npm run dev
```

默认访问地址：

```text
http://localhost:5173
```

只使用聊天、设置、情绪花园和 YouTube 兜底音乐时，启动前端即可。

### 4. 启动网易云本地 API（可选）

如果你想使用网易云音乐、网易云 Cookie 检测、喜欢歌曲分析或疗愈歌单，请另开一个终端运行：

```bash
npx NeteaseCloudMusicApi@latest
```

服务默认运行在：

```text
http://localhost:3000
```

你也可以使用社区增强版：

```bash
git clone https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced.git
cd api-enhanced
pnpm install
node app.js
```

启动后可以用浏览器访问下面的地址做简单检查：

```text
http://localhost:3000/search?keywords=疗愈音乐
```

## 如何使用

1. 打开 `http://localhost:5173`。
2. 进入设置页，填写 OpenAI API Key，并按需要填写 OpenWeather、YouTube、网易云 API 与 Cookie。
3. 回到聊天页，直接和 momo 对话。
4. 如果想听音乐，可以直接说“想听歌”“换一首”“来点 R&B”等。
5. 当 momo 发出疗愈邀请时，可以选择进入疗愈空间。
6. 点击情绪花园入口，可以查看月度情绪记录、修正某天情绪并阅读统计总结。
7. 在设置页可以导出本地数据备份，或清空聊天历史重新开始。

## 安装为 PWA

### Chrome / Edge

1. 先运行 `npm run dev`，并打开 `http://localhost:5173`。
2. 点击地址栏右侧的“安装”图标，或在浏览器菜单中选择“安装 SoulEcho”。
3. 安装后可以从桌面、开始菜单或任务栏打开 SoulEcho。

### 日常使用提醒

重启电脑后，即使已经安装了 PWA，也需要先启动本地服务：

```bash
npm run dev
```

如果要用网易云相关能力，还需要另开终端启动：

```bash
npx NeteaseCloudMusicApi@latest
```

服务启动后，再点击 SoulEcho 的 PWA 图标或访问 `http://localhost:5173`。

## 常用脚本

```bash
npm run dev
```

启动本地开发服务。

```bash
npm run build
```

执行 TypeScript 检查并构建生产包。

```bash
npm run preview
```

本地预览构建后的应用。

```bash
npm run typecheck
```

只执行 TypeScript 类型检查。

```bash
npm run test
```

运行 Vitest 测试。

## 数据与隐私

- 聊天记录、情绪记录、设置、用户画像和长期记忆会保存在浏览器 IndexedDB 中。
- OpenAI、OpenWeather、YouTube、网易云等外部服务请求只在对应功能需要时发生。
- 网易云 Cookie 只应填写在自己的本地环境中，不要提交到代码仓库。
- 导出的 JSON 备份可能包含聊天内容、设置和画像数据，请妥善保存。

## 常见问题

### PWA 打开后页面无法访问

PWA 不会自动启动 Vite 服务。请先在项目目录运行：

```bash
npm run dev
```

### 网易云音乐不可用

确认本地网易云 API 服务已经启动，并且设置页中的 API 地址是：

```text
http://localhost:3000
```

如果需要读取账号喜欢的音乐，还需要在设置页填写有效的网易云 Cookie。

### momo 不能正常 AI 回复

确认 `.env.local` 或设置页中已经填写有效的 OpenAI API Key。填写后回到聊天页，再发送下一条消息即可生效。

### 天气上下文不可用

确认已填写 `VITE_OPENWEATHER_API_KEY` 或在设置页中填写 OpenWeather API Key，并检查默认城市是否正确。

## 许可证

SoulEcho 使用 [MIT License](./LICENSE) 开放。

欢迎你学习、fork、改造，或者在它的基础上做出属于你自己的版本。如果 SoulEcho 能启发新的作品，那会是一件很开心的事。

第三方服务与依赖遵循其各自的许可证和服务条款。SoulEcho 不授予任何音乐内容、平台接口或第三方版权材料的使用权。

SoulEcho 名称、momo 角色设定和视觉资产属于本项目的产品识别，请不要以容易让人误解为官方版本或官方背书的方式使用。
