# StatusTag 状态标签组件

美观的状态标签组件，用于替换 Element Plus 的 `el-tag`，提供更好的视觉效果和一致性。

## ✨ 特性

- 🎨 **渐变背景** - 使用渐变色和发光效果，更加美观
- 🔄 **平滑过渡** - hover 时有流畅的动画效果
- 📏 **多种尺寸** - 支持 small、default、large 三种尺寸
- 🎯 **图标支持** - 可选的图标显示
- 🌈 **多种类型** - success、warning、danger、info、primary

## 📦 使用方式

### 基础用法

```vue
<template>
  <StatusTag type="success">正常</StatusTag>
  <StatusTag type="warning">警告</StatusTag>
  <StatusTag type="danger">危险</StatusTag>
  <StatusTag type="info">信息</StatusTag>
</template>
```

### 不同尺寸

```vue
<template>
  <StatusTag type="success" size="small">小号</StatusTag>
  <StatusTag type="success" size="default">默认</StatusTag>
  <StatusTag type="success" size="large">大号</StatusTag>
</template>
```

### 带图标

```vue
<script setup lang="ts">
import { CircleCheck, Warning, CircleClose } from '@element-plus/icons-vue'
</script>

<template>
  <StatusTag type="success" :icon="CircleCheck">已完成</StatusTag>
  <StatusTag type="warning" :icon="Warning">待处理</StatusTag>
  <StatusTag type="danger" :icon="CircleClose">失败</StatusTag>
</template>
```

### 使用 text 属性

```vue
<template>
  <StatusTag type="success" text="正常" />
</template>
```

## 🔧 API

### Props

| 参数 | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| type | 标签类型 | string | success / warning / danger / info / primary | info |
| text | 标签文本 | string | - | - |
| size | 标签尺寸 | string | small / default / large | default |
| icon | 图标组件 | Component | - | - |

### Slots

| 名称 | 说明 |
|------|------|
| default | 标签内容 |

## 🎯 替换 el-tag 示例

### 替换前

```vue
<el-tag type="success">正常</el-tag>
<el-tag type="warning">警告</el-tag>
<el-tag type="danger">失败</el-tag>
```

### 替换后

```vue
<StatusTag type="success">正常</StatusTag>
<StatusTag type="warning">警告</StatusTag>
<StatusTag type="danger">失败</StatusTag>
```

## 🎨 视觉效果

- **渐变背景**：每种类型都有独特的渐变色
- **发光效果**：hover 时有微妙的发光和阴影效果
- **流光动画**：hover 时有从左到右的流光效果
- **平滑过渡**：所有状态变化都有 0.3s 的过渡动画

## 📝 注意事项

1. 组件已全局注册，可以直接在任何组件中使用
2. 推荐使用默认插槽而不是 text 属性，更加灵活
3. 图标需要从 `@element-plus/icons-vue` 导入

