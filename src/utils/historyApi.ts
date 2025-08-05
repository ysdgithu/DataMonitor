// 历史数据API接口
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3002/api';

// 查询参数接口
export interface QueryParams {
    deviceId?: string;
    category?: string;
    dataType?: string;
    status?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
    offset?: number;
}

// API响应接口
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    total?: number;
    params?: QueryParams;
    error?: string;
    message?: string;
}

// 历史数据API类
export class HistoryApi {
    private static instance: HistoryApi;
    private axiosInstance;

    private constructor() {
        this.axiosInstance = axios.create({
            baseURL: API_BASE_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // 响应拦截器
        this.axiosInstance.interceptors.response.use(
            response => response,
            error => {
                console.error('API请求失败:', error);
                return Promise.reject(error);
            }
        );
    }

    public static getInstance(): HistoryApi {
        if (!HistoryApi.instance) {
            HistoryApi.instance = new HistoryApi();
        }
        return HistoryApi.instance;
    }

    // 健康检查
    async healthCheck(): Promise<{ status: string; timestamp: number }> {
        const response = await this.axiosInstance.get('/health');
        return response.data;
    }

    // 查询核心指标数据
    async getCoreMetrics(params: QueryParams = {}): Promise<ApiResponse<any[]>> {
        const response = await this.axiosInstance.get('/core-metrics', { params });
        return response.data;
    }

    // 查询环境数据
    async getEnvironmentData(params: QueryParams = {}): Promise<ApiResponse<any[]>> {
        const response = await this.axiosInstance.get('/environment', { params });
        return response.data;
    }

    // 查询设备状态数据
    async getDeviceStatus(params: QueryParams = {}): Promise<ApiResponse<any[]>> {
        const response = await this.axiosInstance.get('/device-status', { params });
        return response.data;
    }

    // 查询通信数据
    async getTelemetryData(params: QueryParams = {}): Promise<ApiResponse<any[]>> {
        const response = await this.axiosInstance.get('/telemetry', { params });
        return response.data;
    }

    // 获取统计数据
    async getStatistics(dataType: string, hours: number = 24): Promise<ApiResponse<any[]>> {
        const response = await this.axiosInstance.get(`/statistics/${dataType}`, {
            params: { hours }
        });
        return response.data;
    }

    // 获取数据概览
    async getOverview(): Promise<ApiResponse<any>> {
        const response = await this.axiosInstance.get('/overview');
        return response.data;
    }

    // 获取指定时间范围的核心指标趋势
    async getCoreMetricsTrend(category: string, hours: number = 24): Promise<any[]> {
        const endTime = Date.now();
        const startTime = endTime - (hours * 60 * 60 * 1000);
        
        const response = await this.getCoreMetrics({
            category,
            startTime,
            endTime,
            limit: 100
        });

        if (response.success) {
            return response.data.map(item => ({
                timestamp: item.timestamp,
                value: item.value,
                status: item.data_status,
                time: new Date(item.timestamp).toLocaleTimeString()
            }));
        }
        return [];
    }

    // 获取环境数据趋势
    async getEnvironmentTrend(type: string = 'temperature', hours: number = 24): Promise<any[]> {
        const endTime = Date.now();
        const startTime = endTime - (hours * 60 * 60 * 1000);
        
        const response = await this.getEnvironmentData({
            dataType: type,
            startTime,
            endTime,
            limit: 100
        });

        if (response.success) {
            return response.data.map(item => ({
                timestamp: item.timestamp,
                value: item.value,
                status: item.data_status,
                time: new Date(item.timestamp).toLocaleTimeString(),
                unit: item.unit
            }));
        }
        return [];
    }

    // 获取设备状态统计
    async getDeviceStatusStats(hours: number = 24): Promise<any> {
        const endTime = Date.now();
        const startTime = endTime - (hours * 60 * 60 * 1000);
        
        const response = await this.getDeviceStatus({
            startTime,
            endTime,
            limit: 1000
        });

        if (response.success) {
            const statusCount = response.data.reduce((acc, item) => {
                acc[item.status] = (acc[item.status] || 0) + 1;
                return acc;
            }, {});

            return {
                total: response.data.length,
                statusCount,
                latest: response.data.slice(0, 10)
            };
        }
        return { total: 0, statusCount: {}, latest: [] };
    }

    // 获取通信数据趋势
    async getTelemetryTrend(dataType: string = 'upload_frequency', hours: number = 24): Promise<any[]> {
        const endTime = Date.now();
        const startTime = endTime - (hours * 60 * 60 * 1000);
        
        const response = await this.getTelemetryData({
            dataType,
            startTime,
            endTime,
            limit: 100
        });

        if (response.success) {
            return response.data.map(item => ({
                timestamp: item.timestamp,
                value: item.value,
                status: item.data_status,
                time: new Date(item.timestamp).toLocaleTimeString()
            }));
        }
        return [];
    }

    // 检查API连接状态
    async checkConnection(): Promise<boolean> {
        try {
            await this.healthCheck();
            return true;
        } catch (error) {
            console.error('API连接检查失败:', error);
            return false;
        }
    }
}

// 导出单例实例
export const historyApi = HistoryApi.getInstance();

// 时间范围选项
export const TIME_RANGE_OPTIONS = [
    { label: '最近1小时', value: 1 },
    { label: '最近6小时', value: 6 },
    { label: '最近12小时', value: 12 },
    { label: '最近24小时', value: 24 },
    { label: '最近3天', value: 72 },
    { label: '最近7天', value: 168 }
];

// 数据类型选项
export const DATA_TYPE_OPTIONS = {
    coreMetrics: [
        { label: 'CPU使用率', value: 'cpu' },
        { label: '内存占用', value: 'memory' },
        { label: '网络延迟', value: 'network' },
        { label: '设备在线率', value: 'online' }
    ],
    environment: [
        { label: '温度', value: 'temperature' }
    ],
    telemetry: [
        { label: '上传频率', value: 'upload_frequency' }
    ],
    deviceStatus: [
        { label: '在线', value: 'online' },
        { label: '离线', value: 'offline' },
        { label: '警告', value: 'warning' },
        { label: '错误', value: 'error' }
    ]
};
