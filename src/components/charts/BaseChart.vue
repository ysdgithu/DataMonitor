<template>
  <div ref="chartRef" :style="{ width: '100%', height: '100%' }">
    <div v-if="loading" class="chart-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps<{
  options: EChartsOption
  loading?: boolean
}>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

// 初始化图表
const initChart = () => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    chart.setOption(props.options)
  }
}

// 监听配置变化
watch(() => props.options, (newVal) => {
  chart?.setOption(newVal, true) // true 表示不合并配置
}, { deep: true })

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