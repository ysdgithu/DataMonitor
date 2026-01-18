// 该文件用于请求量数据柱状图
// 需要展示请求量，请求时间，异常标注
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DeviceTelemetryData } from '../utils/type'

// 【优化】限制数据点数量，防止内存泄漏
const MAX_DATA_POINTS = 100

// 展示数据项定义
type BoardItem = {
  value: number
  timestamp: number
  status: string
}

//创建store
export const useDeviceTelemetryDataStore = defineStore('DeviceTelemetryData', () => {

    //看板数据实例化（限制最多 MAX_DATA_POINTS 条）
    const boardData = ref<BoardItem[]>([])

    //推送更新数据
    function pushDeviceTelemetryData(data: DeviceTelemetryData) {
        boardData.value.push({
            value: data.value,
            timestamp: data.timestamp,
            status: data.dataStatus || 'normal'
        })

        // 【优化】限制数组长度，删除最旧的数据
        if (boardData.value.length > MAX_DATA_POINTS) {
            boardData.value.shift()
        }
    }

    // 【优化】批量推送数据
    function batchPushDeviceTelemetryData(dataList: DeviceTelemetryData[]) {
        // 批量添加数据，减少响应式触发次数
        dataList.forEach(data => {
            boardData.value.push({
                value: data.value,
                timestamp: data.timestamp,
                status: data.dataStatus || 'normal'
            })
        })

        // 【优化】批量处理后统一限制数组长度
        if (boardData.value.length > MAX_DATA_POINTS) {
            boardData.value = boardData.value.slice(-MAX_DATA_POINTS)
        }
    }

    //返回接口
    return {
        boardData,
        pushDeviceTelemetryData,
        batchPushDeviceTelemetryData // 【新增】批量推送接口
    }

})
