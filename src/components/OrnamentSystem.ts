import * as THREE from 'three';
import { ornamentImages, type Ornament } from '../assets/data/ornamentData';

export class OrnamentSystem {
  group: THREE.Group;
  ornaments: THREE.Mesh[] = [];
  lights: THREE.PointLight[] = [];
  
  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.createOrnaments();
  }

  private createOrnaments() {
    const textureLoader = new THREE.TextureLoader();
    
    // Changed geometry to Plane (Card shape)
    // Scale down to be small "thumbnails" stuck in tree
    const cardGeometry = new THREE.PlaneGeometry(1, 1.2); 

    ornamentImages.forEach((data) => {
      // Material: Double sided standard material
      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        roughness: 0.4,
        metalness: 0.1,
      });

      // Load texture
      textureLoader.load(data.src, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        material.map = texture;
        material.needsUpdate = true;
      });

      const mesh = new THREE.Mesh(cardGeometry, material);
      
      // --- POSITION RECALCULATION START ---
      // Original position from data
      let pos = new THREE.Vector3(data.position.x, data.position.y, data.position.z);
      
      // Calculate Tree Radius at this height (y)
      // Height 0 -> Radius 5.5, Height 13 -> Radius 0.5
      const treeBottomRadius = 5.5;
      const treeTopRadius = 0.5;
      const treeMaxHeight = 13.0;
      
      const currentRadius = treeBottomRadius - (pos.y / treeMaxHeight) * (treeBottomRadius - treeTopRadius);
      // Ensure it's not negative
      const targetRadius = Math.max(0.5, currentRadius) + 0.5; // +0.5 to sit on surface
      
      // Normalize x/z vector and scale to targetRadius
      const xzVec = new THREE.Vector3(pos.x, 0, pos.z).normalize();
      
      // If xz is zero (unlikely), default to z+
      if (xzVec.length() === 0) xzVec.set(0,0,1);
      
      pos.x = xzVec.x * targetRadius;
      pos.z = xzVec.z * targetRadius;
      
      mesh.position.copy(pos);
      // --- POSITION RECALCULATION END ---
      
      // Look at center (0,y,0) but reversed so front faces out
      mesh.lookAt(0, data.position.y, 0);
      mesh.rotateY(Math.PI); // Flip to face out
      
      // Random tilt for "stuck in branches" look
      mesh.rotateZ((Math.random() - 0.5) * 0.5);
      mesh.rotateX((Math.random() - 0.5) * 0.3);

      mesh.scale.set(0.8, 0.8, 0.8); // Initial small scale
      
      // Explosion Vector (Outwards from center)
      const explosionVelocity = new THREE.Vector3(pos.x, 0, pos.z).normalize();
      explosionVelocity.y = 0.2; // Slight upward bias
      explosionVelocity.normalize();

      // Store data
      mesh.userData = { 
        ...data, 
        isOrnament: true, 
        originalPosition: mesh.position.clone(),
        originalRotation: mesh.rotation.clone(),
        originalScale: mesh.scale.clone(),
        explosionVelocity: explosionVelocity
      };
      
      // Add a border/frame mesh
      const frameGeo = new THREE.PlaneGeometry(1.1, 1.3);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0xffd700, side: THREE.DoubleSide });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.z = -0.01; // Behind image
      mesh.add(frame);

      // Invisible Hit Area (Larger)
      const hitGeo = new THREE.BoxGeometry(2.0, 2.5, 1.0); // Made bigger for easier clicking
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitBox = new THREE.Mesh(hitGeo, hitMat);
      mesh.add(hitBox);
      hitBox.userData = { ...data, isOrnament: true, parent: mesh }; // IMPORTANT: hitBox needs this flag

      this.ornaments.push(mesh);
      this.group.add(mesh);
    });
  }

  public updateTexture(id: string, src: string) {
    const mesh = this.ornaments.find(o => o.userData.id === id);
    if (mesh && mesh.material) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(src, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.map = texture;
        mat.needsUpdate = true;
      });
    }
  }

  public update(time: number, dispersion: number = 0) {
    this.ornaments.forEach((mesh, i) => {
      // Skip if expanded (being viewed)
      if (mesh.userData.isExpanded) return;

      const p = mesh.userData;
      
      // Dispersion Logic
      // Similar logic to particles: target + velocity * dispersion * scale
      // But ornaments are fewer, we can be precise.
      
      const explodeDist = dispersion * 20.0; // Scatter widely
      
      const targetPos = p.originalPosition.clone();
      if (dispersion > 0.01) {
          targetPos.addScaledVector(p.explosionVelocity, explodeDist);
      }

      // Smooth lerp to target
      mesh.position.lerp(targetPos, 0.1);

      // Add sway only if not dispersed too much
      if (dispersion < 0.2) {
         // We can't easily add rotation offset without messing up the lookAt.
         // But since we are lerping position, rotation is fine.
         // Maybe just bob up and down slightly?
         mesh.position.y += Math.sin(time + i) * 0.002;
      }
    });
  }
  
  public getObjects() {
    return this.ornaments;
  }

  public dispose() {
     this.group.clear();
     this.ornaments.forEach(mesh => {
         mesh.geometry.dispose();
         (mesh.material as THREE.Material).dispose();
     });
  }
}
