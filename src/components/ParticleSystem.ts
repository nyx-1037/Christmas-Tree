import * as THREE from 'three';
import gsap from 'gsap';

export interface ParticleData {
  id: number;
  targetPosition: THREE.Vector3;
  currentPosition: THREE.Vector3;
  color: THREE.Color;
  baseScale: number;
  currentScale: number;
  layer: number;
  phaseOffset: number;
  type: 'foliage' | 'decoration' | 'trunk' | 'snow' | 'aura' | 'gift' | 'candy';
  explosionVelocity: THREE.Vector3;
}

export class ParticleSystem {
  meshes: THREE.InstancedMesh[] = [];
  particles: ParticleData[] = [];
  dummy: THREE.Object3D;
  
  // Lists
  foliageParticles: ParticleData[] = [];
  decorationParticles: ParticleData[] = [];
  trunkParticles: ParticleData[] = [];
  snowParticles: ParticleData[] = [];
  auraParticles: ParticleData[] = [];
  giftParticles: ParticleData[] = [];
  candyParticles: ParticleData[] = [];

  constructor(scene: THREE.Scene) {
    this.dummy = new THREE.Object3D();
    
    // Generate all data
    this.generateTreeData();
    this.generateTrunkData();
    this.generateSnowData();
    this.generateAuraData();

    // Create Meshes
    this.createMeshes(scene);
    
    // Initial Placement
    this.initInstances();
  }

