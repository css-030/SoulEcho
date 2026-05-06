<script setup lang="ts">
import { computed, ref } from 'vue'

import { usePlayerStore } from '@/stores/player'
import type { MusicRecommendation, Playlist, Track } from '@/types/music'

interface Props {
  recommendation: MusicRecommendation
}

const props = defineProps<Props>()
const playerStore = usePlayerStore()
const isPlaylistExpanded = ref(true)

const canPlay = computed(() => Boolean(props.recommendation.primaryTrack || props.recommendation.playlist))
const playlistTracks = computed(() => props.recommendation.playlist?.tracks ?? [])
const hasPlaylist = computed(() => playlistTracks.value.length > 1)
const visiblePlaylistTracks = computed(() => playlistTracks.value.slice(0, 6))
const playlistToggleLabel = computed(() => (isPlaylistExpanded.value ? '\u6536\u8d77' : `\u5c55\u5f00 ${playlistTracks.value.length} \u9996`))
const labelText = computed(() => (props.recommendation.scenario === 'healing' ? '\u7597\u6108\u6b4c\u5355' : 'momo \u63a8\u8350\u6b4c\u5355'))
const styleTags = computed(() => buildStyleTags(props.recommendation))

async function handlePlay(): Promise<void> {
  if (props.recommendation.playlist) {
    await playerStore.play(props.recommendation.playlist)
    return
  }

  if (props.recommendation.primaryTrack) {
    await playerStore.play(props.recommendation.primaryTrack)
  }
}

async function handlePlayTrack(track: Track): Promise<void> {
  if (!props.recommendation.playlist) {
    await playerStore.play(track)
    return
  }

  await playerStore.play(createPlaylistStartingWith(props.recommendation.playlist, track))
}

function createPlaylistStartingWith(playlist: Playlist, track: Track): Playlist {
  const trackIds = new Set([track.id, track.youtubeId, track.neteaseId].filter((id): id is string => Boolean(id)))
  return {
    ...playlist,
    tracks: [track, ...playlist.tracks.filter((item) => ![item.id, item.youtubeId, item.neteaseId].some((id) => id && trackIds.has(id)))]
  }
}

function buildStyleTags(recommendation: MusicRecommendation): string[] {
  const tracks = recommendation.playlist?.tracks ?? (recommendation.primaryTrack ? [recommendation.primaryTrack] : [])
  const haystack = [
    recommendation.searchQuery,
    recommendation.reason,
    ...tracks.flatMap((track) => [track.title, track.artist])
  ]
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .toLowerCase()

  const candidates: Array<[string, string[]]> = [
    ['R&B', ['r&b', 'rnb']],
    ['Neo Soul', ['neo soul']],
    ['Soul', ['soul']],
    ['Deep House', ['deep house']],
    ['House', ['house']],
    ['Chillout', ['chillout', 'chill out']],
    ['Lounge', ['lounge']],
    ['Ambient', ['ambient']],
    ['Electronic', ['electronic', 'electronica']],
    ['Jazz', ['jazz']],
    ['Pop', ['pop']],
    ['Summer', ['summer', '夏']],
    ['Night Vibes', ['night', 'late night', 'bedroom']],
    ['Instrumental', ['instrumental']],
    ['Live Radio', ['live radio', '24/7', 'radio', 'stream']],
    ['Chill', ['chill', 'relax']],
    ['Healing', ['healing', '疗愈']]
  ]

  const tags = candidates
    .filter(([, keywords]) => keywords.some((keyword) => haystack.includes(keyword)))
    .map(([label]) => label)
    .filter((label, index, array) => array.indexOf(label) === index)

  if (tags.length === 0) {
    tags.push(recommendation.source === 'youtube' ? 'YouTube BGM' : recommendation.source)
  }

  return tags.slice(0, 4)
}
</script>

