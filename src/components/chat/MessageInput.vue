<script setup lang="ts">
interface Props {
  modelValue: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
}>()

function handleInput(event: Event): void {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    emit('submit')
  }
}
</script>

<template>
  <form class="message-input" @submit.prevent="emit('submit')">
    <textarea
      class="message-input__field"
      :value="props.modelValue"
      :disabled="disabled"
      rows="2"
      placeholder="跟 momo 说说现在的心情..."
      @input="handleInput"
      @keydown="handleKeydown"
    />
    <button class="message-input__button" type="submit" :disabled="disabled || props.modelValue.trim().length === 0">
      发送
    </button>
  </form>
</template>

<style scoped>
.message-input {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-sm);
  align-items: end;
  padding: var(--space-md);
  border: var(--chat-input-border, 1px solid var(--color-border));
  border-radius: var(--chat-bubble-radius, var(--radius-lg));
  background: var(--chat-input-bg, var(--bg-card));
  box-shadow: var(--chat-input-shadow, var(--shadow-card));
  backdrop-filter: var(--chat-bubble-filter, blur(8px));
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.message-input:focus-within {
  border-color: var(--color-accent);
  box-shadow:
    var(--shadow-card),
    0 0 0 3px color-mix(in srgb, var(--color-accent) 18%, transparent);
}

.message-input__field {
  min-height: 3rem;
  max-height: 8rem;
  resize: vertical;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text-primary);
  line-height: 1.6;
}

.message-input__field::placeholder {
  color: var(--text-tertiary);
}

.message-input__button {
  min-width: 4.5rem;
  height: 2.75rem;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--chat-button-bg, var(--color-accent));
  color: var(--chat-button-color, white);
  font-weight: 700;
  cursor: pointer;
  transition:
    transform var(--duration-fast) var(--ease-out),
    opacity var(--duration-fast) var(--ease-out);
}

.message-input__button:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--color-accent) 28%, transparent);
  outline-offset: 3px;
}

.message-input__button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.message-input__button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (prefers-reduced-motion: reduce) {
  .message-input,
  .message-input__button {
    transition: none;
  }

  .message-input__button:hover:not(:disabled) {
    transform: none;
  }
}
</style>
