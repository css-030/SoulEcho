<script setup lang="ts">
interface Props {
  origin: {
    x: number
    y: number
  }
}

defineProps<Props>()

const particles = Array.from({ length: 8 }, (_, index) => ({
  id: index,
  tx: `${(index % 2 === 0 ? -1 : 1) * (18 + index * 5)}px`,
  ty: `${-64 - index * 12}px`,
  delay: `${index * 360}ms`,
  size: `${0.38 + (index % 3) * 0.1}rem`
}))
</script>

<template>
  <div class="energy-particles" :style="{ '--origin-x': `${origin.x}%`, '--origin-y': `${origin.y}%` }" aria-hidden="true">
    <span
      v-for="particle in particles"
      :key="particle.id"
      class="energy-particles__dot"
      :style="{
        '--tx': particle.tx,
        '--ty': particle.ty,
        '--particle-delay': particle.delay,
        '--particle-size': particle.size
      }"
    />
  </div>
</template>

<style scoped>
.energy-particles {
  position: absolute;
  inset: 0;
  z-index: 6;
  pointer-events: none;
}

.energy-particles__dot {
  position: absolute;
  left: var(--origin-x);
  top: var(--origin-y);
  width: var(--particle-size);
  height: var(--particle-size);
  border-radius: var(--radius-pill);
  background: var(--organ-glow-color);
  box-shadow:
    0 0 0.65rem var(--organ-color),
    0 0 1.35rem var(--organ-glow-color);
  opacity: 0;
  transform: translate(-50%, -50%) scale(0);
  animation: particle-float 3.8s var(--ease-out) infinite;
  animation-delay: var(--particle-delay);
}

@keyframes particle-float {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0);
  }

  18% {
    opacity: 0.9;
    transform: translate(-50%, calc(-50% - 10px)) scale(1);
  }

  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.28);
  }
}

@media (prefers-reduced-motion: reduce) {
  .energy-particles__dot {
    animation: none;
    opacity: 0.45;
  }
}
</style>