<template>
  <article class="music-card" :class="recommendation.targetWuxing ? `is-${recommendation.targetWuxing}` : undefined">
    <div class="music-card__main">
      <div class="music-card__cover" aria-hidden="true">
        <img v-if="recommendation.primaryTrack?.thumbnailUrl" :src="recommendation.primaryTrack.thumbnailUrl" alt="" />
        <span v-else>♪</span>
      </div>

      <div class="music-card__body">
        <p class="music-card__label">{{ labelText }}</p>
        <ul class="music-card__tags" aria-label="Style tags">
          <li v-for="tag in styleTags" :key="tag" class="music-card__tag">{{ tag }}</li>
        </ul>
      </div>

      <button class="music-card__play" type="button" :disabled="!canPlay" aria-label="Play recommendation" @click="handlePlay">
        ▶
      </button>
    </div>

    <div v-if="hasPlaylist" class="music-card__queue">
      <button class="music-card__queue-toggle" type="button" :aria-expanded="isPlaylistExpanded" @click="isPlaylistExpanded = !isPlaylistExpanded">
        <span>{{ playlistTracks.length }} tracks in this playlist</span>
        <span>{{ playlistToggleLabel }}</span>
      </button>

      <ol v-if="isPlaylistExpanded" class="music-card__queue-list">
        <li v-for="(track, index) in visiblePlaylistTracks" :key="track.id" class="music-card__queue-item">
          <button class="music-card__queue-track" type="button" @click="handlePlayTrack(track)">
            <span class="music-card__queue-index">{{ index + 1 }}</span>
            <span class="music-card__queue-text">
              <span class="music-card__queue-title" :title="track.title">{{ track.title }}</span>
              <span class="music-card__queue-artist" :title="track.artist">{{ track.artist }}</span>
            </span>
          </button>
        </li>
      </ol>
    </div>
  </article>
</template>

<style scoped>
.music-card {
  display: grid;
  gap: var(--space-sm);
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--music-wuxing-color, var(--color-accent));
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}

.music-card__main {
  display: grid;
  grid-template-columns: 4rem minmax(0, 1fr) 2.75rem;
  gap: var(--space-md);
  align-items: center;
}

.music-card.is-wood {
  --music-wuxing-color: var(--color-wood);
}

.music-card.is-fire {
  --music-wuxing-color: var(--color-fire);
}

.music-card.is-earth {
  --music-wuxing-color: var(--color-earth);
}

.music-card.is-metal {
  --music-wuxing-color: var(--color-metal);
}

.music-card.is-water {
  --music-wuxing-color: var(--color-water);
}

.music-card__cover {
  display: grid;
  width: 4rem;
  aspect-ratio: 1;
  overflow: hidden;
  place-items: center;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--music-wuxing-color, var(--color-primary)) 20%, var(--bg-card));
  color: var(--music-wuxing-color, var(--color-accent));
  font-size: 1.75rem;
  font-weight: 800;
}

.music-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.music-card__body {
  min-width: 0;
}

.music-card__label {
  margin: 0;
}

.music-card__label {
  color: var(--text-tertiary);
  font-size: 0.75rem;
  font-weight: 800;
}

.music-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: var(--space-xs) 0 0;
  padding: 0;
  list-style: none;
}

.music-card__tag {
  max-width: 100%;
  padding: 0.12rem 0.5rem;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--music-wuxing-color, var(--color-accent)) 28%, var(--color-border));
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--music-wuxing-color, var(--color-accent)) 10%, transparent);
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-card__play {
  display: grid;
  width: 2.75rem;
  aspect-ratio: 1;
  place-items: center;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: var(--bg-primary);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 900;
  box-shadow: var(--shadow-card);
}

.music-card__play:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.music-card__queue {
  display: grid;
  gap: var(--space-xs);
  padding-top: var(--space-xs);
  border-top: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
}

.music-card__queue-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  min-height: 2rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 800;
}

.music-card__queue-list {
  display: grid;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.music-card__queue-track {
  display: grid;
  grid-template-columns: 1.5rem minmax(0, 1fr);
  gap: var(--space-sm);
  align-items: center;
  width: 100%;
  min-height: 2.5rem;
  padding: 0.25rem var(--space-xs);
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  text-align: left;
}

.music-card__queue-track:hover {
  background: color-mix(in srgb, var(--color-primary) 14%, transparent);
}

.music-card__queue-index {
  color: var(--text-tertiary);
  font-size: 0.75rem;
  font-weight: 900;
  text-align: center;
}

.music-card__queue-text,
.music-card__queue-title,
.music-card__queue-artist {
  min-width: 0;
}

.music-card__queue-title,
.music-card__queue-artist {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-card__queue-title {
  color: var(--text-primary);
  font-size: 0.8125rem;
  font-weight: 800;
}

.music-card__queue-artist {
  color: var(--text-tertiary);
  font-size: 0.75rem;
  font-weight: 700;
}

@media (max-width: 640px) {
  .music-card__main {
    grid-template-columns: 3.5rem minmax(0, 1fr) 2.5rem;
    gap: var(--space-sm);
  }

  .music-card__cover {
    width: 3.5rem;
  }
}
</style>
