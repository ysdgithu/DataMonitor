<template>
  <div class="chart-container">
    <div class="connection-status" :class="{ connected: isConnected }">
      {{ isConnected ? '已连接' : '未连接' }}
      <span v-if="!isConnected">(重试次数: {{ retryCount }})</span>
    </div>
    <BaseChart :options="chartOptions" style="height: 220px;"/>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import BaseChart from './BaseChart.vue'
import { createLineChart } from '../../utils/chartOptions'
import { useWebSocket } from '../../utils/useWebSocket'
import { useChartStore } from '../../stores/chart'

const store = useChartStore()

// WebSocket连接
const { isConnected, retryCount, lastMessage, connect, disconnect } = useWebSocket({
  url: 'ws://localhost:8080',
  maxRetries: 3,
  retryDelay: 1000
})

// 监听 WebSocket 数据更新,只在监控状态开启时更新数据
watch(lastMessage, (newMessage) => {
  if (newMessage && store.isMonitoring) {
    store.updateRealtimeData({
      timestamp: Date.now(),
      value: newMessage.value
    })
  }
})

// 监听监控状态变化
watch(() => store.isMonitoring, (isMonitoring) => {
  if (!isConnected.value && isMonitoring) {
    // 如果未连接且需要监控,则连接
    connect()
  }
})

// 处理图表数据
const formatChartData = computed(() => {
  const data = store.chartData || []
  const times = data.map(item => 
    new Date(item[0]).toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  )
  const values = data.map(item => item[1])
  
  return {
    xAxis: times,
    series: values
  }
})

// 图表配置
const chartOptions = computed(() => createLineChart({
  xAxis: formatChartData.value.xAxis,
  series: formatChartData.value.series,
  config: {
    smooth: true,
    lineColor: '#409EFF',
    areaColor: 'rgba(64,158,255,0.2)',
    maxPoints: 20
  }
}))

onMounted(() => {
  store.clearData()
  // 只在开启监控时连接
  if (store.isMonitoring) {
    connect()
  }
})

onUnmounted(() => {
  disconnect()
  store.clearData()
})
</script>

<style scoped>
.chart-container {
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.connection-status {
  padding: 4px 16px;
  margin-bottom: 10px;
  border-radius: 4px;
  background-color: #f56c6c;
  color: white;
  font-size: 14px;
}

.connection-status.connected {
  background-color: #67c23a;
}
</style>