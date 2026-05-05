import request from './request'
import { TokenManager } from './tokenManager'

export interface DiagnosisTask {
    id: number;
    name: string;
    device_id: string;
    status: number;
    priority: number;
    detail?: string;
    ai?: string;
    assignee: string;
    createTime: number;
    updateTime: number;
}

export interface DiagnosisResponse {
    success: boolean;
    data: DiagnosisTask[];
    total: number;
    page: number;
    pageSize: number;
}

export interface QueryParams {
    assignee?: string;
    deviceId?: string;
    page?: number;
    pageSize?: number;
    priority?: number;
    status?: number;
    name?: string;
    startTime?: number; 
    endTime?: number;  
}

// AI 诊断相关接口
export interface AnomalyInfo {
    type: 'cpu_sustained' | 'temp_sudden' | 'custom';
    metric: string;
    threshold?: number;
    currentValue?: number;
    baseline?: number;
    severity?: string;
}

export interface TriggerDiagnosisParams {
    timestamp: number;
    deviceId: string;
    diagnosisTaskId?: number;
    anomalyInfo?: AnomalyInfo;
}

export interface AIContextData {
    deviceInfo: {
        deviceId: string;
        deviceType?: string;
        deviceName?: string;
        zone?: string;
        position?: string;
    };
    anomaly: {
        timestamp: number;
        timestampReadable: string;
        type?: string;
        metric?: string;
        threshold?: number;
        currentValue?: number;
        baseline?: number;
        severity?: string;
    };
    timeRange: {
        start: number;
        end: number;
        startReadable: string;
        endReadable: string;
    };
    coreMetrics: {
        cpu: any[];
        memory: any[];
        network: any[];
        online: any[];
    };
    environmentData: any[];
    telemetryData: any[];
    factoryDeviceData: any[];
    diagnosisTask?: {
        id: number;
        name: string;
        detail?: string;
        assignee: string;
        priority: number;
        status: number;
    };
    statistics: {
        totalDataPoints: number;
        coreMetricsCount: number;
        environmentDataCount: number;
        telemetryDataCount: number;
        factoryDeviceDataCount: number;
    };
}

export interface AIDiagnosisResponse {
    success: boolean;
    data: {
        context: AIContextData;
        diagnosis: any;  // AI 服务返回的诊断结果
    };
}

export class DiagnosticApi {
    async getDiagnosisList(params: QueryParams = {}): Promise<DiagnosisResponse> {
        return await request.get('/diagnosis-tasks', { params })
    }
    
    async getDiagnosisDetail(id: number): Promise<{ success: boolean; data: DiagnosisTask }> {
        return await request.get(`/diagnosis-tasks/${id}`)
    }
    
    async createDiagnosisTask(task: {
        name: string;
        deviceId: string;
        priority: number;
        assignee: string;
        detail?: string;
        status?: number;
    }): Promise<{ success: boolean; data: { id: number }; message: string }> {
        return await request.post('/diagnosis-tasks', task)
    }
    
    async updateDiagnosisTask(id: number, updates: {
        name?: string;
        deviceId?: string;
        status?: number;
        priority?: number;
        detail?: string;
        assignee?: string;
    }): Promise<{ success: boolean; message: string }> {
        return await request.put(`/diagnosis-tasks/${id}`, updates)
    }
    
    async deleteDiagnosisTask(id: number): Promise<{ success: boolean; message: string }> {
        return await request.delete(`/diagnosis-tasks/${id}`)
    }
    
    async getDiagnosisTaskStats(): Promise<{
        success: boolean;
        data: {
            total: number;
            running: number;
            completed: number;
            failed: number;
        }
    }> {
        return await request.get('/diagnosis-tasks-stats')
    }

    // AI 诊断接口
    async triggerAIDiagnosis(params: TriggerDiagnosisParams): Promise<AIDiagnosisResponse> {
        console.log('[前端] 触发 AI 诊断:', params)
        return await request.post('/trigger-diagnosis', params)
    }

    /**
     * 流式 AI 分析接口（RAGFlow）
     * @param taskId 诊断任务 ID
     * @param callbacks 回调函数
     */
    async streamAIAnalysis(
        taskId: number,
        callbacks: {
            onMessage: (content: string) => void;
            onError?: (error: string) => void;
            onDone?: () => void;
        }
    ): Promise<void> {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api'
        const token = TokenManager.getAccessToken()

        const response = await fetch(`${API_BASE_URL}/ai-analysis`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ taskId })
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `请求失败: ${response.status}`)
        }

        if (!response.body) {
            throw new Error('响应体为空')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let buffer = ''

        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    const trimmed = line.trim()
                    if (!trimmed.startsWith('data:')) continue

                    const jsonStr = trimmed.slice(5).trim()
                    if (jsonStr === '[DONE]') {
                        callbacks.onDone?.()
                        return
                    }

                    try {
                        const parsed = JSON.parse(jsonStr)
                        if (parsed.content !== undefined) {
                            callbacks.onMessage(parsed.content)
                        }
                        if (parsed.error) {
                            callbacks.onError?.(parsed.error)
                        }
                    } catch (e) {
                        // 忽略解析失败的行
                    }
                }
            }

            // 处理缓冲区剩余内容
            if (buffer.trim()) {
                const trimmed = buffer.trim()
                if (trimmed.startsWith('data:')) {
                    const jsonStr = trimmed.slice(5).trim()
                    if (jsonStr === '[DONE]') {
                        callbacks.onDone?.()
                    } else {
                        try {
                            const parsed = JSON.parse(jsonStr)
                            if (parsed.content !== undefined) {
                                callbacks.onMessage(parsed.content)
                            }
                        } catch (e) {
                            // 忽略
                        }
                    }
                }
            }

            callbacks.onDone?.()
        } catch (err: any) {
            console.error('[streamAIAnalysis] 流读取失败:', err)
            callbacks.onError?.(err.message || '流式响应中断')
            throw err
        } finally {
            reader.releaseLock()
        }
    }
}

