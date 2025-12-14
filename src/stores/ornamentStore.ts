import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ornamentImages, type Ornament } from '../assets/data/ornamentData';

export const useOrnamentStore = defineStore('ornament', () => {
  // Initialize with default data
  // We use a map to store overrides by ID
  const customImages = ref<Map<string, string>>(new Map());
  
  const ornaments = ref<Ornament[]>(ornamentImages);

  const updateOrnamentImage = (id: string, base64: string) => {
    customImages.value.set(id, base64);
    // Update the list immediately for reactivity if needed elsewhere
    // But ParticleSystem might need explicit trigger
  };

  const getOrnamentSrc = (id: string, defaultSrc: string) => {
    return customImages.value.get(id) || defaultSrc;
  };

  return {
    ornaments,
    customImages,
    updateOrnamentImage,
    getOrnamentSrc
  };
});
