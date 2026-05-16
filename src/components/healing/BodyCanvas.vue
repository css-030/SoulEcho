<script setup lang="ts">
import { computed, reactive } from 'vue'

import EnergyParticles from '@/components/healing/EnergyParticles.vue'
import OrganLabel from '@/components/healing/OrganLabel.vue'
import { HEALING_BODY_ASSET, HEALING_ORGANS } from '@/types/healing'
import type { OrganType } from '@/types/wuxing'

interface Props {
  currentOrgan: OrganType | null
  isActive: boolean
}

const props = defineProps<Props>()

const imageErrors = reactive<Record<string, boolean>>({})
const activeOrgan = computed(() => HEALING_ORGANS.find((organ) => organ.organ === props.currentOrgan) ?? HEALING_ORGANS[0])
const visibleOrgans = computed(() => HEALING_ORGANS.filter((organ) => organ.organ === activeOrgan.value.organ))

function hasImageError(key: string): boolean {
  return Boolean(imageErrors[key])
}

function handleImageError(key: string): void {
  imageErrors[key] = true
}

function isOrganActive(organ: OrganType): boolean {
  return props.isActive && props.currentOrgan === organ
}
</script>

<template>
  <section
    class="body-canvas"
    :class="[`is-${activeOrgan.wuxing}`]"
    :aria-label="`当前疗愈脏器：${activeOrgan.label}`"
  >
    <div class="body-canvas__stage">
      <div v-if="hasImageError('whole')" class="body-canvas__body-placeholder" aria-hidden="true">
        <span class="body-canvas__head" />
        <span class="body-canvas__torso" />
      </div>
      <img
        v-else
        class="body-canvas__base"
        :src="HEALING_BODY_ASSET"
        alt="身体与五脏轮廓"
        draggable="false"
        @error="handleImageError('whole')"
      />

      <div
        v-for="organ in visibleOrgans"
        :key="organ.organ"
        class="body-canvas__organ"
        :class="[{ 'is-active': isOrganActive(organ.organ) }, `is-${organ.wuxing}`]"
        aria-hidden="true"
      >
        <div v-if="hasImageError(organ.organ)" class="body-canvas__organ-placeholder">
          <span>{{ organ.shortLabel }}</span>
        </div>
        <img
          v-else
          :src="organ.assetPath"
          :alt="organ.label"
          draggable="false"
          @error="handleImageError(organ.organ)"
        />
        <span class="body-canvas__halo" />
      </div>

      <EnergyParticles v-if="isActive" :origin="activeOrgan.particleOrigin" />
      <OrganLabel
        :organ="activeOrgan"
        :is-active="isActive"
      />
    </div>
  </section>
</template>

<style scoped>
.body-canvas {
  --body-image-scale: 1.22;
  --organ-color: var(--color-wood);
  --organ-glow-color: var(--color-wood-glow);
  display: grid;
  width: min(100%, 64rem);
  min-height: 0;
  place-items: center;
}

.body-canvas.is-fire {
  --organ-color: var(--color-fire);
  --organ-glow-color: var(--color-fire-glow);
}

.body-canvas.is-earth {
  --organ-color: var(--color-earth);
  --organ-glow-color: var(--color-earth-glow);
}

.body-canvas.is-metal {
  --organ-color: var(--color-metal);
  --organ-glow-color: var(--color-metal-glow);
}

.body-canvas.is-water {
  --organ-color: var(--color-water);
  --organ-glow-color: var(--color-water-glow);
}

.body-canvas__stage {
  position: relative;
  width: min(66vh, 42rem, 74vw);
  aspect-ratio: 1 / 1;
  isolation: isolate;
}

.body-canvas__stage::before {
  position: absolute;
  inset: 18% 24%;
  z-index: 0;
  border-radius: 46%;
  background:
    radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--organ-glow-color) 28%, transparent) 0%, transparent 54%),
    linear-gradient(180deg, transparent, color-mix(in srgb, var(--organ-color) 12%, transparent), transparent);
  content: '';
  opacity: 0.58;
  transform: scale(0.96);
  animation: body-field-breathe 8s var(--ease-breath) infinite;
}

