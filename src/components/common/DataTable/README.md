# DataTable 组件使用文档（简化版）

## 📝 这是什么？

一个超简单的表格组件，专为 DataMonitor 项目设计。

**核心功能：**
- ✅ 自动显示状态标签（StatusTag）
- ✅ 自动格式化时间
- ✅ 简单的操作按钮
- ✅ 自动分页

## 🚀 快速开始

### 1. 最简单的表格（只显示文本）

```vue
<template>
  <DataTable :data="list" :columns="columns" />
</template>

<script setup lang="ts">
import DataTable from '@/components/common/DataTable/index.vue'
import type { Column } from '@/components/common/DataTable/types'

const list = [
  { id: 1, name: '设备A' },
  { id: 2, name: '设备B' }
]

const columns: Column[] = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '设备名称' }
]
</script>
```

### 2. 带状态标签（自动使用 StatusTag）

```vue
<script setup lang="ts">
const columns: Column[] = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '任务名称' },
  {
    prop: 'status',
    label: '状态',
    width: 120,
    isStatus: true,              // 标记为状态列
    statusCategory: 'status'     // 使用哪种状态映射
  }
]
</script>
```

### 3. 带时间格式化

```vue
<script setup lang="ts">
const columns: Column[] = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '任务名称' },
  {
    prop: 'createTime',
    label: '创建时间',
    width: 180,
    isTime: true  // 标记为时间列，自动格式化
  }
]
</script>
```

### 4. 带操作按钮

```vue
<script setup lang="ts">
const columns: Column[] = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '任务名称' },
  {
    prop: 'actions',
    label: '操作',
    width: 200,
    isActions: true,  // 标记为操作列
    actions: [
      {
        label: '查看',
        type: 'primary',
        onClick: (row) => console.log(row)
      },
      {
        label: '删除',
        type: 'danger',
        onClick: (row) => deleteRow(row)
      },
      {
        label: '启动',
        type: 'success',
        onClick: (row) => startTask(row),
        show: (row) => row.status === '4'  // 条件显示
      }
    ]
  }
]
</script>
```

### 5. 带分页

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

<script setup lang="ts">
import { ref } from 'vue'

const page = ref(1)
const size = ref(10)
const total = ref(100)
</script>
```

## 📋 完整示例（DiagnosisView.vue）

```vue
<template>
  <DataTable
    :data="taskList"
    :columns="columns"
    :loading="loading"
    :show-pagination="true"
    :total="total"
    :current-page="page"
    :page-size="size"
    @page-change="page = $event"
    @size-change="size = $event"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataTable from '@/components/common/DataTable/index.vue'
import type { Column } from '@/components/common/DataTable/types'

const loading = ref(false)
const taskList = ref([])
const page = ref(1)
const size = ref(10)
const total = ref(0)

const columns: Column[] = [
  { prop: 'id', label: '任务ID', width: 100 },
  { prop: 'name', label: '任务名称' },
  { prop: 'device_id', label: '设备ID', width: 120 },
  {
    prop: 'status',
    label: '状态',
    width: 120,
    isStatus: true,
    statusCategory: 'status'
  },
  {
    prop: 'priority',
    label: '优先级',
    width: 100,
    isStatus: true,
    statusCategory: 'priority'
  },
  {
    prop: 'create_time',
    label: '创建时间',
    width: 180,
    isTime: true
  },
  {
    prop: 'actions',
    label: '操作',
    width: 200,
    isActions: true,
    actions: [
      { label: '查看', type: 'primary', onClick: (row) => viewDetail(row) },
      { label: '暂停', type: 'warning', onClick: (row) => pauseTask(row), show: (row) => row.status === '0' },
      { label: '启动', type: 'success', onClick: (row) => startTask(row), show: (row) => row.status === '4' },
      { label: '删除', type: 'danger', onClick: (row) => deleteTask(row) }
    ]
  }
]
</script>
```

## 💡 核心概念

### 列配置只需要记住 3 个标记：

1. **`isStatus: true`** - 这是状态列，自动用 StatusTag 显示
2. **`isTime: true`** - 这是时间列，自动格式化
3. **`isActions: true`** - 这是操作列，配置 actions 数组

### 操作按钮的 `show` 属性：

```typescript
{
  label: '启动',
  onClick: (row) => startTask(row),
  show: (row) => row.status === '4'  // 只在待执行状态显示
}
```

## 📊 Props 说明

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| data | Array | ✅ | 表格数据 |
| columns | Column[] | ✅ | 列配置 |
| loading | Boolean | ❌ | 加载状态 |
| showPagination | Boolean | ❌ | 是否显示分页 |
| total | Number | ❌ | 总条数（分页时需要） |
| currentPage | Number | ❌ | 当前页码 |
| pageSize | Number | ❌ | 每页条数 |

## 🎯 Column 配置说明

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| prop | String | ✅ | 字段名 |
| label | String | ✅ | 列标题 |
| width | Number | ❌ | 列宽度 |
| isStatus | Boolean | ❌ | 是否是状态列 |
| statusCategory | String | ❌ | 状态类型（status/priority/device等） |
| isTime | Boolean | ❌ | 是否是时间列 |
| isActions | Boolean | ❌ | 是否是操作列 |
| actions | Action[] | ❌ | 操作按钮列表 |

