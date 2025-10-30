<template>
  <div ref="chartRef" :style="{ width: '100%', height: '100%' }">
    <div v-if="loading" class="chart-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import type { EChartsOption } from 'echarts'
import { Loading } from '@element-plus/icons-vue'
import { debounce } from 'lodash-es'
// 导入按需引入的图表创建函数（根据你的chartOptions.ts路径调整）
import { createChartInstance } from '../../utils/chartOptions'
import { type EChartsType } from 'echarts/core'


const props = defineProps<{
  options: EChartsOption
  loading?: boolean
}>()

const chartRef = ref<HTMLElement | null>(null)
let chart: EChartsType | null = null

// 初始化图表
const initChart = () => {
  if (chartRef.value && !chart) {
    chart = createChartInstance(chartRef.value)
    chart.setOption(props.options)
  }
}

// 防抖处理图表更新，100ms内多次更新只执行一次
const updateChart = debounce((newOptions: EChartsOption) => {
  if (chart) {
    // 正确的延迟更新写法（第三个参数为boolean）
    chart.setOption(newOptions, false, true)
  }
}, 100)

// 只保留一个watch监听
watch(
  () => props.options,
  (newVal) => {
    if (newVal) {
      updateChart(newVal)
    }
  },
  { deep: false } // 关闭深度监听优化性能
)

// 监听容器大小变化
const handleResize = () => {
  chart?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  chart?.dispose()
  window.removeEventListener('resize', handleResize)
  chart = null
})
</script>


<style scoped>
.chart-loading {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 35, 51, 0.7);
  position: absolute;
  top: 0;
  left: 0;
}
</style>