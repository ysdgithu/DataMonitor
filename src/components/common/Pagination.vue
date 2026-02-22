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
  gap: var(--spacing-sm);
  color: var(--text-secondary);
  font-size: var(--font-sm);
  margin-top: var(--spacing-base);
  padding: var(--spacing-base);
  justify-content: flex-end;
}

.pagination-total {
  margin-right: var(--spacing-sm);
  color: var(--text-secondary);
}

.pagination-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
  user-select: none;
}

.pagination-item:hover:not(.active):not(.disabled):not(.pagination-ellipsis) {
  color: var(--primary);
  background-color: var(--primary-light);
}

.pagination-item.active {
  background-color: var(--primary-light);
  color: var(--primary);
  font-weight: 500;
}

.pagination-item.disabled {
  color: var(--text-disabled);
  cursor: not-allowed;
}

.pagination-ellipsis {
  cursor: default;
}

.pagination-ellipsis:hover {
  color: var(--text-secondary);
  background-color: transparent;
}
</style>
