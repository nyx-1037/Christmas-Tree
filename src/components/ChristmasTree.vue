<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ParticleSystem } from './ParticleSystem';
import { OrnamentSystem } from './OrnamentSystem';
import { StardustSystem } from './StardustSystem';
import gsap from 'gsap';
import OrnamentViewer from './OrnamentViewer.vue';
import ControlPanel from './ControlPanel.vue';
import type { Ornament } from '../assets/data/ornamentData';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { AudioSystem } from './AudioSystem';
import { AppConfig } from '../assets/data/config';

import { useOrnamentStore } from '../stores/ornamentStore';
import Stats from 'stats.js';

const canvasRef = ref<HTMLCanvasElement | null>(null);
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let composer: EffectComposer;
let bloomPass: UnrealBloomPass;
let controls: OrbitControls;
let animationId: number;

// Particle System & Interaction
let particleSystem: ParticleSystem;
let ornamentSystem: OrnamentSystem;
let stardustSystem: StardustSystem;
let audioSystem: AudioSystem;
let clock: THREE.Clock;
let raycaster: THREE.Raycaster;
let pointer: THREE.Vector2;
let hitMesh: THREE.Mesh;
let bgParticles: THREE.Points;
let mouse3D: THREE.Vector3 | null = null;
let hoveredObject: THREE.Object3D | null = null;
let stats: Stats;

const store = useOrnamentStore();

// UI State
const viewerVisible = ref(false);
const selectedOrnament = ref<Ornament | null>(null);
const loading = ref(true);
const autoRotate = ref(true);

// Config State
const bloomStrength = ref(AppConfig.visuals.bloomStrength);
const twinkleSpeed = ref(AppConfig.visuals.twinkleSpeed);

// Scroll State for Dispersion
const dispersionState = {
  current: 0,
  target: 0
};

const snowDensity = ref(0.5);
const snowSpeed = ref(1.0);
const treeDensity = ref(1.0);
const decorationDensity = ref(1.0);

const handleControlUpdate = (dispersion: number) => {
  dispersionState.target = dispersion;
};

const handleSnowDensityUpdate = (val: number) => {
  snowDensity.value = val;
};

const handleSnowSpeedUpdate = (val: number) => {
  snowSpeed.value = val;
};

const handleTreeDensityUpdate = (val: number) => {
  treeDensity.value = val;
};

const handleDecorationDensityUpdate = (val: number) => {
  decorationDensity.value = val;
};

const handleAutoRotateUpdate = (val: boolean) => {
  autoRotate.value = val;
  if (controls) controls.autoRotate = val;
};

const handleBloomUpdate = (val: number) => {
  bloomStrength.value = val;
  if (bloomPass) bloomPass.strength = val;
};

const handleTwinkleUpdate = (val: number) => {
  twinkleSpeed.value = val;
};

const handleThemeUpdate = (val: string) => {
  if (particleSystem) particleSystem.updateColors(val);
};

const handleToggleMusic = (playing: boolean) => {
  if (playing) audioSystem.play();
  else audioSystem.pause();
};

const handleUploadTrigger = (ornamentId: string) => {
  if (ornamentSystem) {
    const src = store.getOrnamentSrc(ornamentId, '');
    if (src) {
      ornamentSystem.updateTexture(ornamentId, src);
    }
  }
};

