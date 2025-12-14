## 项目概览

这是一个基于 Vue 3 + TypeScript + Three.js 的 3D 粒子圣诞树项目，包含：

- 粒子构成的立体圣诞树（树冠、树干、装饰物、雪花、光晕等）
- 可点击抽出的贺卡相框（支持默认配置和前端本地上传）
- 可调节的控制面板（粒子密度、雪花密度、主题色、自动旋转、光晕、音乐等）
- 响应式布局（兼顾桌面端与移动端）
- 自定义配置文件 `AppConfig`，用于集中管理音乐、视觉、树形态和 UI 文字

本文重点说明：

1. 如何安装、运行、构建项目  
2. 项目结构与主要模块说明  
3. 配置文件 `config.ts`、`ornamentData.ts` 的使用方式  
4. 控制面板与交互逻辑  
5. 如何扩展与二次开发

---

## 环境准备与启动

### 1. 安装依赖

在项目根目录 `3d-Christmas-Tree/` 下执行：

```bash
npm install
```

### 2. 本地开发启动

```bash
npm run dev
```

默认会在 `http://localhost:5173` 启动开发服务器。

### 3. 类型检查与生产构建

```bash
npm run build
```

该命令会先执行 TypeScript 类型检查（`vue-tsc`），然后使用 Vite 进行打包构建。  
构建产物会输出到 `dist/` 目录，可直接部署到静态服务器。

---

## 项目结构说明

根目录结构（只列出与业务强相关的部分）：

- `src/main.ts`：Vue 应用入口，挂载根组件 `App.vue`
- `src/App.vue`：全局布局与全局样式（包括圣诞帽样式的鼠标指针）
- `src/components/ChristmasTree.vue`：核心场景控制组件，负责 Three.js 场景、相机、光照、渲染循环、交互
- `src/components/ParticleSystem.ts`：粒子圣诞树（树冠、树干、礼物、糖果、光晕、雪花）的数据生成与更新逻辑
- `src/components/OrnamentSystem.ts`：树上的贺卡相框（plane + frame + hitbox）的创建与更新
- `src/components/OrnamentViewer.vue`：点击相框后弹出的大图查看/抽出动画
- `src/components/ControlPanel.vue`：右侧控制面板（中文/英文双语），用于调整多种参数
- `src/components/StardustSystem.ts`：鼠标轨迹星尘/魔法粒子效果
- `src/components/AudioSystem.ts`：背景音乐播放器，基于配置文件路径加载
- `src/assets/data/config.ts`：全局配置文件 `AppConfig`（音频/视觉/树/界面）
- `src/assets/data/ornamentData.ts`：默认贺卡相框配置（最多 15 张），包括默认图片路径和在树上的位置
- `src/stores/ornamentStore.ts`：Pinia 存储，用于缓存用户前端上传的图片

下面对配置相关文件和关键组件做重点说明。

---

## 配置文件：`AppConfig` 使用说明

文件路径：`src/assets/data/config.ts:1-30`

```ts
export const AppConfig = {
  audio: {
    backgroundMusic: 'https://...mp3',
    volume: 0.5,
    autoPlay: false
  },
  visuals: {
    bloomStrength: 0.8,
    bloomRadius: 0.8,
    bloomThreshold: 0.2,
    particleCountMultiplier: 1.0,
    twinkleSpeed: 1.0,
  },
  tree: {
    rotationSpeed: 1.0,
    colorTheme: 'classic',
    dispersionLimit: 1.5
  },
  ui: {
    title: 'Merry Christmas',
    showTitle: true
  }
}
```

### 1. 音频配置 `audio`

使用位置：

- 创建音频系统：`src/components/AudioSystem.ts:1-11`
- 控制音乐播放：`src/components/ChristmasTree.vue:107-110` 和 `src/components/ControlPanel.vue:252-258`

字段说明：

- `backgroundMusic: string`  
  背景音乐的完整 URL。可以直接配置为中国区可用的 CDN/对象存储地址（如阿里云 OSS），当前示例即为一首圣诞氛围曲。

  修改方式：只需替换为你自己的 MP3 地址，例如：

  ```ts
  audio: {
    backgroundMusic: 'https://your-cdn.com/path/to/your-music.mp3',
    volume: 0.5,
    autoPlay: false
  }
  ```

- `volume: number`  
  默认音量，范围 0–1。  
  同时也会被控制面板中的音乐按钮间接使用（播放/暂停）。

- `autoPlay: boolean`  
  是否在用户与页面产生交互后自动播放。当前实现中是手动点击按钮触发播放，实际行为由浏览器自动播放策略限制。

### 2. 视觉配置 `visuals`

使用位置：

- Bloom 强度初始值：`src/components/ChristmasTree.vue:55-56`
- 控制面板初始值：`src/components/ControlPanel.vue:35-36`
- Bloom Pass 实际应用：`src/components/ChristmasTree.vue:151-161`
- 粒子闪烁速度：`src/components/ParticleSystem.ts:update(...)` 内使用 `twinkleSpeed` 参数