  private generateTreeData() {
    // Replaced layered approach with continuous volume generation
    // Cone: Height ~13, Bottom Radius ~5.5, Top Radius ~0.5
    
    const treeHeight = 13.0;
    const bottomRadius = 5.5;
    const topRadius = 0.5;
    const layerCount = 10; // For stratified look
    
    // Significantly increased count for density
    const particleCount = 12000; 

    // Gradient colors
    const greenDark = new THREE.Color('#0f3b0f');
    const greenLight = new THREE.Color('#2ecc71');

    for (let i = 0; i < particleCount; i++) {
      // 1. Determine height (y) - bias towards bottom for stability visually
      // Normalized height 0 to 1
      let hNorm = Math.pow(Math.random(), 0.8); 
      
      // INTRODUCE LAYERING/STRATIFICATION
      // Map hNorm to discrete layers with some noise
      // layer index 0 to layerCount-1
      const exactLayer = hNorm * layerCount;
      const layerIndex = Math.floor(exactLayer);
      const layerResidue = exactLayer - layerIndex;
      
      // Push particles towards the center of the layer to create gaps
      // We want density at X.5 and gaps at X.0
      // Map residue 0..1 to a curve that bunches at 0.5
      // e.g. 0.5 + (residue - 0.5) * 0.5 -> tightens the band
      const tightResidue = 0.5 + (layerResidue - 0.5) * 0.7; // 70% width of layer
      hNorm = (layerIndex + tightResidue) / layerCount;
      
      const y = hNorm * treeHeight;
      
      // 2. Determine max radius at this height
      const currentMaxRadius = bottomRadius - (y / treeHeight) * (bottomRadius - topRadius);
      
      // 3. Determine actual radius (fill the volume, but bias towards surface)
      // "Sawtooth" profile for layered pine tree look
      // Each layer flares out at bottom
      
      const layerProgress = layerResidue; // 0 at bottom of layer, 1 at top of layer
      // We want radius to be wider at bottom (progress 0) and narrower at top (progress 1)
      // But also follow the global cone.
      
      // Local flare factor: 1.0 to 0.6 within a layer
      const flare = 1.0 + 0.4 * (1.0 - layerProgress);
      
      const baseR = currentMaxRadius * flare;
      
      // Random "potholes" / irregularity
      // Perlin-like noise simulation using sine waves on position
      const noise = Math.sin(y * 2.0) * Math.cos(i * 0.1) * 0.5 + 0.5; // 0..1
      const irregularity = 0.8 + 0.4 * noise; // 0.8 .. 1.2
      
      const rRatio = (0.3 + 0.7 * Math.sqrt(Math.random())) * irregularity; 
      const r = baseR * rRatio;

      // 4. Angle (Spiral)
      const angle = Math.random() * Math.PI * 2;
      
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      
      // 5. Calculate Target & Explosion
      const targetPos = new THREE.Vector3(x, y + 2.0, z); // Shift up slightly
      
      // Explosion: Outwards + Random Chaos
      const explosionVec = targetPos.clone().normalize();
      explosionVec.y += (Math.random() - 0.5) * 0.5; // Randomize Y scatter
      explosionVec.normalize();
      
      // 6. Type & Color
      // Chance for decorations
      const randType = Math.random();
      let type: 'foliage' | 'decoration' | 'gift' | 'candy';
      let scale: number;
      let color: THREE.Color;

      // Increased decoration ratio for "exquisite" look
      // 10% Orb, 5% Gift, 5% Candy = 20% Decorations
      if (randType < 0.10) {
        type = 'decoration';
        scale = 0.08 + Math.random() * 0.08; // Slightly bigger
        const rand = Math.random();
        if (rand < 0.4) color = new THREE.Color('#FFD700'); // Gold
        else if (rand < 0.7) color = new THREE.Color('#D42426'); // Rich Red
        else if (rand < 0.9) color = new THREE.Color('#C0C0C0'); // Silver
        else color = new THREE.Color('#00BFFF'); // Blue
      } else if (randType < 0.15) {
         type = 'gift';
         scale = 0.18 + Math.random() * 0.1; // Distinctly bigger
         color = new THREE.Color(Math.random() < 0.5 ? '#D42426' : '#2ecc71');
      } else if (randType < 0.20) {
         type = 'candy';
         scale = 0.12 + Math.random() * 0.1; 
         color = new THREE.Color('#ffffff'); 
      } else {
        type = 'foliage';
        scale = 0.03 + Math.random() * 0.04;
        color = greenDark.clone().lerp(greenLight, hNorm);
        color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.15); 
      }

      const particle: ParticleData = {
        id: i,
        targetPosition: targetPos,
        currentPosition: new THREE.Vector3(
           (Math.random() - 0.5) * 60,
           (Math.random() - 0.5) * 60,
           (Math.random() - 0.5) * 60
        ), // Start exploded far away
        color: color,
        baseScale: scale,
        currentScale: 0,
        layer: layerIndex,
        phaseOffset: Math.random() * 10,
        type: type,
        explosionVelocity: explosionVec
      };

      this.particles.push(particle);
      if (type === 'foliage') this.foliageParticles.push(particle);
      else if (type === 'decoration') this.decorationParticles.push(particle);
      else if (type === 'gift') this.giftParticles.push(particle);
      else if (type === 'candy') this.candyParticles.push(particle);
    }
  }

  private generateTrunkData() {
    const trunkHeight = 6.0; 
    const trunkRadius = 1.4; // Slightly thicker
    const trunkCount = 3000; // Dense

    for (let i = 0; i < trunkCount; i++) {
      const h = Math.random() * trunkHeight;
      const angle = Math.random() * Math.PI * 2;
      const r = (0.4 + 0.6 * Math.sqrt(Math.random())) * trunkRadius; 

      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = h - 2.0; 

      const targetPos = new THREE.Vector3(x, y, z);
      const explosionVec = new THREE.Vector3(x, 0, z).normalize(); 
      explosionVec.y = (Math.random() - 0.5) * 0.2; // Slight vertical chaos
      explosionVec.normalize();

      const color = new THREE.Color('#4a3c31'); 
      color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.15);

      const particle: ParticleData = {
        id: -1,
        targetPosition: targetPos,
        currentPosition: new THREE.Vector3((Math.random()-0.5)*30, -30, (Math.random()-0.5)*30),
        color: color,
        baseScale: 0.06 + Math.random() * 0.05,
        currentScale: 0,
        layer: -1,
        phaseOffset: Math.random() * 5,
        type: 'trunk',
        explosionVelocity: explosionVec
      };

      this.particles.push(particle);
      this.trunkParticles.push(particle);
    }
  }

  private generateSnowData() {
    // Global snow, continuous
    const snowCount = 3000; // More snow
    for (let i = 0; i < snowCount; i++) {
      const particle: ParticleData = {
        id: -2,
        targetPosition: new THREE.Vector3(), 
        // Start anywhere in a large box
        currentPosition: new THREE.Vector3(
          (Math.random() - 0.5) * 80,
          Math.random() * 60 - 10,
          (Math.random() - 0.5) * 80
        ),
        color: new THREE.Color(0xffffff),
        baseScale: 0.04 + Math.random() * 0.06,
        currentScale: 0.04 + Math.random() * 0.06,
        layer: -2,
        phaseOffset: Math.random() * 20,
        type: 'snow',
        explosionVelocity: new THREE.Vector3(0, -1, 0)
      };
      this.particles.push(particle);
      this.snowParticles.push(particle);
    }
  }

  private generateAuraData() {
    // Magic dust around the tree
    const auraCount = 500;
    for (let i = 0; i < auraCount; i++) {
       const theta = Math.random() * Math.PI * 2;
       const phi = Math.acos(2 * Math.random() - 1);
       const r = 10 + Math.random() * 15; // 10 to 25 radius sphere around tree center

       const x = r * Math.sin(phi) * Math.cos(theta);
       const y = r * Math.sin(phi) * Math.sin(theta) + 8; // Center around tree mid-height
       const z = r * Math.cos(phi);

       const particle: ParticleData = {
         id: -3,
         targetPosition: new THREE.Vector3(x, y, z),
         currentPosition: new THREE.Vector3(x, y, z), // Start at target
         color: new THREE.Color(0xffd700), // Gold aura
         baseScale: 0.03 + Math.random() * 0.04,
         currentScale: 0, // Animate in
         layer: -3,
         phaseOffset: Math.random() * 10,
         type: 'aura',
         explosionVelocity: new THREE.Vector3(x, y, z).normalize()
       };
       
       this.particles.push(particle);
       this.auraParticles.push(particle);
    }
  }

  private createMeshes(scene: THREE.Scene) {
    // 1. Foliage
    const foliageGeo = new THREE.SphereGeometry(1, 6, 6);
    const foliageMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const foliageMesh = new THREE.InstancedMesh(foliageGeo, foliageMat, this.foliageParticles.length);
    foliageMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(foliageMesh);
    this.meshes.push(foliageMesh);

    // 2. Decoration (Octahedron)
    const decoGeo = new THREE.OctahedronGeometry(1, 0);
    const decoMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const decoMesh = new THREE.InstancedMesh(decoGeo, decoMat, this.decorationParticles.length);
    decoMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(decoMesh);
    this.meshes.push(decoMesh);

    // 3. Trunk
    const trunkGeo = new THREE.BoxGeometry(1, 1, 1);
    const trunkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, this.trunkParticles.length);
    trunkMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(trunkMesh);
    this.meshes.push(trunkMesh);

    // 4. Snow
    const snowGeo = new THREE.TetrahedronGeometry(1, 0);
    const snowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
    const snowMesh = new THREE.InstancedMesh(snowGeo, snowMat, this.snowParticles.length);
    snowMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(snowMesh);
    this.meshes.push(snowMesh);

    // 5. Aura (Sparkles)
    const auraGeo = new THREE.PlaneGeometry(1, 1); // Billboards
    const auraMat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
    const auraMesh = new THREE.InstancedMesh(auraGeo, auraMat, this.auraParticles.length);
    auraMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(auraMesh);
    this.meshes.push(auraMesh);

    // 6. Gifts (Box)
    const giftGeo = new THREE.BoxGeometry(1, 1, 1);
    const giftMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const giftMesh = new THREE.InstancedMesh(giftGeo, giftMat, this.giftParticles.length);
    giftMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(giftMesh);
    this.meshes.push(giftMesh);

    // 7. Candy (Cylinder)
    const candyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1, 8);
    const candyMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const candyMesh = new THREE.InstancedMesh(candyGeo, candyMat, this.candyParticles.length);
    candyMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(candyMesh);
    this.meshes.push(candyMesh);
  }

  private initInstances() {
    this.updateMesh(this.foliageParticles, this.meshes[0]!);
    this.updateMesh(this.decorationParticles, this.meshes[1]!);
    this.updateMesh(this.trunkParticles, this.meshes[2]!);
    this.updateMesh(this.snowParticles, this.meshes[3]!);
    this.updateMesh(this.auraParticles, this.meshes[4]!);
    this.updateMesh(this.giftParticles, this.meshes[5]!);
    this.updateMesh(this.candyParticles, this.meshes[6]!);
  }

  public animateEntrance() {
    // 1. Tree & Decorations: Implosion from random
    const allTreeParticles = [
      ...this.foliageParticles, 
      ...this.decorationParticles, 
      ...this.trunkParticles,
      ...this.giftParticles,
      ...this.candyParticles
    ];

    allTreeParticles.forEach(p => {
      gsap.to(p.currentPosition, {
        x: p.targetPosition.x,
        y: p.targetPosition.y,
        z: p.targetPosition.z,
        duration: 2.5 + Math.random(),
        ease: 'power3.out',
        delay: Math.random() * 0.5
      });
      gsap.to(p, {
        currentScale: p.baseScale,
        duration: 1.5 + Math.random(),
        ease: 'back.out(1.7)',
        delay: Math.random() * 0.5
      });
    });

    // 2. Snow Eruption: Start at Top Center (0, 15, 0) and explode out
    this.snowParticles.forEach(p => {
      // Force start pos
      p.currentPosition.set(0, 15, 0);
      p.currentScale = 0;
      
      // Calculate a random target for the "eruption" phase
      const eruptTarget = new THREE.Vector3(
          (Math.random() - 0.5) * 60,
          Math.random() * 40,
          (Math.random() - 0.5) * 60
      );

      gsap.to(p.currentPosition, {
        x: eruptTarget.x,
        y: eruptTarget.y,
        z: eruptTarget.z,
        duration: 2.0 + Math.random() * 2.0,
        ease: 'power2.out',
        delay: Math.random() * 0.5
      });
      
      gsap.to(p, {
        currentScale: p.baseScale,
        duration: 1.0,
        ease: 'power1.out',
        delay: Math.random() * 0.5
      });
    });

    // 3. Aura
    this.auraParticles.forEach(p => {
        gsap.to(p, {
            currentScale: p.baseScale,
            duration: 3.0,
            delay: 1.0 + Math.random()
        });
    });
  }

  public update(
      time: number, 
      mousePos: THREE.Vector3 | null, 
      dispersion: number = 0, 
      twinkleSpeed: number = 1.0,
      snowDensity: number = 0.5,
      snowSpeed: number = 1.0,
      treeDensity: number = 1.0,
      decorationDensity: number = 1.0
    ) {
    
    // Helper
    const updateList = (list: ParticleData[], mesh: THREE.InstancedMesh, isDeco: boolean = false, densityMultiplier: number = 1.0) => {
      const density = isDeco ? decorationDensity : treeDensity;
      const visibleCount = Math.floor(list.length * Math.min(1.0, density * densityMultiplier));
      
      let i = 0;
      for (; i < visibleCount; i++) {
        const p = list[i];
        if (!p) continue;
        
        // Dispersion
        const explodeDist = dispersion * (25 + Math.random() * 15); 
        
        const desiredX = p.targetPosition.x + p.explosionVelocity.x * explodeDist;
        const desiredY = p.targetPosition.y + p.explosionVelocity.y * explodeDist;
        const desiredZ = p.targetPosition.z + p.explosionVelocity.z * explodeDist;
        
        // Lerp
        p.currentPosition.x += (desiredX - p.currentPosition.x) * 0.1;
        p.currentPosition.y += (desiredY - p.currentPosition.y) * 0.1;
        p.currentPosition.z += (desiredZ - p.currentPosition.z) * 0.1;

        // Scale & Breath
        let scale = p.currentScale;
        const timeOffset = time + p.phaseOffset;

        if (isDeco) {
           // More noticeable twinkle for decorations
           scale *= (1 + Math.sin((timeOffset / (1.0 / twinkleSpeed)) * Math.PI * 2) * 0.4); 
        } else {
           scale *= (1 + Math.sin((timeOffset / 4.0) * Math.PI * 2) * 0.05);
        }

        // Hover
        if (mousePos && dispersion < 0.1 && p.currentPosition.distanceTo(mousePos) < 1.5) {
             scale *= 2.0;
        }

        this.dummy.position.copy(p.currentPosition);
        this.dummy.scale.set(scale, scale, scale);
        
        if (isDeco) {
            // Gifts and Candy rotate
            if (p.type === 'gift' || p.type === 'candy') {
                 this.dummy.rotation.set(time * 0.5 + p.id, time * 0.5, p.id);
            } else {
                 this.dummy.rotation.set(time + p.id, time * 0.5, 0);
            }
        } else {
            this.dummy.rotation.set(0,0,0);
        }
        
        this.dummy.updateMatrix();
        mesh.setMatrixAt(i, this.dummy.matrix);
        mesh.setColorAt(i, p.color);
      }
      
      // Hide remaining
      for (; i < list.length; i++) {
          mesh.setMatrixAt(i, new THREE.Matrix4().makeScale(0,0,0));
      }

      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor!.needsUpdate = true;
    };

    const updateSnow = () => {
      const mesh = this.meshes[3];
      if (!mesh) return;
      
      // Snow Density: 0 to 1
      const visibleSnow = Math.floor(this.snowParticles.length * snowDensity);

      for (let i = 0; i < this.snowParticles.length; i++) {
        if (i >= visibleSnow) {
             mesh.setMatrixAt(i, new THREE.Matrix4().makeScale(0,0,0));
             continue;
        }

        const p = this.snowParticles[i];
        if (!p) continue;
        
        // Continuous Fall
        const speed = (0.05 + Math.random() * 0.05) * snowSpeed;
        p.currentPosition.y -= speed;
        
        // Sway
        p.currentPosition.x += Math.sin(time + p.phaseOffset) * 0.01 * snowSpeed;
        p.currentPosition.z += Math.cos(time * 0.8 + p.phaseOffset) * 0.01 * snowSpeed;

        // Wrap around
        if (p.currentPosition.y < -10) {
           p.currentPosition.y = 30;
           p.currentPosition.x = (Math.random() - 0.5) * 80;
           p.currentPosition.z = (Math.random() - 0.5) * 80;
        }

        this.dummy.position.copy(p.currentPosition);
        const s = p.baseScale * (0.8 + Math.random() * 0.4);
        this.dummy.scale.set(s, s, s);
        this.dummy.rotation.set(time, time, time);
        this.dummy.updateMatrix();
        mesh.setMatrixAt(i, this.dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };
    
    const updateAura = () => {
       const mesh = this.meshes[4];
       if (!mesh) return;
       
       this.auraParticles.forEach((p, i) => {
           // Orbit slowly
           const r = 15;
           const orbitSpeed = 0.1;
           const angle = time * orbitSpeed + p.phaseOffset;
           
           // Float up
           p.currentPosition.y += Math.sin(time + p.id) * 0.01;
           
           // Rotate around Y
           const x = p.currentPosition.x * Math.cos(0.002) - p.currentPosition.z * Math.sin(0.002);
           const z = p.currentPosition.x * Math.sin(0.002) + p.currentPosition.z * Math.cos(0.002);
           p.currentPosition.x = x;
           p.currentPosition.z = z;

           this.dummy.position.copy(p.currentPosition);
           this.dummy.lookAt(0, p.currentPosition.y, 0); // Billboard-ish
           
           const s = p.currentScale * (0.8 + 0.4 * Math.sin(time * 2 + p.id));
           this.dummy.scale.set(s, s, s);
           
           this.dummy.updateMatrix();
           mesh.setMatrixAt(i, this.dummy.matrix);
       });
       mesh.instanceMatrix.needsUpdate = true;
    };

    updateList(this.foliageParticles, this.meshes[0]!);
    updateList(this.decorationParticles, this.meshes[1]!, true);
    updateList(this.trunkParticles, this.meshes[2]!);
    updateList(this.giftParticles, this.meshes[5]!, true);
    updateList(this.candyParticles, this.meshes[6]!, true);
    
    updateSnow();
    updateAura();
  }

  public updateColors(theme: string) {
    let foliageBase: THREE.Color, foliageTip: THREE.Color;
    let decoColors: THREE.Color[];

    if (theme === 'icy') {
      foliageBase = new THREE.Color('#001a33');
      foliageTip = new THREE.Color('#80d4ff');
      decoColors = [new THREE.Color('#ffffff'), new THREE.Color('#00ffff'), new THREE.Color('#0044cc')];
    } else if (theme === 'golden') {
      foliageBase = new THREE.Color('#221100');
      foliageTip = new THREE.Color('#ffaa00');
      decoColors = [new THREE.Color('#ffd700'), new THREE.Color('#ffec8b'), new THREE.Color('#b8860b')];
    } else {
      // Classic
      foliageBase = new THREE.Color('#0f3b0f');
      foliageTip = new THREE.Color('#2ecc71');
      decoColors = [new THREE.Color('#FFD700'), new THREE.Color('#FF0000'), new THREE.Color('#C0C0C0'), new THREE.Color('#00BFFF')];
    }

    this.foliageParticles.forEach(p => {
        // Approximate height ratio from position
        const hRatio = Math.max(0, Math.min(1, p.targetPosition.y / 13.0));
        const base = foliageBase.clone().lerp(foliageTip, hRatio);
        base.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
        p.color = base;
    });

    this.decorationParticles.forEach(p => {
        const c = decoColors[Math.floor(Math.random() * decoColors.length)];
        if (c) p.color = c.clone();
    });
  }

  private updateMesh(list: ParticleData[], mesh: THREE.InstancedMesh) {
    if (!mesh) return;
    list.forEach((p, i) => {
        this.dummy.position.copy(p.currentPosition);
        this.dummy.scale.set(p.currentScale, p.currentScale, p.currentScale);
        this.dummy.updateMatrix();
        mesh.setMatrixAt(i, this.dummy.matrix);
        mesh.setColorAt(i, p.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor!.needsUpdate = true;
  }

  public dispose() {
    this.meshes.forEach(m => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
    });
  }
}