const init = () => {
  if (!canvasRef.value) return;

  // 1. Scene Setup
  scene = new THREE.Scene();
  scene.background = null; 

  // 2. Camera Setup
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  // Adjusted camera position to fit the whole tree
  camera.position.set(0, 8, 25);
  camera.lookAt(0, 8, 0);

  // 3. Renderer Setup
  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
    alpha: true 
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // 4. Post Processing (Bloom)
  const renderPass = new RenderPass(scene, camera);
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    bloomStrength.value, // Strength
    0.8, // Radius
    0.2 // Threshold
  );
  composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);

  // 5. Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 5;
  controls.maxDistance = 40; 
  controls.enableZoom = false; 
  controls.autoRotate = autoRotate.value;
  controls.autoRotateSpeed = 1.0; 
  controls.target.set(0, 8, 0); // Focus on middle of tree

  // 6. Lights
  const mainLight = new THREE.DirectionalLight(0xa0c8ff, 0.8);
  mainLight.position.set(-5, 10, 5);
  mainLight.castShadow = true;
  scene.add(mainLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  // 7. Systems
  clock = new THREE.Clock();
  
  // Stats
  stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb
  stats.dom.style.position = 'absolute';
  stats.dom.style.top = '10px';
  stats.dom.style.left = '10px';
  stats.dom.style.zIndex = '1000';
  document.body.appendChild(stats.dom);

  particleSystem = new ParticleSystem(scene);
  particleSystem.animateEntrance();
  
  ornamentSystem = new OrnamentSystem(scene);
  stardustSystem = new StardustSystem(scene);
  audioSystem = new AudioSystem();

  // 8. Background Particles
  const bgGeometry = new THREE.BufferGeometry();
  const bgCount = 100;
  const bgPositions = new Float32Array(bgCount * 3);
  for (let i = 0; i < bgCount; i++) {
    bgPositions[i * 3] = (Math.random() - 0.5) * 40;
    bgPositions[i * 3 + 1] = Math.random() * 20 - 5;
    bgPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
  }
  bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
  const bgMaterial = new THREE.PointsMaterial({
    color: 0xffd700,
    size: 0.15,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true
  });
  bgParticles = new THREE.Points(bgGeometry, bgMaterial);
  scene.add(bgParticles);

  // 9. Interaction Hit Volume (Invisible)
  const hitGeometry = new THREE.CylinderGeometry(0.5, 4.0, 11, 16);
  const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });
  hitMesh = new THREE.Mesh(hitGeometry, hitMaterial);
  hitMesh.position.y = 5.5; 
  scene.add(hitMesh);

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2(99, 99); // Off screen initially

  // Event Listeners
  window.addEventListener('resize', onResize);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('click', onClick);
  window.addEventListener('wheel', onWheel);
  
  // Simulate loading done
  loading.value = false;
};

const onResize = () => {
  if (!camera || !renderer || !composer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
};

const onPointerMove = (event: PointerEvent) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Mouse trail
  if (stardustSystem && mouse3D) {
    stardustSystem.spawnTrail(mouse3D);
  } else if (stardustSystem) {
    // Unproject mouse to 3D space if not hitting anything specific
    // Just for visual flair in empty space (approximate depth)
    const vec = new THREE.Vector3(pointer.x, pointer.y, 0.5);
    vec.unproject(camera);
    const dir = vec.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z; // Plane at z=0
    // Actually plane at tree center
    const pos = camera.position.clone().add(dir.multiplyScalar(20)); // Approx distance
    stardustSystem.spawnTrail(pos);
  }
};

const onWheel = (event: WheelEvent) => {
  // Normalize wheel delta
  const delta = event.deltaY * 0.001;
  
  // Accumulate target dispersion
  // Down scroll (positive delta) -> Expand/Explode
  // Up scroll (negative delta) -> Contract/Form Tree
  dispersionState.target += delta;
  
  // Clamp dispersion between 0 (Tree) and 1.5 (Fully Exploded)
  dispersionState.target = Math.max(0, Math.min(1.5, dispersionState.target));
};

const onClick = () => {
  if (viewerVisible.value) return; 

  if (hoveredObject) {
    // If we have a valid hoveredObject from animate loop, check its flag
    // Note: hoveredObject is now correctly resolved to the root mesh or hitMesh
    if (hoveredObject.userData.isOrnament) {
      stardustSystem.spawn(hoveredObject.position);
      handleOrnamentClick(hoveredObject);
    } else if (hoveredObject === hitMesh && mouse3D) {
      stardustSystem.spawn(mouse3D);
    }
  }
};

const handleOrnamentClick = (mesh: THREE.Object3D) => {
  // If the clicked object is the hitBox, use its parent (the card mesh)
  const target = mesh.userData.parent || mesh;
  
  // 1. Pull out animation (Move towards camera slightly and scale up)
  // Calculate a position slightly in front of current position relative to tree center
  // But actually we just want to zoom it "out" from tree
  
  const originalPos = target.userData.originalPosition;
  const originalRot = target.userData.originalRotation;
  const originalScale = target.userData.originalScale;

  // Kill any running tweens
  gsap.killTweensOf(target.position);
  gsap.killTweensOf(target.rotation);
  gsap.killTweensOf(target.scale);

  // Animate: Pull out, face camera, scale up
  // We need to calculate vector from center to pos to know "out" direction
  const outDir = originalPos.clone().normalize().multiplyScalar(2.0); // Pull out 2 units
  const targetPos = originalPos.clone().add(outDir);

  gsap.to(target.position, {
    x: targetPos.x,
    y: targetPos.y,
    z: targetPos.z,
    duration: 0.5,
    ease: 'back.out(1.2)'
  });

  gsap.to(target.scale, {
    x: originalScale.x * 1.5,
    y: originalScale.y * 1.5,
    z: originalScale.z * 1.5,
    duration: 0.5,
    ease: 'power2.out',
    onComplete: () => {
      // 2. Show Viewer
      selectedOrnament.value = target.userData as Ornament;
      viewerVisible.value = true;
      
      // Reset after a delay or when viewer closes?
      // Better to reset when viewer closes.
      // Store current target to reset later
      target.userData.isExpanded = true;
    }
  });
};

