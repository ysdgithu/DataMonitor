/**
 * 告警详情格式化工具
 * 把后端返回的 details JSON 解析成中文结构化文本
 */

// 设备名称映射
const DEVICE_NAME_MAP: Record<string, string> = {
  '1001': '调配罐',
  '1002': '洗瓶机',
  '1003': '灌装机',
  '1004': '封盖机',
  '1005': '贴标机'
}

// 参数名称映射
const PARAM_NAME_MAP: Record<string, string> = {
  temp: '温度',
  level: '液位',
  current: '电流',
  ph: 'pH值',
  fill_volume: '灌装量',
  pressure: '压力',
  speed: '速度'
}

/**
 * 从参数路径中提取参数名
 * 例如 "payload.fill_volume.value" -> "fill_volume"
 */
function extractParamName(paramPath: string): string {
  const parts = paramPath.split('.')
  // payload.xxx.value -> xxx
  if (parts.length >= 2 && parts[0] === 'payload') {
    return parts[1]
  }
  return paramPath
}

/**
 * 格式化时间戳
 */
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 格式化告警详情
 * @param event 后端返回的 AlarmEvent 对象
 * @returns 结构化中文描述
 */
export function formatAlarmDetail(event: {
  deviceId: string
  deviceType: string
  parameterName?: string
  currentValue?: number
  threshold?: string
  message?: string
  triggerTime?: number
  details?: any
}): string {
  const deviceName = DEVICE_NAME_MAP[event.deviceId] || event.deviceType || event.deviceId
  const paramName = PARAM_NAME_MAP[event.parameterName || ''] || event.parameterName || '未知参数'
  const details = event.details || {}

  const lines: string[] = []

  // 【告警摘要】
  lines.push('【告警摘要】')
  lines.push(`设备: ${deviceName} (${event.deviceId})`)
  lines.push(`参数: ${paramName}`)
  if (event.currentValue !== undefined) {
    lines.push(`当前值: ${event.currentValue}`)
  }
  if (event.threshold) {
    lines.push(`正常范围: ${event.threshold}`)
  }

  // 【窗口统计】- duration 类型告警
  if (details.anomalyCount !== undefined && details.windowDataCount !== undefined) {
    lines.push('')
    lines.push('【窗口统计】')
    if (details.duration !== undefined) {
      lines.push(`检测窗口: ${(details.duration / 1000).toFixed(1)} s`)
    }
    lines.push(`窗口数据: ${details.windowDataCount} 个点`)
    lines.push(`异常次数: ${details.anomalyCount} 次`)
    const ratio = details.windowDataCount > 0
      ? ((details.anomalyCount / details.windowDataCount) * 100).toFixed(1)
      : '0.0'
    lines.push(`异常占比: ${ratio} %`)
    if (details.timeSpan !== undefined) {
      lines.push(`首尾跨度: ${(details.timeSpan / 1000).toFixed(1)} s`)
    }
  }

  // 【异常详情】- threshold/threshold_range 类型
  if (details.value !== undefined || details.paramValue !== undefined) {
    const val = details.value ?? details.paramValue
    lines.push('')
    lines.push('【异常详情】')
    lines.push(`异常值: ${val}`)
    if (details.min !== undefined && details.max !== undefined) {
      lines.push(`正常范围: ${details.min} ~ ${details.max}`)
      const diff = val < details.min
        ? `低于下限 ${(details.min - val).toFixed(2)}`
        : val > details.max
          ? `高于上限 ${(val - details.max).toFixed(2)}`
          : ''
      if (diff) lines.push(`偏差: ${diff}`)
    } else if (details.operator && details.threshold !== undefined) {
      lines.push(`条件: ${details.operator} ${details.threshold}`)
    }
  }

  // 【时间信息】
  lines.push('')
  lines.push('【时间信息】')
  if (details.firstAnomalyTime) {
    lines.push(`首次异常: ${formatTime(details.firstAnomalyTime)}`)
  }
  if (details.lastAnomalyTime) {
    lines.push(`末次异常: ${formatTime(details.lastAnomalyTime)}`)
  }
  if (event.triggerTime) {
    lines.push(`触发时间: ${formatTime(event.triggerTime)}`)
  }

  return lines.join('\n')
}

