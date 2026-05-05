import type { Track } from '@/types/music'
import type { WuxingType } from '@/types/wuxing'

export interface FallbackTrack extends Track {
  tags: string[]
  playlistId?: WuxingType | 'daily'
}

export const FALLBACK_LIBRARY: {
  youtube: FallbackTrack[]
  netease: { playlistId: string; wuxing: WuxingType }[]
} = {
  youtube: [
    {
      id: 'daily_001',
      source: 'youtube',
      youtubeId: 'ZOvxObCrhMQ',
      title: 'R&B YouTube Mix',
      artist: 'YouTube Playlist',
      duration: 0,
      playlistId: 'daily',
      thumbnailUrl: 'https://i.ytimg.com/vi/ZOvxObCrhMQ/hqdefault.jpg',
      tags: ['r&b', 'rnb', 'youtube playlist', 'youtube mix', 'soul', '放松', '日常', 'daily']
    },
    {
      id: 'daily_002',
      source: 'youtube',
      youtubeId: 'qBVh6esuR30',
      title: 'R&B Bedroom Mix',
      artist: 'RnB Soul Chill Mix',
      duration: 5400,
      playlistId: 'daily',
      tags: ['r&b', 'rnb', 'slow jam', 'soul', 'bedroom mix', 'chill', '放松', '日常', 'daily']
    },
    {
      id: 'wood_001',
      source: 'youtube',
      youtubeId: 'jfKfPfyJRdk',
      title: '流水',
      artist: '龚一',
      duration: 360,
      playlistId: 'wood',
      tags: ['流水', '龚一', '古琴', '木', 'wood', '肝', '平肝', '角调', '焦躁', '压抑']
    },
    {
      id: 'wood_002',
      source: 'youtube',
      youtubeId: 'jfKfPfyJRdk',
      title: '莲心不染',
      artist: '巫娜',
      duration: 420,
      playlistId: 'wood',
      tags: ['莲心不染', '巫娜', '古琴', '木', 'wood', '肝', '角调', '疏肝']
    },
    {
      id: 'fire_001',
      source: 'youtube',
      youtubeId: 'jfKfPfyJRdk',
      title: '渔舟唱晚',
      artist: '古筝',
      duration: 300,
      playlistId: 'fire',
      tags: ['渔舟唱晚', '古筝', '火', 'fire', '心', '安神', '徵调', '心慌', '失眠']
    },
    {
      id: 'fire_002',
      source: 'youtube',
      youtubeId: 'jfKfPfyJRdk',
      title: '风铃轻音',
      artist: '自然疗愈',
      duration: 300,
      playlistId: 'fire',
      tags: ['风铃', '轻音', '火', 'fire', '心', '安神', '徵调', '烦躁']
    },
    {
      id: 'earth_001',
      source: 'youtube',
      youtubeId: 'jfKfPfyJRdk',
      title: '楚歌',
      artist: '埙曲',
      duration: 360,
      playlistId: 'earth',
      tags: ['楚歌', '埙', '土', 'earth', '脾', '宫调', '健脾', '思虑', '忧虑']
    },
    {
      id: 'earth_002',
      source: 'youtube',
      youtubeId: 'jfKfPfyJRdk',
      title: '土地颂歌',
      artist: '低音鼓',
      duration: 360,
      playlistId: 'earth',
      tags: ['土地', '低音鼓', '土', 'earth', '脾', '宫调', '无力', '稳定']
    },
    {
      id: 'metal_001',
      source: 'youtube',
      youtubeId: 'jfKfPfyJRdk',
      title: '关山月',
      artist: '箫曲',
      duration: 420,
      playlistId: 'metal',
      tags: ['关山月', '箫', '金', 'metal', '肺', '商调', '润肺', '悲伤', '孤独']
    },
    {
      id: 'metal_002',
      source: 'youtube',
      youtubeId: 'jfKfPfyJRdk',
      title: '晨钟暮鼓',
      artist: '编钟',
      duration: 420,
      playlistId: 'metal',
      tags: ['晨钟暮鼓', '编钟', '金', 'metal', '肺', '商调', '低落', '宁心']
    },
    {
      id: 'water_001',
      source: 'youtube',
      youtubeId: 'jfKfPfyJRdk',
      title: '禅院钟声',
      artist: '蒋彦',
      duration: 540,
      playlistId: 'water',
      tags: ['禅院钟声', '蒋彦', '钟声', '水', 'water', '肾', '羽调', '助眠', '焦虑']
    },
    {
      id: 'water_002',
      source: 'youtube',
      youtubeId: 'jfKfPfyJRdk',
      title: '海浪冥想',
      artist: '自然白噪音',
      duration: 600,
      playlistId: 'water',
      tags: ['海浪', '冥想', '雨声', '水', 'water', '肾', '羽调', '恐惧', '安全感']
    }
  ],
  netease: [
    { playlistId: 'NETEASE_PLAYLIST_ID_WOOD', wuxing: 'wood' },
    { playlistId: 'NETEASE_PLAYLIST_ID_FIRE', wuxing: 'fire' },
    { playlistId: 'NETEASE_PLAYLIST_ID_EARTH', wuxing: 'earth' },
    { playlistId: 'NETEASE_PLAYLIST_ID_METAL', wuxing: 'metal' },
    { playlistId: 'NETEASE_PLAYLIST_ID_WATER', wuxing: 'water' }
  ]
}
