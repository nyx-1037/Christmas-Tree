export interface Ornament {
  id: string;
  src: string;
  title: string;
  description: string;
  position: { x: number; y: number; z: number };
  scale: number;
  thumbnail?: string;
}

// Helper to generate positions on a cone surface
// Height ~13, Bottom R ~5.5, Top R ~0.5
const generatePosition = (index: number, total: number) => {
  const hRatio = (index + 0.5) / total; // Spread vertically 0 to 1
  const y = 1.0 + hRatio * 10.0; // Height from 1.0 to 11.0
  
  // Radius at this height
  const maxR = 5.5 - (y / 13.0) * 5.0;
  
  // Angle: Golden angle spiral for even distribution
  const angle = index * 2.39996; // radians
  
  const x = Math.cos(angle) * maxR;
  const z = Math.sin(angle) * maxR;
  
  return { x, y, z };
};

export const ornamentImages: Ornament[] = Array.from({ length: 15 }, (_, i) => {
  const pos = generatePosition(i, 15);
  return {
    id: `ornament_${i + 1}`,
    src: 'https://nie1037-oss.oss-cn-hangzhou.aliyuncs.com/default-product.jpg',
    title: `Memory ${i + 1}`,
    description: 'Click to upload your photo',
    position: pos,
    scale: 0.3
  };
});