.body-canvas__stage::after {
  position: absolute;
  inset: 12% 18%;
  z-index: 2;
  border-radius: 48%;
  background: linear-gradient(
    110deg,
    transparent 20%,
    color-mix(in srgb, var(--text-primary) 10%, transparent) 44%,
    transparent 62%
  );
  content: '';
  opacity: 0;
  pointer-events: none;
  transform: translateX(-24%) rotate(-4deg);
  animation: body-light-sweep 9s var(--ease-out) infinite;
}

.body-canvas__base,
.body-canvas__organ img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: scale(var(--body-image-scale));
  transform-origin: center;
  user-select: none;
  object-fit: contain;
}

.body-canvas__base {
  z-index: 1;
  opacity: 0.56;
  filter: drop-shadow(0 0 2rem color-mix(in srgb, var(--color-primary) 42%, transparent));
}

.body-canvas__organ {
  position: absolute;
  inset: 0;
  z-index: 3;
  opacity: 0;
  filter: saturate(0.85);
  transition:
    opacity var(--duration-slow) var(--ease-out),
    filter var(--duration-slow) var(--ease-out);
}

.body-canvas__organ.is-active {
  z-index: 5;
  opacity: 0.86;
  filter:
    saturate(1.1)
    drop-shadow(0 0 1rem var(--organ-color))
    drop-shadow(0 0 2.8rem var(--organ-glow-color));
  animation: organ-breathe var(--duration-breathe) var(--ease-breath) infinite;
}

.body-canvas__halo {
  position: absolute;
  left: 50%;
  top: 48%;
  z-index: -1;
  width: 34%;
  aspect-ratio: 1;
  border-radius: var(--radius-pill);
  background: radial-gradient(circle, color-mix(in srgb, var(--organ-glow-color) 42%, transparent) 0%, transparent 68%);
  opacity: 0;
  transform: translate(-50%, -50%);
}

.body-canvas__organ.is-active .body-canvas__halo {
  animation: halo-pulse var(--duration-breathe) var(--ease-breath) infinite;
}

.body-canvas__body-placeholder {
  position: absolute;
  inset: 4% 22%;
  z-index: 1;
  display: grid;
  justify-items: center;
  opacity: 0.55;
}

.body-canvas__head,
.body-canvas__torso {
  display: block;
  border: 1px solid color-mix(in srgb, var(--color-primary) 58%, transparent);
  background: color-mix(in srgb, var(--color-primary) 14%, transparent);
  box-shadow: inset 0 0 2rem color-mix(in srgb, var(--color-primary) 22%, transparent);
}

.body-canvas__head {
  width: 28%;
  aspect-ratio: 1;
  border-radius: var(--radius-pill);
}

.body-canvas__torso {
  width: 66%;
  height: 76%;
  margin-top: -2%;
  border-radius: 48% 48% 44% 44%;
}

.body-canvas__organ-placeholder {
  position: absolute;
  left: 50%;
  top: 48%;
  display: grid;
  width: 8rem;
  aspect-ratio: 1.25;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--organ-color) 56%, transparent);
  border-radius: 48%;
  background: color-mix(in srgb, var(--organ-color) 26%, transparent);
  color: var(--text-primary);
  font-size: 1.15rem;
  font-weight: 900;
  transform: translate(-50%, -50%);
}

@keyframes organ-breathe {
  0%,
  100% {
    transform: scale(0.98);
  }

  50% {
    transform: scale(1.035);
  }
}

@keyframes body-field-breathe {
  0%,
  100% {
    opacity: 0.42;
    transform: scale(0.94);
  }

  50% {
    opacity: 0.72;
    transform: scale(1.04);
  }
}

@keyframes body-light-sweep {
  0%,
  62%,
  100% {
    opacity: 0;
    transform: translateX(-24%) rotate(-4deg);
  }

  74% {
    opacity: 0.4;
  }

  88% {
    opacity: 0;
    transform: translateX(24%) rotate(-4deg);
  }
}

@keyframes halo-pulse {
  0%,
  100% {
    opacity: 0.2;
    transform: translate(-50%, -50%) scale(0.88);
  }

  50% {
    opacity: 0.68;
    transform: translate(-50%, -50%) scale(1.16);
  }
}

@media (max-width: 760px) {
  .body-canvas__stage {
    width: min(92vw, 36rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .body-canvas__organ,
  .body-canvas__organ.is-active,
  .body-canvas__organ.is-active .body-canvas__halo,
  .body-canvas__stage::before,
  .body-canvas__stage::after {
    animation: none;
  }
}
</style>
