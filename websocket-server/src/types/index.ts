// 数据模型类型，需要实时推送：核心四指标（cpu使用率，内存占用，网络延迟，设备在线率），
// 设备地图数据（位置及状态），环境温度，设备通信数据量-传感器数据上传频率
// 整体的数据，设备id需要统一
// 基础数据点
export interface BaseDataPoint {
  deviceId: string; // 设备唯一ID
  timestamp: number; // 数据采集时间，Unix时间戳(秒)
  dataStatus?: 'normal' | 'warning' | 'error'; // 数据状态，由数据处理器赋值添加
}

// 核心指标数据 (CPU/内存等)-整体设备id为000
export type CoreMetricData = BaseDataPoint & {
  category: 'cpu' | 'memory' | 'network' | 'online'; // 指标类别
  value: number; // 指标数值
};

// 环境传感器数据-整体设备id为001
export type EnvironmentData = BaseDataPoint & {
  type: 'temperature'; // 环境数据类型（目前为温度）
  value: number; // 温度数值
  unit?: string; // 温度单位（如°C）
};

// 设备通信数据-传感器数据上传频率-整体设备id为002
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

// 设备状态数据 (用于地图显示)-单个设备（需要不同id）
export type DeviceStatusData = BaseDataPoint & {
  status: 'online' | 'offline' | 'warning' | 'error'; // 设备状态
  lastUpdate: number; // 最后一次数据更新时间戳
  batteryLevel?: number; // 电池电量（百分比）
};

// 设备类型数据（非实时，websocket不推送）
export type DeviceTypeData = {
  deviceCategory: string; // 设备类型（如传感器、网关等）
  count: number; // 该类型设备数量
  deviceList: string[]; // 该类型设备ID列表
};

// 设备类型编码映射
export const DEVICE_TYPE_MAP = {
  0: '数控机床',
  1: '装配线',
  2: '焊接机器人',
  3: '质检设备',
  4: '自动货架',
  5: '输送带',
  6: '环境监控',
  7: '服务器',
  8: '检测设备',
  9: '空压机'
} as const;

export type DeviceTypeCode = keyof typeof DEVICE_TYPE_MAP;

// 工厂地图中的设备信息
export type FactoryDevice = {
  deviceId: string         // 设备唯一ID
  timestamp: number        // 数据采集时间，Unix时间戳(毫秒)
  name: string             // 设备名称，如"数控机床A1"
  typeCode: number         // 设备类型代号（0-9），对应DEVICE_TYPE_MAP
  type?: string            // 设备类型名称（可选，用于兼容性）
  x: number                // 设备在SVG坐标系中的横向位置
  y: number                // 设备在SVG坐标系中的纵向位置
  status: 'online' | 'offline' | 'warning' | 'error'  // 设备运行状态：在线、离线、警告、错误
  zone: string             // 设备所属区域的标识符，对应FactoryZone的id
  position: string         // 设备在工厂中的位置编码，如 "1区3排"
  dataStatus?: 'normal' | 'warning' | 'error'; // 数据状态，由数据处理器赋值添加
  parameters?: {
    temperature?: number   // 设备温度，单位：摄氏度（°C）
    pressure?: number      // 压力值，单位：bar
    vibration?: number     // 振动值，单位：m/s²
    power?: number         // 功率/电量，单位：百分比（%）
    [key: string]: any     // 其他可能的参数，支持动态扩展
  }
}
