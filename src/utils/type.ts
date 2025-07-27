// 数据模型类型，需要实时推送：核心四指标（cpu使用率，内存占用，网络延迟，设备在线率），
// 设备地图数据（位置及状态），环境温度，设备通信数据量-传感器数据上传频率

// 基础数据点
export interface BaseDataPoint {
  deviceId: string; // 设备唯一ID
  timestamp: number; // 数据采集时间，Unix时间戳(秒)
  location?: GeoPoint; // 设备地理位置
  dataStatus?: 'normal' | 'warning' | 'error'; // 数据状态，由数据处理器赋值添加
}

// 核心指标数据 (CPU/内存等)
export type CoreMetricData = BaseDataPoint & {
  category: 'cpu' | 'memory' | 'network' | 'online'; // 指标类别
  value: number; // 指标数值
};

// 环境传感器数据
export type EnvironmentData = BaseDataPoint & {
  type: 'temperature'; // 环境数据类型（目前为温度）
  value: number; // 温度数值
  unit?: string; // 温度单位（如°C）
};

// 设备通信数据-传感器数据上传频率
export type DeviceTelemetryData = BaseDataPoint & {
  dataType: 'upload_frequency'; // 数据类型（上传频率）
  value: number; // 上传频率数值
};

// 地理位置类型
export interface GeoPoint {
  lat: number; // 纬度
  lng: number; // 经度
  accuracy?: number; // 定位精度(米)
}

// 设备状态数据 (用于地图显示)
export type DeviceStatusData = BaseDataPoint & {
  status: 'online' | 'offline' | 'warning' | 'error'; // 设备状态
  lastUpdate: number; // 最后一次数据更新时间戳
  batteryLevel?: number; // 电池电量（百分比）
  location: GeoPoint; // 设备地理位置
};

// 设备类型数据（非实时，websocket不推送）
export type DeviceTypeData = {
  deviceCategory: string; // 设备类型（如传感器、网关等）
  count: number; // 该类型设备数量
  deviceList: string[]; // 该类型设备ID列表
};
