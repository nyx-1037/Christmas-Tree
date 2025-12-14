<script setup lang="ts">
import { ref, watch } from 'vue';
import { AppConfig } from '../assets/data/config';
import { useOrnamentStore } from '../stores/ornamentStore';

const props = defineProps<{
  dispersion: number;
  autoRotate: boolean;
}>();

const emit = defineEmits([
  'update:dispersion', 
  'update:autoRotate', 
  'toggle-music',
  'update:bloom',
  'update:twinkle',
  'update:theme',
  'trigger-upload',
  'update:snowDensity',
  'update:snowSpeed',
  'update:treeDensity',
  'update:decorationDensity',
  'update:bgImage',
  'update:bgVideo'
]);

const store = useOrnamentStore();
const fileInput = ref<HTMLInputElement | null>(null);
const selectedOrnamentId = ref('ornament_1'); // Default select first

const localDispersion = ref(props.dispersion);
const localAutoRotate = ref(props.autoRotate);
const isMusicPlaying = ref(false);
const isPanelOpen = ref(true);

// New local states
const bloomStrength = ref(AppConfig.visuals.bloomStrength);
const twinkleSpeed = ref(AppConfig.visuals.twinkleSpeed);
const selectedTheme = ref(AppConfig.tree.colorTheme);
const snowDensity = ref(0.3); // 0 to 1
const snowSpeed = ref(1.0);
const treeDensity = ref(0.8); // 0.5 to 1.5
const decorationDensity = ref(0.8); // 0.5 to 1.5

const handleFileUpload = (event: Event) => {
  const files = (event.target as HTMLInputElement).files;
  if (files && files.length > 0) {
    Array.from(files).forEach((file, index) => {
       const reader = new FileReader();
       reader.onload = (e) => {
         const base64 = e.target?.result as string;
         if (base64) {
           // Assign to sequential IDs starting from current selected, or just fill available slots
           // Logic: If user selected "ornament_1", and uploads 3 files, fill 1, 2, 3.
           const parts = selectedOrnamentId.value.split('_');
           const currentIdNum = parts.length > 1 ? parseInt(parts[1]!) : 1;
           const targetId = `ornament_${currentIdNum + index}`;
           
           // Check if this ID exists in store (we have 15 now)
           if (store.ornaments.find(o => o.id === targetId)) {
               store.updateOrnamentImage(targetId, base64);
               emit('trigger-upload', targetId);
           }
         }
       };
       reader.readAsDataURL(file);
    });
  }
};

watch(() => props.dispersion, (val) => {
  localDispersion.value = val;
});

watch(localDispersion, (val) => {
  emit('update:dispersion', val);
});

watch(localAutoRotate, (val) => {
  emit('update:autoRotate', val);
});

watch(bloomStrength, (val) => {
  emit('update:bloom', val);
});

watch(twinkleSpeed, (val) => {
  emit('update:twinkle', val);
});

watch(selectedTheme, (val) => {
  emit('update:theme', val);
});

watch(snowDensity, (val) => {
  emit('update:snowDensity', val);
});

watch(snowSpeed, (val) => {
  emit('update:snowSpeed', val);
});

watch(treeDensity, (val) => {
  emit('update:treeDensity', val);
});

watch(decorationDensity, (val) => {
  emit('update:decorationDensity', val);
});

const toggleMusic = () => {
  isMusicPlaying.value = !isMusicPlaying.value;
  emit('toggle-music', isMusicPlaying.value);
};

const handleBgImageUpload = (event: Event) => {
  const files = (event.target as HTMLInputElement).files;
  if (files && files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        emit('update:bgImage', base64);
        emit('update:bgVideo', '');
      }
    };
    reader.readAsDataURL(files[0]);
  }
};

const handleBgVideoUpload = (event: Event) => {
  const files = (event.target as HTMLInputElement).files;
  if (files && files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        emit('update:bgVideo', base64);
        emit('update:bgImage', '');
      }
    };
    reader.readAsDataURL(files[0]);
  }
};

const togglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value;
};
</script>