const closeViewer = () => {
  viewerVisible.value = false;
  selectedOrnament.value = null;
  
  // Reset extracted ornaments
  ornamentSystem.getObjects().forEach(mesh => {
    if (mesh.userData.isExpanded) {
        gsap.to(mesh.position, {
            x: mesh.userData.originalPosition.x,
            y: mesh.userData.originalPosition.y,
            z: mesh.userData.originalPosition.z,
            duration: 0.6,
            ease: 'power2.inOut'
        });
        gsap.to(mesh.scale, {
            x: mesh.userData.originalScale.x,
            y: mesh.userData.originalScale.y,
            z: mesh.userData.originalScale.z,
            duration: 0.6,
            ease: 'power2.inOut'
        });
        mesh.userData.isExpanded = false;
    }
  });
};

const animate = () => {
  stats.begin();
  animationId = requestAnimationFrame(animate);
  const time = clock.getElapsedTime();

  controls.update();

  // Smoothly interpolate dispersion
  dispersionState.current += (dispersionState.target - dispersionState.current) * 0.05;
  
  // Adjust controls based on dispersion
  // When exploded, we might want to disable auto-rotate or zoom
  if (dispersionState.current > 0.1) {
     controls.autoRotate = false;
  } else if (!hoveredObject && !selectedOrnament.value) {
     controls.autoRotate = autoRotate.value;
  }

  // Raycasting
  raycaster.setFromCamera(pointer, camera);
  
  // Intersect Ornaments + HitMesh
  // We need to traverse recursively to hit the children (hitBoxes) of ornaments
  const interactiveObjects = [...ornamentSystem.getObjects(), hitMesh];
  const intersects = raycaster.intersectObjects(interactiveObjects, true); 
  
  if (intersects.length > 0) {
    const hit = intersects[0];
    if (hit) {
      hoveredObject = hit.object;
      
      // Check if it's an ornament or part of it
      let target = hoveredObject;
      let isOrnament = false;
      
      // Traverse up to find if we hit anything related to ornament
      // The hitBox has isOrnament=true in userData
      // The parent mesh also has isOrnament=true
      while (target) {
        if (target.userData.isOrnament) {
            isOrnament = true;
            break;
        }
        if (target.parent) {
            target = target.parent;
        } else {
            break;
        }
      }
      
      if (isOrnament && target) {
         document.body.style.cursor = 'pointer';
         // Store the root ornament mesh as hoveredObject for click handler
         // If we hit hitBox, its parent is the root mesh.
         // If we hit mesh itself, it is the root.
         // target is the one with isOrnament flag.
         hoveredObject = target.userData.parent || target; 
         
         controls.autoRotate = false; 
      } else if (hit.object === hitMesh) {
         mouse3D = hit.point;
         document.body.style.cursor = ''; 
         controls.autoRotate = autoRotate.value;
         hoveredObject = hitMesh; // Explicitly set
      }
    }
  } else {
    hoveredObject = null;
    mouse3D = null;
    document.body.style.cursor = '';
    controls.autoRotate = true;
  }

  particleSystem.update(
    time, 
    mouse3D, 
    dispersionState.current, 
    twinkleSpeed.value, 
    snowDensity.value, 
    snowSpeed.value, 
    treeDensity.value,
    decorationDensity.value
  );
  ornamentSystem.update(time, dispersionState.current);
  stardustSystem.update();
  
  if (bgParticles) {
    bgParticles.rotation.y = time * 0.05;
  }

  // renderer.render(scene, camera);
  composer.render();
  stats.end();
};

