import { onUnmounted } from 'vue';
import type { MetricData } from './metrics';

// 创建 worker 实例
// 提供发送数据和接收结果的方法
// 组件卸载时自动销毁 worker
export const useDataWorker = () => {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

  // 发送数据并返回 Promise 结果
  function processData(data: MetricData[]): Promise<any> {
    return new Promise((resolve) => {
      worker.onmessage = (e) => resolve(e.data);
      worker.postMessage(data);
    });
  }

  onUnmounted(() => worker.terminate());

  return { processData };
};