字段说明：

- `bloomStrength: number`  
  光晕强度，数值越大，发光越明显。  
  控制面板中通过滑杆实时修改：`ControlPanel.vue` -> 事件 `update:bloom` -> `ChristmasTree.vue:94-97` 更新 `bloomPass.strength`。

- `bloomRadius: number` / `bloomThreshold: number`  
  Bloom 效果半径和阈值，目前主要在 `UnrealBloomPass` 初始化时使用，可以按需进一步接入面板。

- `particleCountMultiplier: number`  
  粒子数量的预设倍率，目前内部粒子生成是使用固定值 + 控制面板密度滑杆为主，如需做全局系数，可在 `ParticleSystem` 中读取该字段作为总粒子数量系数。

- `twinkleSpeed: number`  
  装饰物闪烁速度的默认值，在：

  - `ControlPanel.vue:36` 作为初始 `twinkleSpeed`
  - `ChristmasTree.vue:55-56` 作为树组件内的响应式状态
  - `ParticleSystem.ts:update(...)` 中影响装饰粒子缩放动画节奏

### 3. 圣诞树配置 `tree`

使用位置：

- 初始色系主题：`ControlPanel.vue:37`  
- 颜色更新逻辑：`ParticleSystem.ts:updateColors(theme: string)`  
- 最大爆散程度：结合滚轮事件 `onWheel`（在 `ChristmasTree.vue` 中）与 `dispersionState` 使用

字段说明：

- `rotationSpeed: number`  
  自动旋转速度，可用于调整 `OrbitControls.autoRotateSpeed`（当前写死为 1.0，可根据需要改成使用该配置）。

- `colorTheme: 'classic' | 'icy' | 'golden'`  
  粒子颜色主题，控制面板中可切换，最终由 `ParticleSystem.updateColors` 渲染不同色系：

  - `classic`：传统绿+红+金
  - `icy`：冰蓝色调
  - `golden`：黑金/金色主题

- `dispersionLimit: number`  
  粒子爆散的最大程度，与滚轮交互逻辑中的上限相关。当你希望树在滚轮拉满时散得更开，可以适当调大。

### 4. UI 配置 `ui`

使用位置：

- 可用于控制是否在页面上显示标题或其他文本提示（目前主要用于语义配置，可按需在 `ChristmasTree.vue` 或其他组件中读取使用）。

字段说明：

- `title: string`：默认显示标题文案，例如 “Merry Christmas”
- `showTitle: boolean`：是否显示标题，可以用于控制某个顶部文案区域的可见性

---

## 默认装饰配置：`ornamentData.ts`

文件路径：`src/assets/data/ornamentData.ts:1-39`

该文件定义了树上 15 个默认贺卡相框：

- 接口定义 `Ornament`：`id`、`src`、`title`、`description`、`position(x,y,z)`、`scale`
- 使用 `Array.from({ length: 15 })` 生成 15 个位置均匀分布在树外层的相框（通过 `generatePosition` 计算圆锥表面坐标）
- 默认图片地址 `src` 来自阿里云 OSS，可直接替换为你自己的图片 CDN 地址

要修改默认相框：

1. 如果要替换全部默认图：

   ```ts
   export const ornamentImages: Ornament[] = Array.from({ length: 15 }, (_, i) => {
     const pos = generatePosition(i, 15)
     return {
       id: `ornament_${i + 1}`,
       src: 'https://your-cdn.com/path/default-image.jpg',
       title: `Memory ${i + 1}`,
       description: 'Click to upload your photo',
       position: pos,
       scale: 0.3
     }
   })
   ```

2. 如果只想为某几个卡片单独配置不同图片，可以手动写成数组：

   ```ts
   export const ornamentImages: Ornament[] = [
     {
       id: 'ornament_1',
       src: 'https://your-cdn.com/a.jpg',
       title: '2025 元旦',
       description: '和家人的合影',
       position: generatePosition(0, 15),
       scale: 0.3
     },
     // ...
   ]
   ```

> 注意：前端上传的图片会通过 Pinia 覆盖默认配置的 `src`，优先级为：用户上传 > 配置文件。

---

## 控制面板与交互逻辑

### 控制面板组件 `ControlPanel.vue`

文件路径：`src/components/ControlPanel.vue`

功能：

- 展开/收起控制（右上角悬浮球按钮）
- 调整粒子爆散程度（展开/合并）
- 开关自动旋转
- 调节 Bloom 强度与装饰闪烁速度
- 控制雪花密度与雪花速度
- 控制树整体粒子密度与装饰物密度
- 切换颜色主题
- 选择贺卡卡片并批量上传图片填充
- 背景音乐播放/暂停