/**
 * 从诊断任务 detail 字符串中提取 JSON 数据
 * 后端格式：文本摘要 + "详细数据: {JSON}"
 */
export function parseTaskDetail(detail: string): { summary: string; detailData?: any } {
  if (!detail) return { summary: '' }

  // 尝试查找 "详细数据:" 标记
  const marker = '详细数据:'
  const idx = detail.indexOf(marker)
  if (idx !== -1) {
    const summary = detail.slice(0, idx + marker.length).trim()
    const jsonStr = detail.slice(idx + marker.length).trim()
    try {
      const detailData = JSON.parse(jsonStr)
      return { summary, detailData }
    } catch (e) {
      // JSON 解析失败，返回原字符串
    }
  }

  // 回退：尝试在字符串中查找第一个 { ... } 块
  const match = detail.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      const detailData = JSON.parse(match[0])
      const summary = detail.replace(match[0], '').trim()
      return { summary, detailData }
    } catch (e) {
      // 解析失败
    }
  }

  return { summary: detail }
}

/**
 * 格式化 detail JSON 数据为中文结构化文本
 *（与 formatAlarmDetail 类似，但不需要完整 AlarmEvent）
 */
export function formatDetailData(data: any): string {
  if (!data || typeof data !== 'object') return String(data || '')

  const lines: string[] = []

  // 【窗口统计】
  if (data.anomalyCount !== undefined && data.windowDataCount !== undefined) {
    lines.push('【窗口统计】')
    if (data.duration !== undefined) {
      lines.push(`检测窗口: ${(data.duration / 1000).toFixed(1)} s`)
    }
    lines.push(`窗口数据: ${data.windowDataCount} 个点`)
    lines.push(`异常次数: ${data.anomalyCount} 次`)
    const ratio = data.windowDataCount > 0
      ? ((data.anomalyCount / data.windowDataCount) * 100).toFixed(1)
      : '0.0'
    lines.push(`异常占比: ${ratio} %`)
    if (data.timeSpan !== undefined) {
      lines.push(`首尾跨度: ${(data.timeSpan / 1000).toFixed(1)} s`)
    }
    lines.push('')
  }

  // 【异常详情】
  if (data.value !== undefined || data.paramValue !== undefined) {
    const val = data.value ?? data.paramValue
    lines.push('【异常详情】')
    lines.push(`异常值: ${val}`)
    if (data.min !== undefined && data.max !== undefined) {
      lines.push(`正常范围: ${data.min} ~ ${data.max}`)
      const diff = val < data.min
        ? `低于下限 ${(data.min - val).toFixed(2)}`
        : val > data.max
          ? `高于上限 ${(val - data.max).toFixed(2)}`
          : ''
      if (diff) lines.push(`偏差: ${diff}`)
    } else if (data.operator && data.threshold !== undefined) {
      lines.push(`条件: ${data.operator} ${data.threshold}`)
    }
    lines.push('')
  }

  // 【时间信息】
  const timeLines = []
  if (data.firstAnomalyTime) {
    timeLines.push(`首次异常: ${formatTime(data.firstAnomalyTime)}`)
  }
  if (data.lastAnomalyTime) {
    timeLines.push(`末次异常: ${formatTime(data.lastAnomalyTime)}`)
  }
  if (timeLines.length > 0) {
    lines.push('【时间信息】')
    lines.push(...timeLines)
    lines.push('')
  }

  // 其他字段
  const knownKeys = new Set([
    'duration', 'anomalyCount', 'windowDataCount', 'timeSpan',
    'firstAnomalyTime', 'lastAnomalyTime', 'value', 'paramValue',
    'min', 'max', 'operator', 'threshold', 'param'
  ])
  const otherKeys = Object.keys(data).filter(k => !knownKeys.has(k))
  if (otherKeys.length > 0) {
    lines.push('【其他数据】')
    otherKeys.forEach(k => {
      lines.push(`${k}: ${JSON.stringify(data[k])}`)
    })
  }

  return lines.join('\n')
}

/**
 * 提取参数单位（简单映射）
 */
export function getParamUnit(paramName: string): string {
  const unitMap: Record<string, string> = {
    temp: '℃',
    level: 'L',
    current: 'A',
    ph: '',
    fill_volume: 'ml',
    pressure: 'MPa',
    speed: '瓶/分'
  }
  return unitMap[paramName] || ''
}