<template>
  <div class="control-panel-wrapper">
    <div class="panel-toggle" @click="togglePanel" title="Toggle Panel">
      <span v-if="!isPanelOpen">⚙️</span>
      <span v-else>✖</span>
    </div>

    <div class="control-panel" :class="{ 'collapsed': !isPanelOpen }">
      <div class="panel-content">
      <div class="panel-header">
         <h3>Control Center / 控制中心</h3>
      </div>
      
      <!-- Dispersion -->
      <div class="control-group">
        <label>Form / Explode (展开/合并)</label>
        <input 
          type="range" 
          v-model.number="localDispersion" 
          min="0" 
          max="1.5" 
          step="0.01"
        >
        <div class="labels">
          <span>Tree (树)</span>
          <span>Galaxy (星系)</span>
        </div>
      </div>

      <!-- Auto Rotate -->
      <div class="control-group">
        <label>Auto Rotation (自动旋转)</label>
        <div class="switch-container">
           <label class="switch">
             <input type="checkbox" v-model="localAutoRotate">
             <span class="slider round"></span>
           </label>
        </div>
      </div>

      <!-- Visual Enhancements -->
      <div class="control-group">
        <label>Glow Intensity (光晕强度)</label>
        <input 
          type="range" 
          v-model.number="bloomStrength" 
          min="0" 
          max="3.0" 
          step="0.1"
        >
      </div>

      <div class="control-group">
        <label>Twinkle Speed (闪烁速度)</label>
        <input 
          type="range" 
          v-model.number="twinkleSpeed" 
          min="0" 
          max="5.0" 
          step="0.1"
        >
      </div>

      <!-- Particle Controls -->
      <div class="control-group">
        <label>Snow Density (降雪密度)</label>
        <input 
          type="range" 
          v-model.number="snowDensity" 
          min="0" 
          max="1.0" 
          step="0.05"
        >
      </div>

      <div class="control-group">
        <label>Snow Speed (降雪速度)</label>
        <input 
          type="range" 
          v-model.number="snowSpeed" 
          min="0" 
          max="3.0" 
          step="0.1"
        >
      </div>

      <div class="control-group">
        <label>Tree Density (树密度)</label>
        <input 
          type="range" 
          v-model.number="treeDensity" 
          min="0.5" 
          max="2.0" 
          step="0.1"
        >
      </div>

      <div class="control-group">
        <label>Decoration Density (装饰密度)</label>
        <input 
          type="range" 
          v-model.number="decorationDensity" 
          min="0" 
          max="2.0" 
          step="0.1"
        >
      </div>

      <!-- Color Theme -->
      <div class="control-group">
        <label>Color Theme (主题颜色)</label>
        <select v-model="selectedTheme" class="theme-select">
          <option value="classic">Classic Christmas (经典)</option>
          <option value="icy">Icy Blue (冰雪)</option>
          <option value="golden">Royal Gold (黑金)</option>
        </select>
      </div>

      <!-- Customization -->
      <div class="control-group">
        <label>Customize Ornament (自定义装饰)</label>
        <select v-model="selectedOrnamentId" class="theme-select mb-2">
          <option v-for="ornament in store.ornaments" :key="ornament.id" :value="ornament.id">
            {{ ornament.title }}
          </option>
        </select>
        <div class="upload-btn-wrapper">
          <button class="btn-upload">Upload Image (批量上传)</button>
          <input type="file" ref="fileInput" @change="handleFileUpload" accept="image/*" multiple />
        </div>
      </div>

      <!-- Music -->
      <div class="control-group">
        <label>Background Music (背景音乐)</label>
        <button class="music-btn" @click="toggleMusic" :class="{ 'playing': isMusicPlaying }">
          <span v-if="isMusicPlaying">❚❚ Pause (暂停)</span>
          <span v-else>▶ Play (播放)</span>
        </button>
      </div>

      <!-- Background Image / Video -->
      <div class="control-group">
        <label>Background (背景图片 / 视频)</label>
        <div class="upload-btn-wrapper">
          <button class="btn-upload">Upload Image 背景图</button>
          <input type="file" accept="image/*" @change="handleBgImageUpload" />
        </div>
        <div class="upload-btn-wrapper" style="margin-top: 8px;">
          <button class="btn-upload">Upload Video 背景视频</button>
          <input type="file" accept="video/*" @change="handleBgVideoUpload" />
        </div>
      </div>

      <div class="info-group">
          <p>Scroll to explode/collapse (滚动展开)</p>
          <p>Click ornaments to view (点击装饰)</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ... existing styles ... */
