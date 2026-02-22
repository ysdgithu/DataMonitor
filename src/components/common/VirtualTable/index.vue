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
import { h, computed } from 'vue'
import { TableV2 as ElTableV2, ElAutoResizer, ElButton } from 'element-plus'
import StatusTag from '../statusTag.vue'
import type { Props, Column, Action } from './types'

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
    // 状态列
    if (col.isStatus) {
      return h(StatusTag, {
        category: col.statusCategory || 'custom',
        value: cellData,
        size: 'small'
      })
    }

    // 时间列
    if (col.isTime) {
      return h('span', formatTime(cellData))
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
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  overflow: hidden;
}

/* ========== 表头样式 ========== */
.virtual-table :deep(.el-table-v2__header) {
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
}

.virtual-table :deep(.el-table-v2__header-row) {
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: var(--font-sm);
}

.virtual-table :deep(.el-table-v2__header-cell) {
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: var(--font-sm);
  border-right: 1px solid var(--border-light);
  padding: 0 12px;
}

.virtual-table :deep(.el-table-v2__header-cell:last-child) {
  border-right: none;
}

/* ========== 表体样式 ========== */
.virtual-table :deep(.el-table-v2__row) {
  background-color: var(--bg-main);
  border-bottom: 1px solid var(--border-light);
}

/* 斑马纹效果 */
.virtual-table :deep(.el-table-v2__row:nth-child(even)) {
  background-color: var(--bg-secondary);
}

/* 行悬停效果 */
.virtual-table :deep(.el-table-v2__row:hover) {
  background-color: var(--primary-light) !important;
}

.virtual-table :deep(.el-table-v2__row-cell) {
  color: var(--text-secondary);
  font-size: var(--font-sm);
  border-right: 1px solid var(--border-light);
  padding: 0 12px;
}

.virtual-table :deep(.el-table-v2__row-cell:last-child) {
  border-right: none;
}

/* ========== 空状态样式 ========== */
.virtual-table :deep(.el-table-v2__empty) {
  background-color: var(--bg-main);
  color: var(--text-secondary);
}

/* ========== 操作按钮组 ========== */
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

/* ========== 滚动条样式 ========== */
.virtual-table :deep(.el-scrollbar__bar) {
  z-index: 10;
}

.virtual-table :deep(.el-table-v2__overlay) {
  z-index: 10;
}
</style>
