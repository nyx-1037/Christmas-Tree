import * as THREE from 'three';

export class StardustSystem {
  mesh: THREE.Points;
  positions: Float32Array;
  velocities: { x: number; y: number; z: number }[] = [];
  life: Float32Array;
  count: number;

  constructor(scene: THREE.Scene, count: number = 500) {
    this.count = count;
    const geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(count * 3);
    this.life = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      this.life[i] = 0;
      this.positions[i * 3] = 9999; // Hide initially
      this.positions[i * 3 + 1] = 9999;
      this.positions[i * 3 + 2] = 9999;
      this.velocities.push({ x: 0, y: 0, z: 0 });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.mesh = new THREE.Points(geometry, material);
    scene.add(this.mesh);
  }

  public spawn(position: THREE.Vector3, amount: number = 30) {
    let spawned = 0;
    for (let i = 0; i < this.count && spawned < amount; i++) {
      if ((this.life[i] ?? 0) <= 0) {
        this.positions[i * 3] = position.x;
        this.positions[i * 3 + 1] = position.y;
        this.positions[i * 3 + 2] = position.z;

        const speed = 0.05 + Math.random() * 0.1;
        // Random direction on sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        const velocity = this.velocities[i];
        if (velocity) {
          velocity.x = Math.sin(phi) * Math.cos(theta) * speed;
          velocity.y = Math.sin(phi) * Math.sin(theta) * speed;
          velocity.z = Math.cos(phi) * speed;
        }

        this.life[i] = 1.0; // Life starts at 1.0
        spawned++;
      }
    }
    if (this.mesh.geometry.attributes.position) {
      this.mesh.geometry.attributes.position.needsUpdate = true;
    }
  }

  public spawnTrail(position: THREE.Vector3) {
    // Fewer particles for trail
    this.spawn(position, 2);
  }

  public update() {
    let active = false;
    for (let i = 0; i < this.count; i++) {
      const life = this.life[i] ?? 0;
      if (life > 0) {
        this.life[i] = life - 0.02; // Decay

        if (this.life[i]! <= 0) {
          this.positions[i * 3] = 9999; // Hide
          this.positions[i * 3 + 1] = 9999;
          this.positions[i * 3 + 2] = 9999;
        } else {
          const velocity = this.velocities[i];
          if (velocity) {
            this.positions[i * 3]! += velocity.x;
            this.positions[i * 3 + 1]! += velocity.y;
            this.positions[i * 3 + 2]! += velocity.z;
            
            // Gravity
            velocity.y -= 0.002;
          }
          
          active = true;
        }
      }
    }
    if (active && this.mesh.geometry.attributes.position) {
      this.mesh.geometry.attributes.position.needsUpdate = true;
    }
  }

  public dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
