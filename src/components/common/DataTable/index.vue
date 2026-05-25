<template>
  <div class="data-table-wrapper">
    <!-- 表格 -->
    <el-table :data="data" v-loading="loading" highlight-current-row class="data-table">
      <el-table-column v-for="col in columns" :key="col.prop" :prop="col.prop" :label="col.label" :width="col.width" :min-width="col.minWidth">
        <template #default="{ row }">
          <!-- 自定义渲染 -->
          <template v-if="col.customRender">
            <RenderCell :render="col.customRender" :row="row" :value="row[col.prop]" />
          </template>

          <!-- 状态列 -->
          <StatusTag v-else-if="col.isStatus" :category="col.statusCategory || 'custom'" :value="row[col.prop]"
            size="small" />

          <!-- 时间列 -->
          <span v-else-if="col.isTime">
            {{ formatTime(row[col.prop]) }}
          </span>

          <!-- 操作列 -->
          <div v-else-if="col.isActions" class="actions">
            <template v-for="action in col.actions" :key="action.label">
              <el-button v-if="!action.show || action.show(row)" :type="action.type || 'primary'" link size="small"
                @click="action.onClick(row)">
                {{ action.label }}
              </el-button>
            </template>
          </div>

          <!-- 普通列 -->
          <span v-else>{{ row[col.prop] }}</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <Pagination v-if="showPagination" :current-page="currentPage" :page-size="pageSize" :total="total"
      @page-change="emit('page-change', $event)" @size-change="emit('size-change', $event)" />
  </div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue'
import StatusTag from '../statusTag.vue'
import Pagination from '../Pagination.vue'
import type { Props } from './types'

// 自定义渲染单元格组件
const RenderCell = defineComponent({
  props: {
    render: {
      type: Function,
      required: true
    },
    row: {
      type: Object,
      required: true
    },
    value: {
      type: [String, Number, Object, Boolean],
      default: null
    }
  },
  setup(props) {
    return () => props.render({ row: props.row, value: props.value })
  }
})

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showPagination: false,
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const emit = defineEmits<{
  'page-change': [page: number]
  'size-change': [size: number]
}>()

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
</script>

<style scoped>
.data-table-wrapper {
  width: 100%;
  overflow: hidden;
  border-radius: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.data-table {
  width: 100%;
  background-color: transparent;
}

.data-table :deep(.el-table),
.data-table :deep(.el-table__inner-wrapper),
.data-table :deep(.el-table__header-wrapper),
.data-table :deep(.el-table__body-wrapper) {
  background: transparent;
}

.data-table :deep(.el-table__header-wrapper),
.data-table :deep(.el-table__header) {
  background: linear-gradient(180deg, #fafcff 0%, #f4f8fd 100%);
}

.data-table :deep(.el-table__header th),
.data-table :deep(.el-table__body td) {
  border-color: #e5edf8;
  border-bottom-color: #e5edf8;
}

.data-table :deep(.el-table__header th) {
  background: linear-gradient(180deg, #fafcff 0%, #f4f8fd 100%);
  color: #5f6f85;
  font-weight: 600;
  font-size: 13px;
  height: 48px;
  padding: 0 14px;
}

.data-table :deep(.el-table__body tr) {
  background-color: #fff;
}

.data-table :deep(.el-table__body td) {
  color: #2b3648;
  font-size: 13px;
  height: 52px;
  padding: 0 14px;
}

.data-table :deep(.el-table__body tr:hover > td) {
  background-color: #f2f7ff !important;
}

.data-table :deep(.el-table__empty-block) {
  background-color: #fff;
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
</style>
