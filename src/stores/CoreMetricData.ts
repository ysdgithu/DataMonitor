//该文件用于存储分发核心数据列表项
//看板展示：名称+数值+状态

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CoreMetricData } from '../utils/type'

type BoardItem = {
  name: string
  value: number
  status: string
}

export const useCoreMetricStore = defineStore('coreMetric', () => {
  // 看板数据（只保留最新一条）
  const boardList = ref<BoardItem[]>([])

  // 推送新数据
  function pushMetricData(data: CoreMetricData) {
    const name = data.category
    const value = data.value
    const status = data.dataStatus || 'normal'

    // 更新看板（只保留每类最新一条）
    const idx = boardList.value.findIndex(item => item.name === name)
    if (idx >= 0) {
      boardList.value[idx] = { name, value, status }
    } else {
      boardList.value.push({ name, value, status })
    }
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
    clearAll
  }
})
