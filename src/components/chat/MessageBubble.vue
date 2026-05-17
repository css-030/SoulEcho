<script setup lang="ts">
import { computed, ref } from 'vue'

import HealingInviteCard from '@/components/chat/HealingInviteCard.vue'
import MusicRecommendCard from '@/components/chat/MusicRecommendCard.vue'
import type { Message } from '@/types/message'
import { formatChatTimestamp } from '@/utils/time'

interface Props {
  message: Message
}

const props = defineProps<Props>()

const hasAvatarError = ref(false)

const isUser = computed(() => props.message.role === 'user')
const speakerName = computed(() => (isUser.value ? '你' : 'momo'))
const messageTime = computed(() => formatChatTimestamp(props.message.timestamp))
const avatarSrc = computed(() => (isUser.value ? '/avatars/user-default.png' : '/avatars/momo-default.png'))
const avatarText = computed(() => (isUser.value ? '你' : 'M'))

function handleAvatarError(): void {
  hasAvatarError.value = true
}
</script>

<template>
  <div class="message-row" :class="[`is-${message.role}`]">
    <div class="message-row__avatar" aria-hidden="true">
      <img v-if="!hasAvatarError" :src="avatarSrc" :alt="`${speakerName} 头像`" loading="lazy" @error="handleAvatarError" />
      <span v-else>{{ avatarText }}</span>
    </div>

    <article class="message-bubble">
      <div class="message-bubble__meta">
        <span>{{ speakerName }}</span>
        <time>{{ messageTime }}</time>
      </div>
      <MusicRecommendCard
        v-if="message.type === 'music_card' && message.musicRecommendation"
        :recommendation="message.musicRecommendation"
      />
      <HealingInviteCard
        v-else-if="message.type === 'healing_invite' && message.healingTrigger"
        :trigger="message.healingTrigger"
        :content="message.content"
      />
      <p v-else class="message-bubble__content">{{ message.content }}</p>
    </article>
  </div>
</template>

<style scoped>
.message-row {
  display: grid;
  grid-template-columns: 2.75rem minmax(0, max-content);
  gap: var(--space-sm);
  align-items: end;
  max-width: min(68%, 42rem);
}

.message-row.is-momo {
  align-self: flex-start;
}

.message-row.is-user {
  grid-template-columns: minmax(0, max-content) 2.75rem;
  align-self: flex-end;
}

.message-row.is-user .message-row__avatar {
  grid-column: 2;
}

.message-row.is-user .message-bubble {
  grid-column: 1;
  grid-row: 1;
}

.message-row__avatar {
  width: 2.75rem;
  height: 2.75rem;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--chat-avatar-radius, var(--radius-pill));
  background: var(--chat-bubble-momo-bg, var(--bg-card));
  box-shadow: var(--chat-bubble-shadow, var(--shadow-card));
}

.message-row__avatar img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-row__avatar span {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: var(--text-secondary);
  font-weight: 800;
}

.message-bubble {
  max-width: 100%;
  padding: 0.75rem 1rem;
  border: var(--chat-bubble-border, 1px solid var(--color-border));
  border-radius: var(--chat-bubble-radius, var(--radius-lg));
  background: var(--chat-bubble-momo-bg, var(--bg-card));
  box-shadow: var(--chat-bubble-shadow, var(--shadow-card));
  backdrop-filter: var(--chat-bubble-filter, blur(8px));
}

.message-bubble:has(.music-card),
.message-bubble:has(.healing-card) {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

.message-row.is-momo .message-bubble {
  border-bottom-left-radius: var(--radius-sm);
}

.message-row.is-user .message-bubble {
  border-bottom-right-radius: var(--radius-sm);
  background: var(--chat-bubble-user-bg, var(--color-primary));
  color: white;
}

.message-bubble__meta {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
  margin-bottom: var(--space-xs);
  color: var(--text-tertiary);
  font-size: 0.75rem;
  font-weight: 700;
}

.message-row.is-user .message-bubble__meta {
  color: white;
  opacity: 0.86;
}

.message-bubble__content {
  margin: 0;
  color: var(--text-primary);
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-row.is-user .message-bubble__content {
  color: white;
}

@media (max-width: 640px) {
  .message-row {
    max-width: 94%;
  }
}
</style>
