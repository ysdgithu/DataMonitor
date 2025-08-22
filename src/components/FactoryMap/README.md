# 工厂车间地图组件使用文档

## 概述

工厂车间地图组件是一个基于Vue 3 + TypeScript + Element Plus开发的交互式2D地图组件，用于显示工厂车间的设备分布和实时状态。

## 功能特性

### 🗺️ 地图功能
- **区域划分**：支持多个功能区域（生产区、仓储区、办公区、检测区、维护区）
- **响应式设计**：自适应不同屏幕尺寸
- **SVG渲染**：使用SVG进行高质量2D渲染
- **工业风格**：简洁的工业风格设计，灰色调配色方案

### 🔧 设备管理
- **设备标注**：支持15-25个设备点位的标注
- **状态显示**：实时显示设备状态（在线/离线/警告/错误）
- **位置编码**：每个设备具有唯一的位置标识（如"1区3排"）
- **参数监控**：支持温度、压力、振动、功率等参数显示

### 🖱️ 交互功能
- **点击查看**：点击设备图标查看详细信息
- **缩放控制**：支持鼠标滚轮和按钮缩放
- **拖拽浏览**：支持地图拖拽平移
- **信息弹窗**：设备详情弹窗显示

## 技术架构

### 依赖项
```json
{
  "vue": "^3.5.13",
  "element-plus": "^2.9.7",
  "typescript": "~5.8.0"
}
```

### 文件结构
```
src/
├── components/
│   └── FactoryMap.vue          # 主组件
├── views/
│   └── FactoryMapView.vue      # 演示页面
├── utils/
│   └── type.ts                 # 类型定义
└── router/
    └── index.ts                # 路由配置
```

## 使用方法

### 1. 基本使用

```vue
<template>
  <div class="map-container">
    <FactoryMap />
  </div>
</template>

<script setup lang="ts">
import FactoryMap from '@/components/FactoryMap.vue'
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 600px;
}
</style>
```

### 2. 数据结构

#### 设备数据接口
```typescript
interface FactoryDevice {
  id: string                    // 设备唯一ID
  name: string                  // 设备名称
  type: string                  // 设备类型
  x: number                     // SVG坐标系中的x位置
  y: number                     // SVG坐标系中的y位置
  status: 'online' | 'offline' | 'warning' | 'error'  // 设备状态
  zone: string                  // 所属区域ID
  position: string              // 位置编码
  parameters?: {                // 可选参数
    temperature?: number
    pressure?: number
    vibration?: number
    power?: number
    [key: string]: any
  }
}
```

#### 区域数据接口
```typescript
interface FactoryZone {
  id: string                    // 区域唯一ID
  name: string                  // 区域名称
  color: string                 // 区域颜色
  path: string                  // SVG路径
  description?: string          // 区域描述
}
```

### 3. 自定义配置

#### 修改区域配置
```typescript
const zones = ref<FactoryZone[]>([
  {
    id: 'production',
    name: '生产区',
    color: '#2196f3',
    path: 'M 50 50 L 350 50 L 350 250 L 50 250 Z'
  },
  // 添加更多区域...
])
```

#### 修改设备数据
```typescript
const devices = ref<FactoryDevice[]>([
  {
    id: 'device-001',
    name: '设备A',
    type: '生产设备',
    x: 100,
    y: 100,
    status: 'online',
    zone: 'production',
    position: '1区1排',
    parameters: {
      temperature: 45,
      power: 85
    }
  },
  // 添加更多设备...
])
```

## 组件API

### Props
目前组件不接受外部props，所有数据都在组件内部定义。未来版本将支持外部数据传入。

### Events
目前组件不发出自定义事件。未来版本将支持设备点击、状态变更等事件。

### Methods
组件内部方法：
- `showDeviceInfo(device)` - 显示设备详情
- `zoomIn()` - 放大地图
- `zoomOut()` - 缩小地图
- `resetView()` - 重置视图

## 样式定制

### CSS变量
```css
:root {
  --factory-map-bg: #f5f5f5;
  --factory-map-grid: #e0e0e0;
  --device-online: #4caf50;
  --device-offline: #f44336;
  --device-warning: #ff9800;
  --device-error: #9e9e9e;
}
```

### 自定义样式
```css
.factory-map-container {
  /* 自定义容器样式 */
}

.device-group:hover {
  /* 自定义设备悬停效果 */
}
```

## 浏览器兼容性

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 性能优化建议

1. **设备数量**：建议设备数量控制在50个以内以保证流畅性
2. **SVG优化**：复杂路径可以考虑简化以提高渲染性能
3. **事件节流**：拖拽和缩放事件已进行节流处理

## 常见问题

### Q: 如何添加新的设备类型？
A: 在设备数据中添加新的type值，并在样式中定义对应的图标样式。

### Q: 如何修改地图尺寸？
A: 修改组件中的`baseWidth`和`baseHeight`常量。

### Q: 如何集成实时数据？
A: 可以通过props传入设备数据，或者在组件内部调用API获取实时数据。

## 更新日志

### v1.0.0 (2024-01-XX)
- 初始版本发布
- 支持基本的地图显示和设备标注
- 实现缩放、拖拽等交互功能
- 添加设备详情弹窗

## 贡献指南

欢迎提交Issue和Pull Request来改进这个组件。

## 许可证

MIT License
