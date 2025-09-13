import { ref } from 'vue'
import type {
  CoreMetricData,
  EnvironmentData,
  DeviceTelemetryData,
  DeviceStatusData,
  WebSocketMessage
} from './type' // 路径根据实际情况调整

// WebSocket 连接参数配置
interface WebSocketOptions {
  url: string          // WebSocket 服务器地址
  maxRetries?: number  // 最大重连次数（可选，默认3）
  retryDelay?: number  // 重连延迟（毫秒，可选，默认1000）
}

// 统一设备数据类型
type DeviceData = CoreMetricData | EnvironmentData | DeviceTelemetryData | DeviceStatusData

export function useWebSocket(options: WebSocketOptions) {
  const { url, maxRetries = 3, retryDelay = 1000 } = options

  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const retryCount = ref(0)
  const lastMessage = ref<WebSocketMessage | null>(null)

  // 将 NodeJS.Timeout 改为 number
  let retryTimeout: number | null = null

  const connect = () => {
    console.log(`[WebSocket] 尝试连接到: ${url}`)

    try {
      ws.value = new WebSocket(url)
      setupWebSocketListeners()
    } catch (error) {
      console.error('[WebSocket] 连接创建失败:', error)
      handleReconnect()
    }
  }
    // 设置 WebSocket 事件监听器
  const setupWebSocketListeners = () => {
    if (!ws.value) return

    ws.value.onopen = () => {
      console.log('[WebSocket] 连接成功')
      isConnected.value = true
      retryCount.value = 0
    }

    ws.value.onmessage = (event: MessageEvent) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data)
        lastMessage.value = data
      } catch (error) {
        console.error('[WebSocket] 消息解析失败:', error, '原始数据:', event.data)
      }
    }

    ws.value.onerror = (error) => {
      console.error('[WebSocket] 连接错误:', error)
      console.error('[WebSocket] 连接URL:', url)
      console.error('[WebSocket] 当前状态:', ws.value?.readyState)

      // 检查是否是协议问题
      if (url.startsWith('ws://') && window.location.protocol === 'https:') {
        console.error('[WebSocket] 协议不匹配: HTTPS页面无法连接到WS服务器')
        console.error('[WebSocket] 建议: 使用WSS协议或在HTTP环境下测试')
      }

      isConnected.value = false
    }

    ws.value.onclose = (event) => {
      console.log('[WebSocket] 连接关闭:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      })
      isConnected.value = false
      handleReconnect()
    }
  }
    // 处理重连逻辑
  const handleReconnect = () => {
    if (retryCount.value >= maxRetries) {
      console.log('[WebSocket] 达到最大重连次数，停止重连')
      return
    }

    retryCount.value++
    const delay = retryDelay * Math.pow(2, retryCount.value - 1)

    console.log(`[WebSocket] ${delay}ms后进行第${retryCount.value}次重连...`)

    if (retryTimeout) {
      clearTimeout(retryTimeout)
    }

    retryTimeout = setTimeout(() => {
      connect()
    }, delay)
  }
    // 断开连接
  const disconnect = () => {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }

    if (retryTimeout) {
      clearTimeout(retryTimeout)
      retryTimeout = null
    }

    isConnected.value = false
    retryCount.value = 0
  }
    // 发送消息
  const sendMessage = (message: string | object) => {
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected')
      return
    }

    try {
      const data = typeof message === 'string' ? message : JSON.stringify(message)
      ws.value.send(data)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  return {
    isConnected,
    retryCount,
    lastMessage,
    connect,
    disconnect,
    sendMessage
  }
}

