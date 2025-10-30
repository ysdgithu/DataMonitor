# DataMonitor 前端项目

## 构建部署
```bash
npm run build    # 生产构建
npm run preview  # 预览构建结果
```
## 有关说明

正常	#00B42A（鲜亮绿）	操作成功、数据正常、在线状态
警告 / 待处理	黄色	#FF7D00（橙黄）	需注意的警告、待审核状态
异常 / 错误	红色	#F53F3F（亮红）	操作失败、数据异常、离线状态

## 性能优化
问题描述：加载后图表渲染速度慢，且不同图表渲染速度不一样
分析：
1. ECharts 完整引入导致初始化耗时
项目中可能完整引入了 ECharts 所有模块，未按需加载，导致初始化时解析和编译大量无用代码。
2. 图表频繁重新创建图表实例
组件刷新时未复用 ECharts 实例，每次都销毁重建，增加 DOM 操作和内存开销。
3. 数据处理逻辑在主线程阻塞渲染
图表数据的排序、过滤等处理直接在主线程执行，尤其温度和请求量图表可能涉及高频数据更新，阻塞渲染进程。
4. 计算属性无缓存导致重复计算
图表配置（如 environmentDataChartOptions）使用 computed 但未加缓存，数据微小变化就触发全量重新计算。
5. 图表渲染无防抖机制
实时数据高频更新时，图表跟随高频重绘（如温度数据可能秒级更新），导致浏览器帧率下降。
6. 地图图表特殊性
工厂地图可能数据量小（仅展示位置分布），而温度 / 请求量图表需处理时间序列数据且附带动画效果，渲染成本更高。
解决：
```js
// 防抖处理图表更新，100ms内多次更新只执行一次
const updateChart = debounce((newOptions) => {
  if (chart) {
    chart.setOption(newOptions, false);
    // 单独设置延迟更新
    chart.setOption({ animation: false }, { lazyUpdate: true });
  }
}, 100)

watch(
  () => props.options,
  (newVal) => {
    if (newVal) {
      updateChart(newVal) // 使用防抖后的函数
    }
  },
  { deep: false } // 关闭深度监听（关键优化）
)
```
## websocket
### 自动重连机制（指数退避策略）

```js
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
```

1. **延迟计算**：`const delay = retryDelay * Math.pow(2, retryCount.value - 1)`
   - 第 1 次重连：delay = retryDelay * 1
   - 第 2 次重连：delay = retryDelay * 2
   - 第 3 次重连：delay = retryDelay * 4
   - 第 4 次重连：delay = retryDelay * 8
   - 以此类推...
2. **触发时机**：
   - 在`onclose`事件中调用`handleReconnect()`
   - 在连接创建失败的`catch`块中调用`handleReconnect()`
3. **重连限制**：
   - 当`retryCount`达到`maxRetries`时停止重连
   - 默认`maxRetries`为 3 次

### **心跳机制**

定期（比如每30秒）向服务器发送一个ping消息，服务器返回pong。如果一段时间没收到pong，就主动断开并触发重连。

```js
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

```

### 消息队列

在重连期间，将需要发送的消息缓存到一个数组中，等连接恢复后重新发送。

```js
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
      // 发送至服务器
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
```

## 制造一个“性能优化”的亮点

**现状：** ECharts图表随数据刷新，可能卡顿。
**目标：** 展示你有性能意识。

**具体操作：**

1. **防抖/节流**：在历史数据查询的时间筛选器上，加上防抖（例如用户停止输入500ms后再请求）。
2. **虚拟滚动**：如果你的历史数据列表很长，可以口嗨一句“对于大数据量的列表，我调研了虚拟滚动的方案来优化渲染性能”。（如果没时间，可以不实现，但要知道原理）。
