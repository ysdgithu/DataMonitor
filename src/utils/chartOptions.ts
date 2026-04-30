// chartOptions 工具函数负责:
// 提供各类图表的配置模板
// 数据格式转换
import { init, use ,type EChartsCoreOption} from 'echarts/core'
import { LineChart, BarChart, PieChart, MapChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 仅注册项目中使用的图表和组件
use([
  LineChart, BarChart, PieChart, MapChart,
  GridComponent, TooltipComponent, VisualMapComponent, LegendComponent,
  TitleComponent, DataZoomComponent,
  CanvasRenderer
])

export const createChartInstance = (dom: HTMLElement) => {
  return init(dom)
}

interface LineChartData {
  xAxis: string[]
  series: number[]
  status: string[];
}
const statusColorMap = {
  normal: '#00B42A', // 绿色：正常
  warning: '#FF7D00', // 黄色：警告
  error: '#F53F3F'   // 红色：异常
};

export const createLineChart = (data: LineChartData): EChartsCoreOption => {
  // 获取最新的N条数据
  const maxPoints = 20
  const startIndex = Math.max(0, data.xAxis.length - maxPoints)
  const displayXAxis = data.xAxis.slice(startIndex)
  const displaySeries = data.series.slice(startIndex)
  const displayStatus = data.status.slice(startIndex); // 截取对应状态

  return {
    xAxis: {
      show: true,
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
        return `时间：${param.axisValue}<br/>温度：${param.value.toFixed(2)}°C`
      }
    },
    series: [{
      type: 'line',
      data: displaySeries,
      smooth: false,
      showSymbol: true,
      symbolSize: 8,
      itemStyle: {
        color: (params: any) => {
          // 根据索引获取对应的数据点状态
          const pointStatus = displayStatus[params.dataIndex];
          // 返回对应颜色（默认正常色）
          return statusColorMap[pointStatus as keyof typeof statusColorMap] || '#DC143C';
        },
        //borderWidth: 0,
        // borderColor: '#fff' // 白色边框增强辨识度
      },
      lineStyle: {
        width: 2,
        // color: data.config?.lineColor
      },
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
}): EChartsCoreOption => {
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
        color: '#47484aff',
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
        color: '#47484aff'
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
      },
      markLine:{
        symbol: ['none', 'none'], // 隐藏线两端的箭头
        lineStyle: {
          color: '#FF7D00', // 阈值线颜色（默认红色）
          width: 2,
          type: 'dashed' // 虚线样式，更易区分
        },
        data: [
          {
            yAxis: 80, // 阈值线对应Y轴的数值
            name: '阈值线'
          }
        ]
      }
    }],
    backgroundColor: 'transparent'
  }
}

export const createPieChart = (config: {
  series: Array<{ name: string; value: number }>
}): EChartsCoreOption => ({
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
      color: '#313234ff'
    }
  }],
  backgroundColor: 'transparent'
})

export const createMapChart = (data: any): EChartsCoreOption => {
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
