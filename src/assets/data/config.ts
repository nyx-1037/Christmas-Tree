export const AppConfig = {
  // Audio Settings
  audio: {
    backgroundMusic: 'https://nie1037-oss.oss-cn-hangzhou.aliyuncs.com/music/music-data/%E5%9D%82%E6%9C%AC%E9%BE%8D%E4%B8%80%2C%20Jaques%20Morelenbaum%2C%20Judy%20Kang%20-%20Merry%20Christmas%20Mr.%20Lawrence.mp3', // User can replace this path
    volume: 0.5,
    autoPlay: false
  },
  
  // Visual Settings
  visuals: {
    bloomStrength: 0.8, // Glow intensity
    bloomRadius: 0.8,
    bloomThreshold: 0.2,
    particleCountMultiplier: 1.0, // Scale particle count
    twinkleSpeed: 1.0, // Speed of decoration flashing
  },

  // Tree Settings
  tree: {
    rotationSpeed: 1.0,
    colorTheme: 'classic', // 'classic', 'icy', 'golden'
    dispersionLimit: 1.5 // How far particles explode
  },

  // UI Settings
  ui: {
    title: 'Merry Christmas',
    showTitle: true
  }
};
