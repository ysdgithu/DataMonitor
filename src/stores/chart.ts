import { defineStore } from 'pinia'
import axios from 'axios'
import type { 
  BaseMetric,
  ValueMetric, 
  DeviceTypeMetric, 
  RequestCountMetric
} from '../utils/metrics'
import { METRIC_TYPES } from '../utils/metrics'

interface MetricsState {
  metricsData: Record<string, any[]>
  realtimeData: Array<[number, number]> // 添加实时数据数组
  loading: boolean
  error: string | null
  isMonitoring: boolean  // 添加监控状态
}
// 限制时间范围在数据集范围内
const DATA_START_TIME = 1620000000  // 2021-05-03
const DATA_END_TIME = 1620086400    // 2021-05-04
export const useChartStore = defineStore('chart', {
  state: (): MetricsState => ({
    metricsData: {},
    realtimeData: [], // 初始化实时数据数组
    loading: false,
    error: null,
    isMonitoring: false
  }),

  actions: {
    async fetchMetricData(params: { 
      type: string, 
      timestamp_gte: number,  // 修改参数名称
      timestamp_lte: number   // 修改参数名称
    }) {
      if (params.timestamp_gte > DATA_END_TIME ){
        params.timestamp_gte=DATA_START_TIME
      }
      try {
        const response = await axios.get('/metrics', {
          baseURL: 'http://localhost:3000',
          params
        })
        this.metricsData = {
          ...this.metricsData,
          [params.type]: response.data
        }
        console.log('获取数据成功', response.data[0])
        //if (response.data[0].)
        this.loading = true
      } catch (err) {
        this.error = `获取${params.type}数据失败`
        console.error(err)
      } finally {
        this.loading = false
      }
    },

    // 添加实时数据处理方法
    updateRealtimeData(data: { timestamp: number; value: number }) {
      this.realtimeData.push([data.timestamp, data.value])
      // 保持最新的20个数据点
      if (this.realtimeData.length > 20) {
        this.realtimeData.shift()
      }
    },

    // 清除实时数据
    clearData() {
      this.realtimeData = []
    },
    // 添加控制方法
    startMonitoring() {
      this.isMonitoring = true
    },
    stopMonitoring() {
      this.isMonitoring = false
    }
  },

  getters: {
    // 添加实时数据 getter
    chartData: (state) => state.realtimeData,

    // 设备类型数据 - 饼图
    deviceTypeChartData: (state) => {
      const data = state.metricsData[METRIC_TYPES.DEVICE_TYPE] || []
      const latestData = new Map<string, DeviceTypeMetric>()
      
      data.forEach((item: DeviceTypeMetric) => {
        const existing = latestData.get(item.deviceType)
        if (!existing || item.timestamp > existing.timestamp) {
          latestData.set(item.deviceType, item)
        }
      })
      
      return Array.from(latestData.values()).map(item => ({
        name: item.deviceType,
        value: item.count
      }))
    },

    // 请求量数据 - 柱状图
    requestCountChartData: (state) => {
      const data = state.metricsData[METRIC_TYPES.REQUEST_COUNT] || []
      return {
        xAxis: data.map(item => new Date(item.timestamp * 1000).toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        })),
        values: data.map(item => item.count)
     }
    },
  }
})