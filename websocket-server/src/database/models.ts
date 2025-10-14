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

    // 插入核心指标数据
    async insertCoreMetrics(data: CoreMetricRecord[]): Promise<void> {
        const columns = [
            'device_id', 'timestamp', 'category', 'value', 'data_status',
            'latitude', 'longitude', 'accuracy'
        ];
        
        const rows = data.map(item => [
            item.deviceId,
            item.timestamp,
            item.category,
            item.value,
            item.dataStatus,
            item.location?.lat || null,
            item.location?.lng || null,
            item.location?.accuracy || null
        ]);

        await this.db.batchInsert('core_metrics', columns, rows);
    }

    // 插入环境数据
    async insertEnvironmentData(data: EnvironmentRecord): Promise<void> {
        const sql = `
            INSERT INTO environment_data 
            (device_id, timestamp, type, value, unit, data_status, latitude, longitude, accuracy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await this.db.run(sql, [
            data.deviceId,
            data.timestamp,
            data.type,
            data.value,
            data.unit,
            data.dataStatus,
            data.location?.lat || null,
            data.location?.lng || null,
            data.location?.accuracy || null
        ]);
    }

    // 插入设备状态数据
    async insertDeviceStatus(data: DeviceStatusRecord[]): Promise<void> {
        const columns = [
            'device_id', 'timestamp', 'status', 'last_update', 'battery_level',
            'data_status', 'latitude', 'longitude', 'accuracy'
        ];
        
        const rows = data.map(item => [
            item.deviceId,
            item.timestamp,
            item.status,
            item.lastUpdate,
            item.batteryLevel,
            item.dataStatus,
            item.location?.lat || null,
            item.location?.lng || null,
            item.location?.accuracy || null
        ]);

        await this.db.batchInsert('device_status', columns, rows);
    }

    // 插入通信数据
    async insertTelemetryData(data: TelemetryRecord): Promise<void> {
        const sql = `
            INSERT INTO telemetry_data 
            (device_id, timestamp, data_type, value, data_status, latitude, longitude, accuracy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await this.db.run(sql, [
            data.deviceId,
            data.timestamp,
            data.dataType,
            data.value,
            data.dataStatus,
            data.location?.lat || null,
            data.location?.lng || null,
            data.location?.accuracy || null
        ]);
    }

    // 插入工厂设备数据
    async insertFactoryDevices(data: FactoryDeviceRecord[]): Promise<void> {
        const columns = [
            'device_id', 'timestamp', 'name', 'type', 'x', 'y', 'status', 'zone', 'position',
            'parameters', 'data_status', 'latitude', 'longitude', 'accuracy'
        ];

        const rows = data.map(item => [
            item.deviceId,
            item.timestamp,
            item.name,
            item.type,
            item.x,
            item.y,
            item.status,
            item.zone,
            item.position,
            JSON.stringify(item.parameters || {}),
            item.dataStatus,
            item.location?.lat || null,
            item.location?.lng || null,
            item.location?.accuracy || null
        ]);

        await this.db.batchInsert('factory_devices', columns, rows);
    }

    // 查询核心指标数据
    async queryCoreMetrics(params: QueryParams): Promise<any[]> {
        let sql = 'SELECT * FROM core_metrics WHERE 1=1';
        const sqlParams: any[] = [];

        if (params.deviceId) {
            sql += ' AND device_id = ?';
            sqlParams.push(params.deviceId);
        }

        if (params.category) {
            sql += ' AND category = ?';
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

        if (params.limit) {
            sql += ' LIMIT ?';
            sqlParams.push(params.limit);
            
            if (params.offset) {
                sql += ' OFFSET ?';
                sqlParams.push(params.offset);
            }
        }

        return await this.db.all(sql, sqlParams);
    }

    // 查询环境数据
    async queryEnvironmentData(params: QueryParams): Promise<any[]> {
        let sql = 'SELECT * FROM environment_data WHERE 1=1';
        const sqlParams: any[] = [];

        if (params.deviceId) {
            sql += ' AND device_id = ?';
            sqlParams.push(params.deviceId);
        }

        if (params.dataType) {
            sql += ' AND type = ?';
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

        if (params.limit) {
            sql += ' LIMIT ?';
            sqlParams.push(params.limit);
            
            if (params.offset) {
                sql += ' OFFSET ?';
                sqlParams.push(params.offset);
            }
        }

        return await this.db.all(sql, sqlParams);
    }

    // 查询设备状态数据
    async queryDeviceStatus(params: QueryParams): Promise<any[]> {
        let sql = 'SELECT * FROM device_status WHERE 1=1';
        const sqlParams: any[] = [];

        if (params.deviceId) {
            sql += ' AND device_id = ?';
            sqlParams.push(params.deviceId);
        }

        if (params.status) {
            sql += ' AND status = ?';
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

        if (params.limit) {
            sql += ' LIMIT ?';
            sqlParams.push(params.limit);
            
            if (params.offset) {
                sql += ' OFFSET ?';
                sqlParams.push(params.offset);
            }
        }

        return await this.db.all(sql, sqlParams);
    }

    // 查询通信数据
    async queryTelemetryData(params: QueryParams): Promise<any[]> {
        let sql = 'SELECT * FROM telemetry_data WHERE 1=1';
        const sqlParams: any[] = [];

        if (params.deviceId) {
            sql += ' AND device_id = ?';
            sqlParams.push(params.deviceId);
        }

        if (params.dataType) {
            sql += ' AND data_type = ?';
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

        if (params.limit) {
            sql += ' LIMIT ?';
            sqlParams.push(params.limit);
            
            if (params.offset) {
                sql += ' OFFSET ?';
                sqlParams.push(params.offset);
            }
        }

        return await this.db.all(sql, sqlParams);
    }

    // 获取数据统计信息
    async getDataStatistics(dataType: string, hours: number = 24): Promise<any[]> {
        const sql = `
            SELECT 
                data_type,
                category,
                COUNT(*) as total_count,
                AVG(value) as avg_value,
                MAX(value) as max_value,
                MIN(value) as min_value,
                SUM(CASE WHEN data_status = 'error' THEN 1 ELSE 0 END) as error_count,
                SUM(CASE WHEN data_status = 'warning' THEN 1 ELSE 0 END) as warning_count,
                datetime(timestamp/1000, 'unixepoch') as time_group
            FROM (
                SELECT 'core_metrics' as data_type, category, value, data_status, timestamp FROM core_metrics
                WHERE timestamp >= ? 
                UNION ALL
                SELECT 'environment' as data_type, type as category, value, data_status, timestamp FROM environment_data
                WHERE timestamp >= ?
                UNION ALL
                SELECT 'telemetry' as data_type, data_type as category, value, data_status, timestamp FROM telemetry_data
                WHERE timestamp >= ?
            ) combined
            WHERE data_type = ?
            GROUP BY data_type, category, datetime(timestamp/1000, 'unixepoch', 'start of hour')
            ORDER BY timestamp DESC
        `;

        const hoursAgo = Date.now() - (hours * 60 * 60 * 1000);
        return await this.db.all(sql, [hoursAgo, hoursAgo, hoursAgo, dataType]);
    }

    // 查询工厂设备数据
    async queryFactoryDevices(params: QueryParams): Promise<any[]> {
        let sql = 'SELECT * FROM factory_devices WHERE 1=1';
        const sqlParams: any[] = [];

        if (params.deviceId) {
            sql += ' AND device_id = ?';
            sqlParams.push(params.deviceId);
        }

        if (params.status) {
            sql += ' AND status = ?';
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

        if (params.limit) {
            sql += ' LIMIT ?';
            sqlParams.push(params.limit);

            if (params.offset) {
                sql += ' OFFSET ?';
                sqlParams.push(params.offset);
            }
        }

        return await this.db.all(sql, sqlParams);
    }
}

export { DataModel, QueryParams, CoreMetricRecord, EnvironmentRecord, TelemetryRecord, DeviceStatusRecord, FactoryDeviceRecord };
