//该文件用于存储分发环境温度列表项
// 看板展示：数值+时间+曲线型折线图表示
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { EnvironmentData } from '../utils/type'

// 【优化】限制数据点数量，防止内存泄漏
const MAX_DATA_POINTS = 100

// 看板数据项类型
type BoardItem = {
  value: number
  timestamp: number;
  status: string
}

export const useEnvironmentDataStore = defineStore('environmentData', () => {

  // 看板数据（限制最多 MAX_DATA_POINTS 条）
  const boardList = ref<BoardItem[]>([])

  // 推送新数据
  function pushEnvironmentData(data: EnvironmentData) {
    const value = Number(data.value) // 确保 value 是数字类型
    const status = data.dataStatus || 'normal' // 提供默认状态
    const timestamp = data.timestamp

    // 【优化】检查是否已存在相同时间戳的数据
    const idx = boardList.value.findIndex(item => item.timestamp === timestamp)
    if (idx >= 0) {
      // 更新已有数据
      boardList.value[idx] = { value, timestamp, status }
    } else {
      // 添加新数据
      boardList.value.push({ value, timestamp, status })

      // 【优化】限制数组长度，删除最旧的数据
      if (boardList.value.length > MAX_DATA_POINTS) {
        // 按时间戳排序，删除最旧的数据
        boardList.value.sort((a, b) => a.timestamp - b.timestamp)
        boardList.value.shift()
      }
    }
  }

  // 【优化】批量推送数据
  function batchPushEnvironmentData(dataList: EnvironmentData[]) {
    // 批量添加数据，减少响应式触发次数
    dataList.forEach(data => {
      const value = Number(data.value)
      const status = data.dataStatus || 'normal'
      const timestamp = data.timestamp

      // 检查是否已存在相同时间戳的数据
      const idx = boardList.value.findIndex(item => item.timestamp === timestamp)
      if (idx >= 0) {
        boardList.value[idx] = { value, timestamp, status }
      } else {
        boardList.value.push({ value, timestamp, status })
      }
    })

    // 【优化】批量处理后统一限制数组长度
    if (boardList.value.length > MAX_DATA_POINTS) {
      boardList.value.sort((a, b) => a.timestamp - b.timestamp)
      boardList.value = boardList.value.slice(-MAX_DATA_POINTS)
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
    batchPushEnvironmentData, // 【新增】批量推送接口
    clearAll
  }
})