与 `ChristmasTree.vue` 的事件通讯：

- 利用 `v-model` 式的 `update:*` 事件双向同步参数：
  - `update:dispersion` -> `dispersionState.target` 控制爆散
  - `update:autoRotate` -> `controls.autoRotate`
  - `update:bloom` -> `bloomPass.strength`
  - `update:twinkle` -> 传入 `ParticleSystem.update` 的 `twinkleSpeed`
  - `update:theme` -> `particleSystem.updateColors`
  - `update:snowDensity` / `update:snowSpeed` / `update:treeDensity` / `update:decorationDensity`
- `toggle-music` -> `AudioSystem.play/pause`
- `trigger-upload` -> 通知 `OrnamentSystem` 重新加载纹理

> 配置与面板的关系：  
> 面板的初始值来自 `AppConfig`（例如 Bloom 初始值、主题颜色），用户在运行时修改不会写回配置文件，只影响当前会话。

### 鼠标滚轮与爆散效果

在 `ChristmasTree.vue` 中：

- 监听 `wheel` 事件（`onWheel`）改变 `dispersionState.target`，拉大滚轮时树会被逐渐“炸开”
- 在渲染循环中，将 `dispersionState.current` 平滑逼近期望值，并传入：
  - `ParticleSystem.update(time, mouse3D, dispersion, twinkleSpeed, snowDensity, snowSpeed, treeDensity, decorationDensity)`
  - `OrnamentSystem.update(time, dispersion)` 使相框也随粒子一起爆散

---

## 鼠标指针为圣诞帽样式

文件路径：`src/App.vue:9-24`

当前实现基于你提供的 `cursor_plan.md` 中的圣诞帽方案，采用 **Base64 编码的 SVG**，兼容性比 `utf8` 直写版本更好。

```css
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #0a0a1a;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  cursor: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMjAgMjJINEMxMiAyMiAxMiAyIDEyIDJaIiBmaWxsPSIjRkY0NjQ2Ii8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iOCIgcj0iMyIgZmlsbD0iI0ZGRkZGRiIvPgo8L3N2Zz4=') 12 12, auto;
}

a,
button {
  cursor: pointer !important;
}
```

说明：

- 红色帽子主体 + 白色毛球使用 SVG 绘制，并通过 Base64 嵌入，避免浏览器对 `utf8` 字符串中引号、空格的解析问题。
- `12 12` 为热点坐标，对应 24×24 图标的中心位置。
- 链接和按钮强制使用手型指针，避免被全局自定义光标覆盖。

如果你想改为自己的 PNG/ICO 图标，可以改为：

```css
body {
  cursor: url('https://your-cdn.com/hat-cursor.png') 12 12, auto;
}
```

建议鼠标图标尺寸控制在 32×32 或以下，并部署在中国区可访问的 CDN/对象存储上。

---

## 背景音乐与资源 CDN 建议

由于项目中使用的音乐、图片等静态资源均通过 URL 加载，建议：

- 使用中国大陆可访问性良好的对象存储或 CDN（如阿里云 OSS、又拍云、七牛云等）
- 保证 URL 支持 HTTPS，避免浏览器混合内容警告
- 更新路径时只需修改：
  - 背景音乐：`AppConfig.audio.backgroundMusic`（`config.ts:1-7`）
  - 默认相片：`ornamentData.ts` 中每个 `src` 字段

---

## 开发与扩展建议

### 增加新的粒子效果或装饰

- 在 `ParticleSystem.ts` 中新增粒子类型：
  - 扩展 `type` 字段（例如 `type: 'star'`）
  - 在生成数据的函数里填充对应粒子数组
  - 在 `createMeshes` 里为该数组创建对应的 `InstancedMesh`
  - 在 `update` 中为新类型添加更新逻辑（旋转、闪烁等）

### 使用配置文件驱动更多行为

你可以将更多“常量”提取到 `AppConfig` 中，例如：

- 默认雪花数量上限
- 自动旋转是否开启
- 控制面板中某些选项是否可用

这样可以做到：

- 不改动业务逻辑，仅通过修改配置文件就能调整体表现
- 保证配置集中、便于后期运营调参

---

## 构建与部署

1. 在本地确认 `npm run build` 无错误（本项目在修改后会自动跑类型检查和构建）
2. 将 `dist/` 目录内容上传到任意静态网站托管（如 Nginx、Vercel、OSS 静态托管等）
3. 如果部署在国内生产环境，请确保：
   - 音乐/图片等第三方资源均为中国大陆可访问的 CDN
   - 页脚 ICP 与 公安备案信息按照实际情况填写并保持可点

---

如需继续扩展（例如接入后端接口、动态配置、数据库存储用户相册等），可以在现有的 `AppConfig` 和 `ornamentStore` 设计基础上进一步演化为从后端拉取配置的模式。当前项目为纯前端实现，所有状态均在浏览器侧维护。