onMounted(() => {
  init();
  animate();
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('click', onClick);
  cancelAnimationFrame(animationId);
  if (renderer) {
    renderer.dispose();
  }
  if (particleSystem) particleSystem.dispose();
  if (ornamentSystem) ornamentSystem.dispose();
  if (stardustSystem) stardustSystem.dispose();
  if (stats) document.body.removeChild(stats.dom);
});

</script>

<template>
  <div class="canvas-container">
    <canvas ref="canvasRef"></canvas>
    
    <!-- UI Overlay Placeholders -->
    <div class="ui-layer">
      <!-- <h1 class="title">Interactive 3D Christmas Tree</h1> -->
      <div class="title-overlay">
        <h1 class="main-title">Merry Christmas</h1>
      </div>
      <div v-if="loading" class="loading-indicator">Loading...</div>
      <div class="footer-hint">Drag to rotate • Scroll to explode • Click ornaments</div>
      
      <!-- Copyright Footer -->
      <div class="copyright"> 
          <p>&copy; 2025 Mr.Nie. <span data-i18n-key="footer.rights">保留所有权利</span></p> 
          <p><a href="http://beian.miit.gov.cn/" target="_blank" rel="noopener">赣ICP备2025065901号</a></p> 
          <p>
              <img src="https://nie1037-oss.oss-cn-hangzhou.aliyuncs.com/%E5%A4%87%E6%A1%88%E5%9B%BE%E6%A0%87.png" width="20" style="vertical-align: middle; margin-right: 5px;" /> 
              <a href="https://beian.mps.gov.cn/#/query/webSearch?code=36042402000108" rel="noreferrer" target="_blank">赣公网安备36042402000108号</a> 
          </p> 
      </div>
    </div>

    <ControlPanel 
      :dispersion="dispersionState.target"
      :autoRotate="autoRotate"
      @update:dispersion="handleControlUpdate"
      @update:autoRotate="handleAutoRotateUpdate"
      @toggle-music="handleToggleMusic"
      @update:bloom="handleBloomUpdate"
      @update:twinkle="handleTwinkleUpdate"
      @update:theme="handleThemeUpdate"
      @trigger-upload="handleUploadTrigger"
      @update:snowDensity="handleSnowDensityUpdate"
      @update:snowSpeed="handleSnowSpeedUpdate"
      @update:treeDensity="handleTreeDensityUpdate"
      @update:decorationDensity="handleDecorationDensityUpdate"
    />

    <OrnamentViewer 
      :visible="viewerVisible" 
      :ornament="selectedOrnament" 
      @close="closeViewer" 
    />
  </div>
</template>

<style scoped>
.canvas-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  /* PRD 4.2: Background gradient */
  background: radial-gradient(circle at center, #0f0f1f 0%, #000000 100%);
}

.title-overlay {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  pointer-events: none;
  z-index: 5;
  width: 100%;
}

.main-title {
  font-family: 'Cinzel', serif;
  font-size: 4rem;
  font-weight: 700;
  text-transform: uppercase;
  background: linear-gradient(to bottom, #fffebb 0%, #ffd700 50%, #b8860b 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  margin: 0;
  letter-spacing: 5px;
  animation: glow 3s ease-in-out infinite alternate;
}

@keyframes glow {
  from { text-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }
  to { text-shadow: 0 0 40px rgba(255, 215, 0, 0.8), 0 0 10px rgba(255, 255, 255, 0.8); }
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  outline: none;
}

.ui-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Let clicks pass through to canvas */
  z-index: 10;
}

.title {
  position: absolute;
  top: 20px;
  left: 20px;
  font-family: 'Montserrat', sans-serif;
  font-weight: bold;
  font-size: 32px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.footer-hint {
  position: absolute;
  bottom: 80px; /* Moved up to make room for copyright */
  width: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-family: sans-serif;
}

.copyright {
  position: absolute;
  bottom: 10px;
  width: 100%;
  text-align: center;
  color: #fff; /* White for better visibility on transparent */
  font-size: 12px;
  font-family: sans-serif;
  line-height: 1.5;
  pointer-events: auto; /* Allow clicking links */
  background: transparent; /* Fully transparent */
  padding: 10px 0;
  font-weight: bold; /* Bold text */
  text-shadow: 0 1px 3px rgba(0,0,0,0.8); /* Shadow for readability */
}

.copyright a {
  text-decoration: none;
  transition: color 0.3s;
  color: #ddd !important; /* Lighter link color */
  font-weight: bold;
}

.copyright a:hover {
  color: #ffd700 !important;
}
</style>
