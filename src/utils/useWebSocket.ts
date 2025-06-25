import { ref } from 'vue'

interface WebSocketOptions {
  url: string          // WebSocket URL
  maxRetries?: number  
  retryDelay?: number
}
// 设备数据接口
interface DeviceData {
  type: string
  value: number
  timestamp: number
}

export function useWebSocket(options: WebSocketOptions) {
  const { url, maxRetries = 3, retryDelay = 1000 } = options
  
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const retryCount = ref(0)
  const lastMessage = ref<DeviceData | null>(null)

  let retryTimeout: NodeJS.Timeout | null = null

  const connect = () => {
    try {
      ws.value = new WebSocket(url)
      setupWebSocketListeners()
    } catch (error) {
      console.error('WebSocket connection error:', error)
      handleReconnect()
    }
  }
    // 设置 WebSocket 事件监听器
  const setupWebSocketListeners = () => {
    if (!ws.value) return

    ws.value.onopen = () => {
      console.log('WebSocket connected')
      isConnected.value = true
      retryCount.value = 0
    }

    ws.value.onmessage = (event: MessageEvent) => {
      try {
        const data: DeviceData = JSON.parse(event.data)
        lastMessage.value = data
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    ws.value.onerror = (error) => {
      console.error('WebSocket error:', error)
      isConnected.value = false
    }

    ws.value.onclose = () => {
      console.log('WebSocket closed')
      isConnected.value = false
      handleReconnect()
    }
  }
    // 处理重连逻辑
  const handleReconnect = () => {
    if (retryCount.value >= maxRetries) {
      console.log('Max retry attempts reached')
      return
    }

    retryCount.value++
    const delay = retryDelay * Math.pow(2, retryCount.value - 1) // 指数退避策略

    console.log(`Attempting to reconnect in ${delay}ms... (Attempt ${retryCount.value})`)
    
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