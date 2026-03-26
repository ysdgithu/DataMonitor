# Pagination 分页组件使用文档

## 📝 这是什么？

一个独立的、完全中文化的分页组件，基于 Element Plus 的 `<el-pagination>` 封装。

**核心特点：**
- ✅ 完全中文化（"共 X 条"、"条/页"等）
- ✅ 使用 base.css 的设计规范
- ✅ 工业运维风格的配色
- ✅ 简单易用的 Props 接口

## 🚀 快速开始

### 1. 基础使用

```vue
<template>
  <Pagination
    :current-page="page"
    :page-size="size"
    :total="total"
    @page-change="page = $event"
    @size-change="size = $event"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Pagination from '@/components/common/Pagination.vue'

const page = ref(1)
const size = ref(10)
const total = ref(100)
</script>
```

### 2. 在 DataTable 中使用

DataTable 组件已经内置了 Pagination，只需要设置 `show-pagination` 即可：

```vue
<template>
  <DataTable
    :data="list"
    :columns="columns"
    :show-pagination="true"
    :total="total"
    :current-page="page"
    :page-size="size"
    @page-change="page = $event"
    @size-change="size = $event"
  />
</template>
```

### 3. 自定义配置

```vue
<template>
  <Pagination
    :current-page="page"
    :page-size="size"
    :total="total"
    :page-sizes="[5, 10, 20, 50]"
    layout="total, prev, pager, next"
    :background="false"
    :small="true"
    @page-change="handlePageChange"
    @size-change="handleSizeChange"
  />
</template>

<script setup lang="ts">
const handlePageChange = (newPage: number) => {
  console.log('切换到第', newPage, '页')
  // 重新加载数据...
}

const handleSizeChange = (newSize: number) => {
  console.log('每页显示', newSize, '条')
  // 重新加载数据...
}
</script>
```

## 📊 Props 说明

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| currentPage | Number | ❌ | 1 | 当前页码 |
| pageSize | Number | ❌ | 10 | 每页显示条数 |
| total | Number | ✅ | - | 总条数 |
| pageSizes | Number[] | ❌ | [10, 20, 50, 100] | 每页显示个数选择器的选项 |
| layout | String | ❌ | 'total, sizes, prev, pager, next, jumper' | 组件布局 |
| background | Boolean | ❌ | true | 是否为分页按钮添加背景色 |
| small | Boolean | ❌ | false | 是否使用小型分页样式 |

## 🎯 Events 说明

| 事件名 | 参数 | 说明 |
|--------|------|------|
| page-change | page: number | 当前页改变时触发 |
| size-change | size: number | 每页条数改变时触发 |

## 💡 中文化说明

组件已经通过 `main.ts` 配置了 Element Plus 的中文语言包：

```typescript
// main.ts
import zhCn from 'element-plus/es/locale/lang/zh-cn'

app.use(ElementPlus, {
  locale: zhCn,
})
```

这样所有 Element Plus 组件（包括分页）都会显示中文：
- "共 100 条" 替代 "Total 100 items"
- "10 条/页" 替代 "10 items/page"
- "前往" 替代 "Go to"

## 🎨 样式说明

组件样式完全遵循 `src/assets/base.css` 的设计规范：

- **颜色**：使用 `--primary`、`--text-secondary`、`--border-base` 等 CSS 变量
- **间距**：使用 `--spacing-xs`、`--spacing-sm`、`--spacing-base` 等
- **字体**：使用 `--font-sm` 等
- **工业运维风格**：蓝色主题，清晰的边框和悬停效果

## 🔧 常见问题

### Q: 为什么分页还是显示英文？
A: 请确保在 `main.ts` 中配置了中文语言包（见上面的"中文化说明"）。

### Q: 如何修改分页器的样式？
A: 可以通过 CSS 变量修改，或者在使用组件的地方添加自定义样式：

```vue
<Pagination class="custom-pagination" ... />

<style scoped>
.custom-pagination :deep(.el-pager li) {
  /* 自定义样式 */
}
</style>
```

### Q: DataTable 和 VirtualTable 都能用吗？
A: 是的！DataTable 已经内置了 Pagination。VirtualTable 通常不需要分页（因为虚拟化本身就能处理大数据），但如果需要也可以手动添加。

