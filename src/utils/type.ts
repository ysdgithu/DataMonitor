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
  location: GeoPoint; // 设备地理位置
};

// 设备类型数据（非实时，websocket不推送）
export type DeviceTypeData = {
  deviceCategory: string; // 设备类型（如传感器、网关等）
  count: number; // 该类型设备数量
  deviceList: string[]; // 该类型设备ID列表
};

// 工厂地图中的设备信息接口定义
export interface FactoryDevice {
  id: string                // 设备唯一标识符
  name: string             // 设备名称，如"数控机床A1"
  type: string             // 设备类型，如"数控机床"、"机器人"等
  lastUpdate: number;       // 最后一次数据更新时间戳（Unix时间戳，毫秒）
  x: number                // 设备在SVG坐标系中的横向位置
  y: number                // 设备在SVG坐标系中的纵向位置
  status: 'online' | 'offline' | 'warning' | 'error'  // 设备运行状态：在线、离线、警告、错误
  zone: string             // 设备所属区域的标识符，对应FactoryZone的id
  position: string         // 设备在工厂中的位置编码，如 "1区3排"
  parameters?: {
    temperature?: number   // 设备温度，单位：摄氏度（°C）
    pressure?: number      // 压力值，单位：bar
    vibration?: number     // 振动值，单位：m/s²
    power?: number         // 功率/电量，单位：百分比（%）
    [key: string]: any     // 其他可能的参数，支持动态扩展
  }
}

// 工厂区域定义接口，用于在地图上显示不同的功能区域
export interface FactoryZone {
  id: string              // 区域唯一标识符，如 'production', 'storage' 等
  name: string            // 区域显示名称，如 "生产区"、"仓储区" 等
  color: string           // 区域填充颜色，使用十六进制颜色代码，如 '#2196f3'
  path: string            // SVG路径数据，定义区域的形状和位置
  description?: string    // 区域的详细描述信息（可选）
}
