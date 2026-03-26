# VirtualTable 组件使用文档（简化版）

## 📝 这是什么？

虚拟化表格组件，用于显示大量数据（1000+ 条）时不卡顿。

**核心功能：**
- ✅ 支持数万条数据流畅滚动
- ✅ 自动显示状态标签
- ✅ 自动格式化时间
- ✅ 简单的操作按钮

**什么时候用？** 数据超过 500 条时建议使用。

## 🚀 快速开始

### 1. 最简单的虚拟化表格

```vue
<template>
  <VirtualTable
    :data="list"
    :columns="columns"
    :width="1000"
    :height="400"
  />
</template>

<script setup lang="ts">
import VirtualTable from '@/components/common/VirtualTable/index.vue'
import type { Column } from '@/components/common/VirtualTable/types'

const list = [
  { id: 1, name: '设备A', status: '0', date: 1707900000000 },
  // ... 可以有数万条数据
]

const columns: Column[] = [
  { key: 'id', title: 'ID', dataKey: 'id', width: 80 },
  { key: 'name', title: '设备名称', dataKey: 'name', width: 200 }
]
</script>
```

### 2. 带状态标签

```vue
<script setup lang="ts">
const columns: Column[] = [
  { key: 'id', title: 'ID', dataKey: 'id', width: 80 },
  {
    key: 'status',
    title: '状态',
    dataKey: 'status',
    width: 120,
    isStatus: true,
    statusCategory: 'historyData'
  }
]
</script>
```

### 3. 带时间格式化

```vue
<script setup lang="ts">
const columns: Column[] = [
  { key: 'id', title: 'ID', dataKey: 'id', width: 80 },
  {
    key: 'date',
    title: '时间',
    dataKey: 'date',
    width: 180,
    isTime: true
  }
]
</script>
```

### 4. 带操作按钮

```vue
<script setup lang="ts">
const columns: Column[] = [
  { key: 'id', title: 'ID', dataKey: 'id', width: 80 },
  {
    key: 'actions',
    title: '操作',
    dataKey: 'actions',
    width: 200,
    isActions: true,
    actions: [
      { label: '查看', type: 'primary', onClick: (row) => viewDetail(row) },
      { label: '删除', type: 'danger', onClick: (row) => deleteRow(row) }
    ]
  }
]
</script>
```

## 📋 完整示例（HistoryData.vue）

```vue
<template>
  <VirtualTable
    :data="list"
    :columns="columns"
    :width="1000"
    :height="400"
    :loading="loading"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import VirtualTable from '@/components/common/VirtualTable/index.vue'
import type { Column } from '@/components/common/VirtualTable/types'

const loading = ref(false)
const list = ref([
  { date: '23:42:04', name: '调配罐', type: '温度', value: '30', status: '0' },
  { date: '23:42:04', name: '调配罐', type: '液位', value: '50%', status: '1' }
  // ... 可以有数万条数据
])

const columns: Column[] = [
  { key: 'date', title: '时间', dataKey: 'date', width: 180 },
  { key: 'name', title: '设备名称', dataKey: 'name', width: 180 },
  { key: 'type', title: '监控参数', dataKey: 'type', width: 180 },
  { key: 'value', title: '监控参数数值', dataKey: 'value', width: 180 },
  {
    key: 'status',
    title: '数据状态',
    dataKey: 'status',
    width: 180,
    isStatus: true,
    statusCategory: 'historyData'
  },
  {
    key: 'actions',
    title: '操作',
    dataKey: 'actions',
    width: 200,
    isActions: true,
    actions: [
      { label: '删除', type: 'primary', onClick: (row) => deleteRow(row) }
    ]
  }
]
</script>
```

## 💡 核心概念

### 列配置只需要记住 3 个标记：

1. **`isStatus: true`** - 这是状态列
2. **`isTime: true`** - 这是时间列
3. **`isActions: true`** - 这是操作列

### 注意事项：

- **必须指定 width** - 虚拟化表格要求每列都有固定宽度
- **key 和 dataKey** - key 是唯一标识，dataKey 是数据字段名（通常相同）

## 📊 Props 说明

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| data | Array | ✅ | 表格数据 |
| columns | Column[] | ✅ | 列配置 |
| width | Number | ❌ | 表格宽度（不填自适应） |
| height | Number | ❌ | 表格高度（不填自适应） |
| loading | Boolean | ❌ | 加载状态 |

## 🎯 Column 配置说明

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| key | String | ✅ | 唯一标识 |
| title | String | ✅ | 列标题 |
| dataKey | String | ✅ | 数据字段名 |
| width | Number | ✅ | 列宽度（必填！） |
| isStatus | Boolean | ❌ | 是否是状态列 |
| statusCategory | String | ❌ | 状态类型 |
| isTime | Boolean | ❌ | 是否是时间列 |
| isActions | Boolean | ❌ | 是否是操作列 |
| actions | Action[] | ❌ | 操作按钮列表 |

## 📊 性能对比

| 数据量 | 普通表格 | 虚拟化表格 |
|--------|---------|-----------|
| 100 条 | ✅ 流畅 | ✅ 流畅 |
| 1000 条 | ⚠️ 卡顿 | ✅ 流畅 |
| 10000 条 | ❌ 崩溃 | ✅ 流畅 |

**建议：数据量 > 500 条时使用 VirtualTable**

