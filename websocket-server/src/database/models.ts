// 数据模型定义和数据访问层
import DatabaseConnection from './connection';
import {
    CoreMetricData,
    EnvironmentData,
    DeviceTelemetryData,
    DeviceStatusData,
    FactoryDevice
} from '../types/index';

// 扩展数据类型，添加数据库字段
// 核心指标
interface CoreMetricRecord extends CoreMetricData {
    dataStatus: 'normal' | 'warning' | 'error';
}

// 环境数据
interface EnvironmentRecord extends EnvironmentData {
    dataStatus: 'normal' | 'warning' | 'error';
}

// 通信数据
interface TelemetryRecord extends DeviceTelemetryData {
    dataStatus: 'normal' | 'warning' | 'error';
}

// 设备状态
interface DeviceStatusRecord extends DeviceStatusData {
    dataStatus: 'normal' | 'warning' | 'error';
}

// 工厂设备
interface FactoryDeviceRecord extends FactoryDevice {
    dataStatus: 'normal' | 'warning' | 'error';
}

// 查询参数接口
interface QueryParams {
    deviceId?: string;
    startTime?: number;
    endTime?: number;
    category?: string;
    dataType?: string;
    status?: string;
    limit?: number;
    offset?: number;
}

class DataModel {
    private db: DatabaseConnection;

    constructor() {
        this.db = DatabaseConnection.getInstance();
    }

    // 通用插入方法 - 将数据插入统一的device_data表
    private async insertDeviceData(
        dataType: string,
        records: Array<{ deviceId: string; timestamp: number; dataStatus: string; location?: any; [key: string]: any }>
    ): Promise<void> {
        const columns = ['device_id', 'data_type', 'timestamp', 'data_status', 'payload'];

        const rows = records.map(item => [
            item.deviceId,
            dataType,
            item.timestamp,
            item.dataStatus,
            JSON.stringify(item) // 将整个对象序列化为JSON
        ]);

        await this.db.batchInsert('device_data', columns, rows);
    }

    // 插入核心指标数据
    async insertCoreMetrics(data: CoreMetricRecord[]): Promise<void> {
        await this.insertDeviceData('core_metrics', data);
    }

    // 插入环境数据
    async insertEnvironmentData(data: EnvironmentRecord): Promise<void> {
        await this.insertDeviceData('environment', [data]);
    }

    // 插入设备状态数据
    async insertDeviceStatus(data: DeviceStatusRecord[]): Promise<void> {
        await this.insertDeviceData('device_status', data);
    }

    // 插入通信数据
    async insertTelemetryData(data: TelemetryRecord): Promise<void> {
        await this.insertDeviceData('telemetry', [data]);
    }

    // 插入工厂设备数据
    async insertFactoryDevices(data: FactoryDeviceRecord[]): Promise<void> {
        await this.insertDeviceData('factory_devices', data);
    }

    // 查询核心指标数据
    async queryCoreMetrics(params: QueryParams): Promise<any[]> {
        let sql = 'SELECT * FROM device_data WHERE data_type = ?';
        const sqlParams: any[] = ['core_metrics'];

        if (params.deviceId) {
            sql += ' AND device_id = ?';
            sqlParams.push(params.deviceId);
        }

        if (params.category) {
            sql += ' AND JSON_EXTRACT(payload, \'$.category\') = ?';
            sqlParams.push(params.category);
        }

        if (params.startTime) {
            sql += ' AND timestamp >= ?';
            sqlParams.push(params.startTime);
        }

        if (params.endTime) {
            sql += ' AND timestamp <= ?';
            sqlParams.push(params.endTime);
        }

        sql += ' ORDER BY timestamp DESC';

        if (params.limit !== undefined) {
            sql += ` LIMIT ${parseInt(params.limit.toString())}`;

            if (params.offset !== undefined) {
                sql += ` OFFSET ${parseInt(params.offset.toString())}`;
            }
        }

        const rows = await this.db.all(sql, sqlParams);
        return rows.map(row => this.parseDeviceData(row));
    }

    // 查询环境数据
    async queryEnvironmentData(params: QueryParams): Promise<any[]> {
        let sql = 'SELECT * FROM device_data WHERE data_type = ?';
        const sqlParams: any[] = ['environment'];

        if (params.deviceId) {
            sql += ' AND device_id = ?';
            sqlParams.push(params.deviceId);
        }

        if (params.dataType) {
            sql += ' AND JSON_EXTRACT(payload, \'$.type\') = ?';
            sqlParams.push(params.dataType);
        }

        if (params.startTime) {
            sql += ' AND timestamp >= ?';
            sqlParams.push(params.startTime);
        }

        if (params.endTime) {
            sql += ' AND timestamp <= ?';
            sqlParams.push(params.endTime);
        }

        sql += ' ORDER BY timestamp DESC';

        if (params.limit !== undefined) {
            sql += ` LIMIT ${parseInt(params.limit.toString())}`;

            if (params.offset !== undefined) {
                sql += ` OFFSET ${parseInt(params.offset.toString())}`;
            }
        }

        const rows = await this.db.all(sql, sqlParams);
        return rows.map(row => this.parseDeviceData(row));
    }

