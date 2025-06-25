<template>
  <el-dialog
    v-model="dialogVisible"
    title="历史数据查询"
    width="80%"
    :destroy-on-close="true"
    class="history-dialog"
  >
    <!-- 时间选择器 -->
    <div class="dialog-header">
      <el-date-picker
        v-model="timeRange"
        type="datetimerange"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        format="YYYY-MM-DD HH:mm"
        value-format="X"
        :default-time="[
          new Date(2000, 1, 1, 0, 0, 0),
          new Date(2000, 1, 1, 23, 59, 59),
        ]"
        @change="handleTimeChange"
      />
      <el-button type="primary" @click="fetchData">查询</el-button>
    </div>

    <!-- 数据表格 -->
    <el-table
      v-loading="store.loading"
      :data="currentPageData"
      style="width: 100%"
      height="450px"
    >
      <el-table-column label="时间" width="180">
        <template #default="{ row }">
          {{ formatTimestamp(row.timestamp) }}
        </template>
      </el-table-column>
      <el-table-column label="类型" prop="type" width="120"/>
      <el-table-column label="数值">
        <template #default="{ row }">
          {{ formatValue(row) }}
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页器 -->
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="totalItems"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next"
      class="dialog-pagination"
      background
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useChartStore } from '../../stores/chart'
import dayjs from 'dayjs'

const props = defineProps<{
  modelValue: boolean
  type: string
}>()

const emit = defineEmits(['update:modelValue'])

const store = useChartStore()
const timeRange = ref<[number, number]>([
  dayjs().subtract(1, 'hour').unix(),
  dayjs().unix()
])
const currentPage = ref(1)
const pageSize = ref(20)

// 计算分页数据
const currentPageData = computed(() => {
  const data = store.metricsData[props.type] || []
  const start = (currentPage.value - 1) * pageSize.value
  return data.slice(start, start + pageSize.value)
})

const totalItems = computed(() => 
  (store.metricsData[props.type] || []).length
)

// 格式化时间戳
const formatTimestamp = (timestamp: number) => {
  return dayjs.unix(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

// 格式化数值
const formatValue = (row: any) => {
  if (row.type === 'device_type') {
    return `${row.deviceType}: ${row.count}台`
  } else if (row.type === 'request_count') {
    return `${row.count}次`
  } else {
    return `${row.value}${getUnit(row.type)}`
  }
}

// 获取单位
const getUnit = (type: string) => {
  switch (type) {
    case 'cpu_usage':
      return '%'
    case 'memory_usage':
      return '%'
    case 'latency':
      return 'ms'
    default:
      return ''
  }
}

// 处理时间变化
const handleTimeChange = ([start, end]: [number, number]) => {
  if (start && end) {
    timeRange.value = [Number(start), Number(end)]
  }
}

// 获取数据
const fetchData = async () => {
  if (!timeRange.value) return
  
  const [start, end] = timeRange.value
  try {
    await store.fetchMetricData({
      type: props.type,
      timestamp_gte: Number(start),
      timestamp_lte: Number(end)
    })
    currentPage.value = 1 // 重置到第一页
  } catch (error) {
    console.error('获取数据失败:', error)
  }
}

// 添加监听器以响应数据变化
watch(
  () => store.metricsData[props.type],
  (newData) => {
    if (newData) {
      console.log('数据已更新:', newData.length)
    }
  }
)

// 控制弹窗显示
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 初始加载
fetchData()
</script>

<style scoped>
.history-dialog {
  :deep(.el-dialog__body) {
    padding: 20px;
  }
}

.dialog-header {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.dialog-pagination {
  margin-top: 20px;
  justify-content: flex-end;
  display: flex;
}

:deep(.el-table) {
  background-color: #243142;
  --el-table-border-color: #334155;
  --el-table-header-bg-color: #1A2333;
  --el-table-tr-bg-color: #243142;
  color: #E5E7EB;
}

:deep(.el-table th) {
  background-color: #1A2333;
  color: #E5E7EB;
}

:deep(.el-pagination) {
  --el-pagination-button-bg-color: #243142;
  --el-pagination-hover-color: #4A90E2;
  --el-text-color-primary: #E5E7EB;
}
</style>