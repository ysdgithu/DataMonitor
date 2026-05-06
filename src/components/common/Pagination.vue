<template>
  <div class="pagination-wrapper">
    <!-- 总条数 -->
    <span class="pagination-total">共 {{ total }} 条</span>

    <!-- 上一页 -->
    <div :class="['pagination-item', { disabled: currentPage <= 1 }]" @click="handlePrev">
      &lt;
    </div>

    <!-- 页码 -->
    <div v-for="(page, index) in visiblePages" :key="index"
      :class="['pagination-item', { active: page === currentPage, 'pagination-ellipsis': page === -1 }]"
      @click="handlePageClick(page)">
      {{ page === -1 ? '…' : page }}
    </div>

    <!-- 下一页 -->
    <div :class="['pagination-item', { disabled: currentPage >= totalPages }]" @click="handleNext">
      &gt;
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  currentPage?: number
  pageSize?: number
  total: number
  pageSizes?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  currentPage: 1,
  pageSize: 10,
  pageSizes: () => [10, 20, 50, 100]
})

const emit = defineEmits<{
  'page-change': [page: number]
  'size-change': [size: number]
}>()

// 总页数
const totalPages = computed(() => Math.ceil(props.total / props.pageSize))

// 可见的页码列表
const visiblePages = computed(() => {
  const pages: number[] = []
  const current = props.currentPage
  const total = totalPages.value

  if (total <= 7) {
    // 总页数 ≤ 7，全部显示
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // 总页数 > 7，显示部分页码
    if (current <= 4) {
      // 当前页在前面：1 2 3 4 5 … 90
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push(-1)
      pages.push(total)
    } else if (current >= total - 3) {
      // 当前页在后面：1 … 86 87 88 89 90
      pages.push(1)
      pages.push(-1)
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      // 当前页在中间：1 … 50 51 52 … 90
      pages.push(1)
      pages.push(-1)
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push(-1)
      pages.push(total)
    }
  }

  return pages
})

// 上一页
const handlePrev = () => {
  if (props.currentPage > 1) {
    emit('page-change', props.currentPage - 1)
  }
}

// 下一页
const handleNext = () => {
  if (props.currentPage < totalPages.value) {
    emit('page-change', props.currentPage + 1)
  }
}

// 点击页码
const handlePageClick = (page: number) => {
  if (page === -1 || page === props.currentPage) return
  emit('page-change', page)
}
</script>

<style scoped>
.pagination-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6f7d92;
  font-size: 12px;
  margin-top: 16px;
  padding: 0;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.pagination-total {
  margin-right: 8px;
  color: #6f7d92;
}

.pagination-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border-radius: 10px;
  cursor: pointer;
  color: #516079;
  transition: all 0.2s;
  user-select: none;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.72);
}

.pagination-item:hover:not(.active):not(.disabled):not(.pagination-ellipsis) {
  color: #1f3356;
  background-color: rgba(79, 124, 255, 0.08);
  border-color: rgba(79, 124, 255, 0.2);
}

.pagination-item.active {
  background-color: rgba(79, 124, 255, 0.14);
  color: #1f3356;
  font-weight: 500;
  border-color: rgba(79, 124, 255, 0.28);
}

.pagination-item.disabled {
  color: #94a3b8;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.48);
}

.pagination-ellipsis {
  cursor: default;
}

.pagination-ellipsis:hover {
  color: #516079;
  background-color: rgba(255, 255, 255, 0.72);
  border-color: rgba(148, 163, 184, 0.18);
}
</style>