    // 查询设备类型数据
    async queryDeviceStatus(params: QueryParams): Promise<{
        success: boolean;
        data: Array<{
            deviceType: number;
            count: number;
            deviceIds: string[];
        }>
    }> {
        // 简化版本：直接查询最新的设备状态记录
        // 使用子查询获取每个设备的最新记录
        let sql = `
            SELECT
                device_id,
                JSON_EXTRACT(payload, '$.status') as status,
                timestamp
            FROM device_data d1
            WHERE d1.data_type = 'device_status'
            AND timestamp = (
                SELECT MAX(timestamp)
                FROM device_data d2
                WHERE d2.device_id = d1.device_id
                AND d2.data_type = 'device_status'
            )
        `;
        const sqlParams: any[] = [];

        if (params.deviceId) {
            sql += ' AND device_id = ?';
            sqlParams.push(params.deviceId);
        }

        if (params.status) {
            sql += ' AND JSON_EXTRACT(payload, \'$.status\') = ?';
            sqlParams.push(params.status);
        }

        if (params.startTime) {
            sql += ' AND timestamp >= ?';
            sqlParams.push(params.startTime);
        }

        if (params.endTime) {
            sql += ' AND timestamp <= ?';
            sqlParams.push(params.endTime);
        }

        sql += ' ORDER BY device_id ASC';

        const rows = await this.db.all(sql, sqlParams);

        return {
            success: true,
            data: rows.map(row => ({
                deviceType: row.deviceType,
                count: row.count,
                deviceIds: row.deviceIds ? row.deviceIds.split(',') : []
            }))
        };
    }

    // 查询通信数据
    async queryTelemetryData(params: QueryParams): Promise<any[]> {
        let sql = 'SELECT * FROM device_data WHERE data_type = ?';
        const sqlParams: any[] = ['telemetry'];

        if (params.deviceId) {
            sql += ' AND device_id = ?';
            sqlParams.push(params.deviceId);
        }

        if (params.dataType) {
            sql += ' AND JSON_EXTRACT(payload, \'$.dataType\') = ?';
            sqlParams.push(params.dataType);
        }

        if (params.startTime) {
            sql += ' AND timestamp >= ?';
            sqlParams.push(params.startTime);
        }

        if (params.endTime) {
            sql += ' AND timestamp <= ?';
            sqlParams.push(params.endTime);
        }

        sql += ' ORDER BY timestamp DESC';

        if (params.limit !== undefined) {
            sql += ` LIMIT ${parseInt(params.limit.toString())}`;

            if (params.offset !== undefined) {
                sql += ` OFFSET ${parseInt(params.offset.toString())}`;
            }
        }

        const rows = await this.db.all(sql, sqlParams);
        return rows.map(row => this.parseDeviceData(row));
    }

    // 获取数据统计信息
    async getDataStatistics(dataType: string, hours: number = 24): Promise<any[]> {
        // MySQL 版本：使用 JSON_EXTRACT 和 DATE_FORMAT 替代 SQLite 的 datetime 函数
        const sql = `
            SELECT
                data_type,
                JSON_EXTRACT(payload, '$.category') as category,
                COUNT(*) as total_count,
                AVG(CAST(JSON_EXTRACT(payload, '$.value') AS DECIMAL(10,2))) as avg_value,
                MAX(CAST(JSON_EXTRACT(payload, '$.value') AS DECIMAL(10,2))) as max_value,
                MIN(CAST(JSON_EXTRACT(payload, '$.value') AS DECIMAL(10,2))) as min_value,
                SUM(CASE WHEN data_status = 'error' THEN 1 ELSE 0 END) as error_count,
                SUM(CASE WHEN data_status = 'warning' THEN 1 ELSE 0 END) as warning_count,
                DATE_FORMAT(FROM_UNIXTIME(timestamp/1000), '%Y-%m-%d %H:00:00') as time_group
            FROM device_data
            WHERE data_type = ? AND timestamp >= ?
            GROUP BY data_type, category, time_group
            ORDER BY time_group DESC
        `;

        const hoursAgo = Date.now() - (hours * 60 * 60 * 1000);
        return await this.db.all(sql, [dataType, hoursAgo]);
    }

    // 查询工厂设备数据
    async queryFactoryDevices(params: QueryParams): Promise<any[]> {
        let sql = 'SELECT * FROM device_data WHERE data_type = ?';
        const sqlParams: any[] = ['factory_devices'];

        if (params.deviceId) {
            sql += ' AND device_id = ?';
            sqlParams.push(params.deviceId);
        }

        if (params.status) {
            sql += ' AND JSON_EXTRACT(payload, \'$.status\') = ?';
            sqlParams.push(params.status);
        }

        if (params.startTime) {
            sql += ' AND timestamp >= ?';
            sqlParams.push(params.startTime);
        }

        if (params.endTime) {
            sql += ' AND timestamp <= ?';
            sqlParams.push(params.endTime);
        }

        sql += ' ORDER BY timestamp DESC';

        if (params.limit !== undefined) {
            sql += ` LIMIT ${parseInt(params.limit.toString())}`;

            if (params.offset !== undefined) {
                sql += ` OFFSET ${parseInt(params.offset.toString())}`;
            }
        }

        const rows = await this.db.all(sql, sqlParams);
        return rows.map(row => this.parseDeviceData(row));
    }

    // 辅助方法：解析device_data行，返回原始数据格式
    private parseDeviceData(row: any): any {
        if (!row || !row.payload) return row;
        try {
            const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
            return {
                ...row,
                ...payload
            };
        } catch (e) {
            return row;
        }
    }
}

export { DataModel, QueryParams, CoreMetricRecord, EnvironmentRecord, TelemetryRecord, DeviceStatusRecord, FactoryDeviceRecord };
