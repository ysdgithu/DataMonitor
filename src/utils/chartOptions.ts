import type { EChartsOption } from 'echarts'
// chartOptions 工具函数负责:
// 提供各类图表的配置模板
// 数据格式转换

interface LineChartConfig {
  smooth?: boolean
  lineColor?: string
  areaColor?: string
  maxPoints?: number // 添加最大显示点数配置
}

interface LineChartData {
  xAxis: string[]
  series: number[]
  config?: LineChartConfig
}

export const createLineChart = (data: LineChartData): EChartsOption => {
  // 获取最新的N条数据
  const maxPoints = data.config?.maxPoints || 20
  const startIndex = Math.max(0, data.xAxis.length - maxPoints)
  const displayXAxis = data.xAxis.slice(startIndex)
  const displaySeries = data.series.slice(startIndex)

  return {
    xAxis: {
      show: false,
      type: 'category',
      boundaryGap: false,
      data: displayXAxis,
      axisLabel: {
        interval: 'auto',
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      top: '5%',
      bottom: '15%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const param = params[0]
        return `时间：${param.axisValue}<br/>温度：${param.value}°C`
      }
    },
    series: [{
      type: 'line',
      data: displaySeries,
      smooth: data.config?.smooth ?? false,
      showSymbol: false,
      lineStyle: {
        width: 2,
        color: data.config?.lineColor
      },
      areaStyle: data.config?.areaColor ? {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: data.config.areaColor
          }, {
            offset: 1,
            color: 'rgba(255, 255, 255, 0)'
          }]
        }
      } : undefined
    }]
  }
}

export const createBarChart = (config: {
  series: Array<number>
  xAxis: {
    type: string
    data: string[]
    axisLabel?: any
  }
  maxPoints?: number
}): EChartsOption => {
  const maxPoints = config.maxPoints || 20
  const data = Array.isArray(config.series) ? config.series : []
  const startIndex = Math.max(0, data.length - maxPoints)
  const displayData = data.slice(startIndex)
  const displayXAxis = config.xAxis.data.slice(startIndex)

  // 计算数据范围
  const min = Math.min(...displayData)
  const max = Math.max(...displayData)
  const range = max - min
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        const param = params[0]
        return `时间：${param.axisValue}<br/>请求量：${param.value}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: displayXAxis,
      axisLabel: {
        color: '#E5E7EB',
        interval: 0,
        rotate: 45,
        ...config.xAxis?.axisLabel
      }
    },
    yAxis: {
      type: 'value',
      min: Math.floor(min - range * 0.1), // 扩展y轴范围
      max: Math.ceil(max + range * 0.1),
      splitNumber: 5, // 控制分割段数
      axisLabel: {
        color: '#E5E7EB'
      }
    },
    series: [{
      type: 'bar',
      data: displayData,
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: '#60A5FA' // 渐变开始颜色
          }, {
            offset: 1,
            color: '#3B82F6' // 渐变结束颜色
          }]
        }
      },
      barWidth: '60%', // 控制柱子宽度
      emphasis: {
        itemStyle: {
          color: '#2563EB' // 高亮颜色
        }
      }
    }],
    backgroundColor: 'transparent'
  }
}

export const createPieChart = (config: {
  series: Array<{ name: string; value: number }>
}): EChartsOption => ({
  tooltip: {
    trigger: 'item'
  },
  series: [{
    type: 'pie',
    radius: '60%',
    data: config.series,
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
      }
    },
    label: {
      color: '#E5E7EB'
    }
  }],
  backgroundColor: 'transparent'
})

export const createMapChart = (data: any): EChartsOption => {
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}'
    },
    visualMap: {
      min: 0,
      max: 100,
      text: ['高', '低'],
      realtime: false,
      calculable: true,
      inRange: {
        color: ['#D5E8FC', '#3B82F6']
      }
    },
    // grid: {
    //   top: '5%',
    //   bottom: '5%',  // 减小底部边距
    //   containLabel: true
    // },
    series: [
      {
        name: '设备分布',
        type: 'map',
        map: 'china',
        label: {
            show: true,
            fontSize: 10,
            distance: 5,
            color:'#E5E7EB'
          },
        // aspectScale: 0.85,  // 调整地图长宽比
        zoom: 1.2,  // 放大地图
        roam: true,  // 允许缩放和平移
        layoutCenter: ['50%', '50%'],  // 地图中心位置
        data: data.series
      }
    ]
  }
}
