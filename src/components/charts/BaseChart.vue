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
// 导入按需引入的图表创建函数
import { createChartInstance } from '../../utils/chartOptions'
import { type EChartsType } from 'echarts/core'


const props = defineProps<{
  options: EChartsOption
  loading?: boolean
  highFrequency?: boolean // 【新增】高频模式标志
  dataOnly?: boolean // 【新增】是否只更新数据部分（避免清空重绘）
}>()


const chartRef = ref<HTMLElement | null>(null)
let chart: EChartsType | null = null
let isInitialized = false // 【新增】标记图表是否已初始化

let rafLoopId: number | null = null // 固定频率raf
let latestOptionsQueue: EChartsOption[] = [] // 高频模式下的队列

// 初始化图表
const initChart = () => {
  if (chartRef.value && !chart) {
    chart = createChartInstance(chartRef.value)
    // 【优化】高频模式下关闭动画
    const initialOptions = props.highFrequency
      ? { ...props.options, animation: false }
      : props.options
    chart.setOption(initialOptions)
    isInitialized = true // 标记已初始化
  }
}



// 固定频率 RAF 循环（60FPS），高频模式下用队列保证顺序渲染
const startRAFLoop = () => {
  const loop = () => {
    if (chart && latestOptionsQueue.length > 0) {
      const nextOptions = latestOptionsQueue.shift()
      if (nextOptions) {
        try {
          // 【新增】dataOnly 模式：只更新数据部分，避免清空重绘
          if (props.dataOnly && isInitialized) {
            // 提取数据部分
            const dataOnlyOptions: any = {}

            // 更新 xAxis 数据
            if (nextOptions.xAxis) {
              const xAxisConfig = Array.isArray(nextOptions.xAxis) ? nextOptions.xAxis[0] : nextOptions.xAxis
              if (xAxisConfig && (xAxisConfig as any).data) {
                dataOnlyOptions.xAxis = { data: (xAxisConfig as any).data }
              }
            }

            // 更新 series 数据
            if (nextOptions.series && Array.isArray(nextOptions.series)) {
              dataOnlyOptions.series = nextOptions.series.map((s: any) => ({
                data: s.data,
                // 保留状态相关的配置
                itemStyle: s.itemStyle
              }))
            }

            chart.setOption(dataOnlyOptions, {
              notMerge: false, // 增量合并
              // lazyUpdate: true,
              // silent: true
            })
          } else {
            // 正常模式：完整更新
            chart.setOption(nextOptions, {
              notMerge: false,
              // lazyUpdate: true,
              // silent: true,
              replaceMerge: ['series'] // 只替换series，提升性能
            })
          }
        } catch (error) {
          console.error('图表更新失败:', error)
        }
      }
    }
    rafLoopId = requestAnimationFrame(loop)
  }
  rafLoopId = requestAnimationFrame(loop)
}

const stopRAFLoop = () => {
  if (rafLoopId !== null) {
    cancelAnimationFrame(rafLoopId)
    rafLoopId = null
  }
  latestOptionsQueue = []
}


// 防抖处理图表更新（低频模式，只用防抖，不用raf）
const updateChartDebounced = debounce((newOptions: EChartsOption) => {
  if (chart) {
    // 【新增】dataOnly 模式：只更新数据部分
    if (props.dataOnly && isInitialized) {
      const dataOnlyOptions: any = {}

      // 更新 xAxis 数据
      if (newOptions.xAxis) {
        const xAxisConfig = Array.isArray(newOptions.xAxis) ? newOptions.xAxis[0] : newOptions.xAxis
        if (xAxisConfig && (xAxisConfig as any).data) {
          dataOnlyOptions.xAxis = { data: (xAxisConfig as any).data }
        }
      }

      // 更新 series 数据
      if (newOptions.series && Array.isArray(newOptions.series)) {
        dataOnlyOptions.series = newOptions.series.map((s: any) => ({
          data: s.data,
          itemStyle: s.itemStyle
        }))
      }

      chart.setOption(dataOnlyOptions, {
        notMerge: false,
        lazyUpdate: true,
        silent: true
      })
    } else {
      // 正常模式：完整更新
      chart.setOption(newOptions, {
        notMerge: false,
        lazyUpdate: true,
        silent: true,
        replaceMerge: ['series']
      })
    }
  }
}, 100)



// 根据模式选择更新策略
const updateChart = (newOptions: EChartsOption) => {
  if (props.highFrequency) {
    // 高频模式：入队，RAF循环顺序渲染
    latestOptionsQueue.push(newOptions)
  } else {
    // 低频模式：只用防抖
    updateChartDebounced(newOptions)
  }
}

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
  if (props.highFrequency) {
    startRAFLoop()
  }
})



onUnmounted(() => {
  // 清理固定频率RAF
  stopRAFLoop()
  // 清理防抖
  updateChartDebounced.cancel()
  chart?.dispose()
  window.removeEventListener('resize', handleResize)
  chart = null
})


// 支持动态切换高频/低频模式，切换时清理防抖和RAF
watch(
  () => props.highFrequency,
  (val) => {
    if (val) {
      updateChartDebounced.cancel()
      startRAFLoop()
    } else {
      stopRAFLoop()
      updateChartDebounced.cancel()
    }
  }
)
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
