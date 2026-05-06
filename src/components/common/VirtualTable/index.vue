<template>
  <div v-loading="loading" class="virtual-table-wrapper">
    <el-auto-resizer>
      <template #default="{ height: autoHeight, width: autoWidth }">
        <el-table-v2 :columns="processedColumns" :data="data" :width="width || autoWidth" :height="height || autoHeight"
          :row-height="50" :header-height="50" class="virtual-table" />
      </template>
    </el-auto-resizer>
  </div>
</template>

<script setup lang="ts">
import { h, computed, defineAsyncComponent } from 'vue'
import { TableV2 as ElTableV2, ElAutoResizer, ElButton } from 'element-plus'
import type { Props, Column } from './types'

const StatusTag = defineAsyncComponent(() => import('../statusTag.vue'))

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  width: undefined,
  height: undefined
})

// 时间格式化
const formatTime = (timestamp: number) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}:${s}`
}

// 创建 cellRenderer
const createCellRenderer = (col: Column) => {
  return ({ rowData, cellData }: any) => {
    // 时间列 - 添加调试日志
    if (col.isTime) {
      console.log(`[VirtualTable] 时间列 ${col.dataKey}:`, { cellData, rowData })
      return h('span', formatTime(cellData))
    }

    // 状态列
    if (col.isStatus) {
      return h(StatusTag, {
        category: col.statusCategory || 'custom',
        value: cellData,
        size: 'small'
      })
    }

    // 操作列
    if (col.isActions && col.actions) {
      return h(
        'div',
        { class: 'actions' },
        col.actions
          .filter(action => !action.show || action.show(rowData))
          .map(action =>
            h(ElButton, {
              type: action.type || 'primary',
              link: true,
              size: 'small',
              onClick: () => action.onClick(rowData)
            }, () => action.label)
          )
      )
    }

    // 普通列
    return h('span', cellData || '-')
  }
}

// 处理列配置
const processedColumns = computed(() => {
  return props.columns.map(col => ({
    ...col,
    cellRenderer: createCellRenderer(col)
  }))
})
</script>

<style scoped>
.virtual-table-wrapper {
  width: 100%;
  height: 100%;
  border: 0;
  border-radius: 0;
  overflow: hidden;
  background: transparent;
}

.virtual-table :deep(.el-table-v2) {
  background: transparent;
}

.virtual-table :deep(.el-table-v2__header) {
  background: linear-gradient(180deg, #fafcff 0%, #f4f8fd 100%);
  border-bottom: 1px solid #e5edf8;
}

.virtual-table :deep(.el-table-v2__header-row) {
  background: linear-gradient(180deg, #fafcff 0%, #f4f8fd 100%);
  color: #5f6f85;
  font-weight: 600;
  font-size: 13px;
}

.virtual-table :deep(.el-table-v2__header-cell) {
  background: linear-gradient(180deg, #fafcff 0%, #f4f8fd 100%);
  color: #5f6f85;
  font-weight: 600;
  font-size: 13px;
  padding: 0 12px;
}

.virtual-table :deep(.el-table-v2__row) {
  background-color: #fff;
  border-bottom: 1px solid #e5edf8;
}

.virtual-table :deep(.el-table-v2__row-cell) {
  color: #2b3648;
  font-size: 13px;
  padding: 0 12px;
}

.status-text {
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.78);
  color: #516079;
  font-size: 12px;
}

.status-text--status {
  background: rgba(79, 124, 255, 0.08);
  color: #1f3356;
}

.status-text--priority {
  background: rgba(245, 158, 11, 0.08);
  color: #8a5a00;
}

.virtual-table :deep(.el-table-v2__row:hover) {
  background-color: #f2f7ff !important;
}

.virtual-table :deep(.el-table-v2__row:hover .el-table-v2__row-cell) {
  background-color: #f2f7ff !important;
}

.virtual-table :deep(.el-table-v2__empty) {
  background-color: #fff;
  color: #6f7d92;
}

.actions {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.actions :deep(.el-button--link) {
  color: var(--primary);
}

.actions :deep(.el-button--link:hover) {
  color: var(--primary-hover);
}

.virtual-table :deep(.el-scrollbar__bar) {
  z-index: 10;
}

.virtual-table :deep(.el-table-v2__overlay) {
  z-index: 10;
}
</style>