.control-panel {
  position: absolute;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  width: 300px; /* Widened slightly */
  background: rgba(16, 16, 32, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 16px;
  padding: 24px;
  color: #fff;
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  z-index: 100;
  max-height: 80vh;
  overflow-y: auto;
}

@media (max-width: 768px) {
  /* Removed old duplicate media query content since I overwrote it above */
}

/* ... keep other styles ... */

/* ... keep other styles ... */
.theme-select {
  width: 100%;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  color: #ffd700;
  border-radius: 4px;
  outline: none;
  cursor: pointer;
}
.theme-select option {
  background: #101020;
  color: #fff;
}

.mb-2 {
  margin-bottom: 10px;
}

.upload-btn-wrapper {
  position: relative;
  overflow: hidden;
  display: inline-block;
  width: 100%;
}

.btn-upload {
  border: 1px solid rgba(255, 215, 0, 0.5);
  color: #ffd700;
  background-color: transparent;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 12px;
  text-transform: uppercase;
  width: 100%;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-upload:hover {
  background: rgba(255, 215, 0, 0.1);
}

.upload-btn-wrapper input[type=file] {
  font-size: 100px;
  position: absolute;
  left: 0;
  top: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.control-panel.collapsed {
    transform: translate(calc(100% + 20px), -50%);
  }

.panel-toggle {
  position: fixed; /* Fixed position */
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: rgba(16, 16, 32, 0.9);
  border: 1px solid rgba(255, 215, 0, 0.4);
  border-radius: 50%; /* Circle */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  color: #ffd700;
  backdrop-filter: blur(12px);
  box-shadow: 0 0 15px rgba(0,0,0,0.5);
  z-index: 200; /* Higher than panel */
  transition: all 0.3s;
}

.panel-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
}

@media (max-width: 768px) {
  .control-panel {
    width: 260px;
    padding: 16px;
    right: 0; /* Flush with right edge */
    top: auto;
    bottom: 0;
    transform: translateY(0);
    max-height: 70vh;
    border-radius: 16px 16px 0 0; /* Bottom sheet style */
    border-right: none;
    border-bottom: none;
  }

  .control-panel.collapsed {
    transform: translateY(100%); /* Slide down */
  }

  .panel-toggle {
    /* Reset mobile styles */
    left: auto;
    right: 20px;
    top: 20px;
    transform: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border-bottom: 1px solid rgba(255, 215, 0, 0.4);
    border-right: 1px solid rgba(255, 215, 0, 0.4);
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 12px;
}

.close-btn {
  background: transparent;
  border: none;
  color: #ffd700;
  font-size: 18px;
  cursor: pointer;
  padding: 5px;
}

h3 {
  margin: 0;
  font-family: 'Montserrat', sans-serif;
  font-size: 18px;
  color: #ffd700;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.control-group {
  margin-bottom: 24px;
}

label {
  display: block;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 10px;
}

input[type="range"] {
  width: 100%;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.1);
  height: 4px;
  border-radius: 2px;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #ffd700;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  transition: transform 0.2s;
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
}

/* Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.1);
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #ffd700;
}

input:checked + .slider:before {
  transform: translateX(24px);
  background-color: #000;
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

/* Music Btn */
.music-btn {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid rgba(255, 215, 0, 0.5);
  color: #ffd700;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 1px;
}

.music-btn:hover {
  background: rgba(255, 215, 0, 0.1);
}

.music-btn.playing {
  background: #ffd700;
  color: #000;
}

.info-group {
  margin-top: 30px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.info-group p {
  margin: 5px 0;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}
</style>
