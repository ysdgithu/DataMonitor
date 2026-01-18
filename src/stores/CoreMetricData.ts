//该文件用于存储分发核心数据列表项
//看板展示：名称+数值+状态

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CoreMetricData } from '../utils/type'

// 看板数据项类型
type BoardItem = {
  name: string
  value: string
  status: string
}

export const useCoreMetricStore = defineStore('coreMetric', () => {
  // 看板数据（只保留最新一条）
  const boardList = ref<BoardItem[]>([])

  //  'cpu' | 'memory' | 'network' | 'online' => 'CPU使用率', '内存使用率', '网络延迟', '设备在线率'
  // 指标名称映射
  const metricNameMap: Record<string, string> = {
    'cpu': 'CPU使用率',
    'memory': '内存使用率',
    'network': '网络延迟',
    'online': '设备在线率'
  }
  // 指标单位
  const metricUnitMap: Record<string, string> = {
    'cpu': '%',
    'memory': '%',
    'network': 'ms',
    'online': '%'
  }

  // 推送新数据
  function pushMetricData(data: CoreMetricData) {
    const name = metricNameMap[data.category] || data.category  //有就按照映射，没有就按照原来的名字
    const value = data.value.toFixed(1) + metricUnitMap[data.category]
    const status = data.dataStatus || 'normal'

    // 更新看板（只保留每类最新一条）
    const idx = boardList.value.findIndex(item => item.name === name)
    if (idx >= 0) {
      boardList.value[idx] = { name, value, status }
    } else {
      boardList.value.push({ name, value, status })
    }
  }

  // 【高频优化】批量推送数据
  function batchPushMetricData(dataList: CoreMetricData[]) {
    // 使用 Map 去重，只保留每个类别的最新数据
    const latestMap = new Map<string, BoardItem>()

    dataList.forEach(data => {
      const name = metricNameMap[data.category] || data.category
      const value = data.value.toFixed(1) + metricUnitMap[data.category]
      const status = data.dataStatus || 'normal'
      latestMap.set(name, { name, value, status })
    })

    // 一次性更新所有数据
    latestMap.forEach((item, name) => {
      const idx = boardList.value.findIndex(b => b.name === name)
      if (idx >= 0) {
        boardList.value[idx] = item
      } else {
        boardList.value.push(item)
      }
    })
  }

  // 清空
  function clearAll() {
    boardList.value = []
  }

  // 看板展示
  const boardDisplay = computed(() => boardList.value)

  return {
    boardList: boardDisplay,
    pushMetricData,
    batchPushMetricData, // 【新增】批量推送接口
    clearAll
  }
})
