import { ref, onUnmounted } from 'vue'

// 定义数据类型
interface MetricData {
  type: string
  timestamp: number
  value?: number
  deviceType?: string
  count?: number
}

interface WorkerResponse {
  success: boolean
  data?: Record<string, any>
  error?: string
}

export const useDataWorker = () => {
  // 创建响应式状态
  const isProcessing = ref(false)
  const error = ref<string | null>(null)
  const result = ref<Record<string, any> | null>(null)

  // 创建 Worker 实例
  const worker = new Worker(new URL('./worker.ts', import.meta.url))

  // 处理 Worker 消息
  worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
    const { success, data, error: workerError } = e.data
    
    if (success && data) {
      result.value = data
      error.value = null
    } else {
      error.value = workerError || '数据处理失败'
      result.value = null
    }
    
    isProcessing.value = false
  }

  // 处理 Worker 错误
  worker.onerror = (e: ErrorEvent) => {
    error.value = e.message
    isProcessing.value = false
    console.error('Worker 错误:', e)
  }

  /**
   * 发送数据到 Worker 处理
   * @param data - 需要处理的原始数据
   * @returns Promise - 处理结果
   */
  const processData = (data: MetricData[]): Promise<Record<string, any>> => {
    return new Promise((resolve, reject) => {
      if (!worker) {
        reject(new Error('Worker 未初始化'))
        return
      }

      isProcessing.value = true
      error.value = null

      // 设置临时消息处理器
      const messageHandler = (e: MessageEvent<WorkerResponse>) => {
        const { success, data: resultData, error: workerError } = e.data
        
        if (success && resultData) {
          resolve(resultData)
        } else {
          reject(new Error(workerError || '数据处理失败'))
        }
        
        // 移除临时处理器
        worker.removeEventListener('message', messageHandler)
      }

      // 添加临时消息处理器
      worker.addEventListener('message', messageHandler)

      // 发送数据到 Worker
      try {
        worker.postMessage(data)
      } catch (err) {
        isProcessing.value = false
        reject(err)
      }
    })
  }

  /**
   * 终止 Worker
   */
  const terminateWorker = () => {
    if (worker) {
      worker.terminate()
    }
  }

  // 组件卸载时清理 Worker
  onUnmounted(() => {
    terminateWorker()
  })

  return {
    isProcessing,
    error,
    result,
    processData,
    terminateWorker
  }
}