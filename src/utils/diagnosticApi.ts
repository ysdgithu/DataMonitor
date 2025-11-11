import request from './request'

export interface DiagnosisTask {
    id: number;
    name: string;
    device_id: string;
    status: number;
    priority: number;
    detail?: string;
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
            paused: number;
            pending: number;
        }
    }> {
        return await request.get('/diagnosis-tasks-stats')
    }

    // AI 诊断接口
    async triggerAIDiagnosis(params: TriggerDiagnosisParams): Promise<AIDiagnosisResponse> {
        console.log('[前端] 触发 AI 诊断:', params)
        return await request.post('/trigger-diagnosis', params)
    }
}

