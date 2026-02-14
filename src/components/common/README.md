# 公用组件库使用说明

## 组件列表

- **CommonButton** - 按钮组件
- **CommonCard** - 卡片组件
- **CommonModal** - 模态框组件
- **CommonLoading** - 加载组件
- **CommonTag** - 标签组件
- **CommonEmpty** - 空状态组件

## 使用方式

### 方式一：按需导入（推荐）

```vue
<script setup lang="ts">
import { CommonButton, CommonCard } from '@/components/common'
</script>

<template>
  <CommonCard title="示例卡片">
    <CommonButton type="primary" @click="handleClick">点击我</CommonButton>
  </CommonCard>
</template>
```

### 方式二：全局注册

在 `main.ts` 中：

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import commonComponents from '@/components/common'

const app = createApp(App)

// 全局注册所有公用组件
Object.entries(commonComponents).forEach(([name, component]) => {
  app.component(name, component)
})

app.mount('#app')
```

然后在任何组件中直接使用：

```vue
<template>
  <CommonButton type="primary">按钮</CommonButton>
</template>
```

## 组件示例


