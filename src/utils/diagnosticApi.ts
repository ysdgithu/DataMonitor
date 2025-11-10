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
}

