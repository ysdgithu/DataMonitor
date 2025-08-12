//该文件用于存储分发环境温度列表项
// 看板展示：数值+时间+曲线型折线图表示
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { EnvironmentData } from '../utils/type'

// 看板数据项类型
type BoardItem = {
  value: number
  timestamp: number;
  status: string
}

export const useEnvironmentDataStore = defineStore('environmentData', () => {

  // 看板数据（只保留最新一条）
  const boardList = ref<BoardItem[]>([])
  // 推送新数据
  function pushEnvironmentData(data: EnvironmentData) {
    const value = Number(data.value) // 确保 value 是数字类型
    const status = data.dataStatus || 'normal' // 提供默认状态
    const timestamp = data.timestamp

    // 更新看板（只保留每类最新一条）
    const idx = boardList.value.findIndex(item=>item.timestamp === timestamp)
    if (idx >= 0) {
      boardList.value[idx] = { value, timestamp, status }
    } else {
      boardList.value.push({ value, timestamp,status})
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
    pushEnvironmentData,
    clearAll
  }
})
