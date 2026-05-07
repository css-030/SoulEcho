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
      id: 'daily_003',
      source: 'youtube',
      youtubeId: 'xvv44XEqcHI',
      title: 'SZA Top Songs Playlist',
      artist: 'Kioumiusic',
      duration: 0,
      playlistId: 'daily',
      thumbnailUrl: 'https://i.ytimg.com/vi/xvv44XEqcHI/hqdefault.jpg',
      tags: ['sza', 'top songs', 'study', 'chill', 'sleep', 'playlist', 'r&b', 'rnb', 'daily']
    },
    {
      id: 'wood_001',
      source: 'youtube',
      youtubeId: 'jfKfPfyJRdk',
      title: 'YouTube healing radio',
      artist: 'Lofi Girl',
      duration: 360,
      playlistId: 'wood',
      tags: ['流水', '龚一', '古琴', '木', 'wood', '肝', '平肝', '角调', '焦躁', '压抑']
    },
    {
      id: 'wood_002',
      source: 'youtube',
      youtubeId: 'jfKfPfyJRdk',
      title: 'YouTube healing radio',
      artist: 'Lofi Girl',
      duration: 420,
      playlistId: 'wood',
      tags: ['莲心不染', '巫娜', '古琴', '木', 'wood', '肝', '角调', '疏肝']
    },
    {
      id: 'fire_001',
      source: 'youtube',
      youtubeId: 'jfKfPfyJRdk',
      title: 'YouTube healing radio',
      artist: 'Lofi Girl',
      duration: 300,
      playlistId: 'fire',
      tags: ['渔舟唱晚', '古筝', '火', 'fire', '心', '安神', '徵调', '心慌', '失眠']
    },
    {
      id: 'fire_002',
      source: 'youtube',
      youtubeId: 'jfKfPfyJRdk',
      title: 'YouTube healing radio',
      artist: 'Lofi Girl',
      duration: 300,
      playlistId: 'fire',
      tags: ['风铃', '轻音', '火', 'fire', '心', '安神', '徵调', '烦躁']
    },
    {
      id: 'earth_001',
      source: 'youtube',
      youtubeId: 'jfKfPfyJRdk',
      title: 'YouTube healing radio',
      artist: 'Lofi Girl',
      duration: 360,
      playlistId: 'earth',
      tags: ['楚歌', '埙', '土', 'earth', '脾', '宫调', '健脾', '思虑', '忧虑']
    },
    {
      id: 'earth_002',
      source: 'youtube',
      youtubeId: 'jfKfPfyJRdk',
      title: 'YouTube healing radio',
      artist: 'Lofi Girl',
      duration: 360,
      playlistId: 'earth',
      tags: ['土地', '低音鼓', '土', 'earth', '脾', '宫调', '无力', '稳定']
    },
    {
      id: 'metal_001',
      source: 'youtube',
      youtubeId: 'jfKfPfyJRdk',
      title: 'YouTube healing radio',
      artist: 'Lofi Girl',
      duration: 420,
      playlistId: 'metal',
      tags: ['关山月', '箫', '金', 'metal', '肺', '商调', '润肺', '悲伤', '孤独']
    },
    {
      id: 'metal_002',
      source: 'youtube',
      youtubeId: 'jfKfPfyJRdk',
      title: 'YouTube healing radio',
      artist: 'Lofi Girl',
      duration: 420,
      playlistId: 'metal',
      tags: ['晨钟暮鼓', '编钟', '金', 'metal', '肺', '商调', '低落', '宁心']
    },
    {
      id: 'water_001',
      source: 'youtube',
      youtubeId: 'jfKfPfyJRdk',
      title: 'YouTube healing radio',
      artist: 'Lofi Girl',
      duration: 540,
      playlistId: 'water',
      tags: ['禅院钟声', '蒋彦', '钟声', '水', 'water', '肾', '羽调', '助眠', '焦虑']
    },
    {
      id: 'water_002',
      source: 'youtube',
      youtubeId: 'jfKfPfyJRdk',
      title: 'YouTube healing radio',
      artist: 'Lofi Girl',
      duration: 600,
      playlistId: 'water',
      tags: ['海浪', '冥想', '雨声', '水', 'water', '肾', '羽调', '恐惧', '安全感']
    }
  ],
  netease: [
    { playlistId: 'album:511196', wuxing: 'wood' },
    { playlistId: 'album:511199', wuxing: 'fire' },
    { playlistId: 'album:511194', wuxing: 'earth' },
    { playlistId: 'album:511195', wuxing: 'metal' },
    { playlistId: 'album:511193', wuxing: 'water' }
  ]
}
