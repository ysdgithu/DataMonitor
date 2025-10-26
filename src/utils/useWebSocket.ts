import { ref } from 'vue'

// 定义WebSocket消息类型
interface WebSocketMessage {
  type: string
  data?: any
  timestamp?: number
}

// WebSocket 连接参数配置
interface WebSocketOptions {
  url: string          // WebSocket 服务器地址
  maxRetries?: number  // 最大重连次数（可选，默认3）
  retryDelay?: number  // 重连延迟（毫秒，可选，默认1000）
  heartbeatInterval?: number  // 心跳间隔（毫秒，可选，默认30000）
  heartbeatTimeout?: number   // 心跳超时时间（毫秒，可选，默认10000）
}

export function useWebSocket(options: WebSocketOptions) {
  const {
    url,
    maxRetries = 3,
    retryDelay = 1000,
    heartbeatInterval = 30000, // 默认30秒
    heartbeatTimeout = 10000   // 默认10秒超时
  } = options

  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const retryCount = ref(0)
  const lastMessage = ref<WebSocketMessage | null>(null)

  // 消息队列 - 缓存重连期间需要发送的消息
  const messageQueue = ref<(string | object)[]>([])

  // 心跳相关变量
  let heartbeatTimer: number | null = null
  let heartbeatTimeoutTimer: number | null = null
  let isWaitingForPong = ref(false)

  // 重连定时器
  let retryTimeout: number | null = null

  // 连接WebSocket
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

  // 设置WebSocket事件监听器
  const setupWebSocketListeners = () => {
    if (!ws.value) return

    ws.value.onopen = () => {
      console.log('[WebSocket] 连接成功')
      isConnected.value = true
      retryCount.value = 0

      // 启动心跳机制
      startHeartbeat()

      // 发送缓存的消息
      sendQueuedMessages()
    }

    ws.value.onmessage = (event: MessageEvent) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data)
        lastMessage.value = data

        // 检查是否是心跳响应
        if (data.type === 'pong') {
          handlePongResponse()
        }
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
      stopHeartbeat()
    }

    ws.value.onclose = (event) => {
      console.log('[WebSocket] 连接关闭:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      })
      isConnected.value = false
      stopHeartbeat()
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

    stopHeartbeat()
    isConnected.value = false
    retryCount.value = 0
    messageQueue.value = [] // 清空消息队列
  }

  // 发送消息
  const sendMessage = (message: string | object) => {
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected, adding message to queue')
      // 将消息加入队列
      messageQueue.value.push(message)
      return
    }

    try {
      const data = typeof message === 'string' ? message : JSON.stringify(message)
      ws.value.send(data)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  // 发送队列中的消息
  const sendQueuedMessages = () => {
    if (messageQueue.value.length === 0) return

    console.log(`[WebSocket] 发送队列中的 ${messageQueue.value.length} 条消息`)

    // 复制队列并清空，避免发送过程中新增的消息被重复处理
    const messagesToSend = [...messageQueue.value]
    messageQueue.value = []

    messagesToSend.forEach(message => {
      sendMessage(message)
    })
  }

  // 启动心跳机制
  const startHeartbeat = () => {
    console.log('[WebSocket] 启动心跳机制')

    // 清除可能存在的旧定时器
    stopHeartbeat()

    // 设置心跳定时器
    heartbeatTimer = setInterval(() => {
      sendHeartbeat()
    }, heartbeatInterval)
  }

  // 停止心跳机制
  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }

    if (heartbeatTimeoutTimer) {
      clearTimeout(heartbeatTimeoutTimer)
      heartbeatTimeoutTimer = null
    }

    isWaitingForPong.value = false
  }

  // 发送心跳消息
  const sendHeartbeat = () => {
    if (!isConnected.value) return

    // 如果正在等待pong响应，说明上一次心跳没有得到回应
    if (isWaitingForPong.value) {
      console.warn('[WebSocket] 心跳超时，主动断开连接')
      // 主动断开连接，触发重连
      if (ws.value) {
        ws.value.close(4001, 'Heartbeat timeout')
      }
      return
    }

    console.log('[WebSocket] 发送心跳 ping')
    try {
      // 发送ping消息
      sendMessage({ type: 'ping', timestamp: Date.now() })

      // 设置等待pong状态
      isWaitingForPong.value = true

      // 设置超时定时器
      heartbeatTimeoutTimer = setTimeout(() => {
        if (isWaitingForPong.value) {
          console.warn('[WebSocket] 心跳超时，主动断开连接')
          if (ws.value) {
            ws.value.close(4001, 'Heartbeat timeout')
          }
        }
      }, heartbeatTimeout)

    } catch (error) {
      console.error('[WebSocket] 发送心跳失败:', error)
    }
  }

  // 处理pong响应
  const handlePongResponse = () => {
    console.log('[WebSocket] 收到心跳 pong 响应')
    isWaitingForPong.value = false

    // 清除超时定时器
    if (heartbeatTimeoutTimer) {
      clearTimeout(heartbeatTimeoutTimer)
      heartbeatTimeoutTimer = null
    }
  }

  return {
    isConnected,
    retryCount,
    lastMessage,
    messageQueue, // 暴露消息队列供外部查看
    isWaitingForPong, // 暴露心跳等待状态
    connect,
    disconnect,
    sendMessage
  }
}
