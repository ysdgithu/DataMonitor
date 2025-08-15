// 该文件用于请求量数据柱状图
// 需要展示请求量，请求时间，异常标注
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DeviceTelemetryData } from '../utils/type'


// 展示数据项定义
type BoardItem = {
  value: number
  timestamp: number
  status: string
}

//创建store
export const useDeviceTelemetryDataStore = defineStore('DeviceTelemetryData', () => { 

    //看板数据实例化
    const boardData = ref<BoardItem[]>([])
    //推送更新数据
    function pushDeviceTelemetryData(data:DeviceTelemetryData){
        boardData.value.push({
            value: data.value,
            timestamp: data.timestamp,
            status: data.dataStatus || 'normal'
        })
    }
    //返回接口
    return {
        boardData,
        pushDeviceTelemetryData
    }

})