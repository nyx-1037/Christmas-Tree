<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import type { Ornament } from '../assets/data/ornamentData';

defineProps<{
  ornament: Ornament | null;
  visible: boolean;
}>();

const emit = defineEmits(['close']);

const close = () => {
  emit('close');
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') close();
};

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <Transition name="zoom">
    <div v-if="visible && ornament" class="viewer-overlay" @click.self="close">
      <div class="frame-container">
        <!-- Gold Frame Border -->
        <div class="gold-frame">
           <div class="inner-frame">
              <div class="image-wrapper">
                <img :src="ornament.src" :alt="ornament.title" />
              </div>
           </div>
           <!-- Decorative Corners -->
           <div class="corner tl"></div>
           <div class="corner tr"></div>
           <div class="corner bl"></div>
           <div class="corner br"></div>
        </div>
        
        <div class="info-panel">
          <h2>{{ ornament.title }}</h2>
          <p>{{ ornament.description }}</p>
          <button class="close-btn-text" @click="close">CLOSE</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7); /* Slightly lighter to show particles behind */
  backdrop-filter: blur(5px);
  z-index: 200;
  display: flex;
  justify-content: center;
  align-items: center;
  perspective: 1000px;
}

.frame-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  transform-style: preserve-3d;
}

.gold-frame {
  position: relative;
  padding: 15px;
  background: linear-gradient(135deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c);
  box-shadow: 
    0 0 10px 2px rgba(255, 215, 0, 0.3),
    0 10px 40px rgba(0,0,0,0.8),
    inset 0 0 20px rgba(0,0,0,0.5);
  border-radius: 4px;
  /* 3D tilt effect could be added here if mouse tracking is passed */
}

.inner-frame {
  background: #000;
  padding: 5px;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.8);
}

.image-wrapper {
  max-width: 600px;
  max-height: 60vh;
  overflow: hidden;
  position: relative;
}

img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Decorative Corners (Optional extra fancy) */
.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  background: #fff;
  opacity: 0.5; /* Placeholder for corner texture or shape */
  display: none; /* Hidden for now, keep clean */
}

.info-panel {
  margin-top: 30px;
  text-align: center;
  color: #fff;
  opacity: 0;
  transform: translateY(20px);
  animation: slideUp 0.5s ease 0.3s forwards;
}

@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
}

h2 {
  font-family: 'Cinzel', serif; /* Or system serif */
  color: #ffd700;
  margin: 0 0 10px 0;
  font-size: 24px;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-shadow: 0 2px 10px rgba(0,0,0,0.8);
}

p {
  font-family: sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  max-width: 400px;
  line-height: 1.5;
  margin-bottom: 20px;
}

.close-btn-text {
  background: transparent;
  border: 1px solid rgba(255, 215, 0, 0.5);
  color: #ffd700;
  padding: 8px 24px;
  font-family: sans-serif;
  font-size: 12px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
}

.close-btn-text:hover {
  background: #ffd700;
  color: #000;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
}

/* Zoom Transition */
.zoom-enter-active {
  animation: zoomIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.zoom-leave-active {
  animation: zoomOut 0.4s ease;
}

@keyframes zoomIn {
  from { opacity: 0; transform: scale(0.3) rotateX(20deg); }
  to { opacity: 1; transform: scale(1) rotateX(0); }
}

@keyframes zoomOut {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.5); }
}
</style>
