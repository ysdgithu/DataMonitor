# DataMonitor 后端服务

## 数据表

1. 核心指标数据表 (core_metrics)

```sql
CREATE TABLE IF NOT EXISTS core_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,    -- 自增主键
                device_id VARCHAR(50) NOT NULL,          -- 设备唯一标识
                timestamp BIGINT NOT NULL,               -- 数据采集时间戳
                category VARCHAR(20) NOT NULL,           -- 指标类别：cpu/memory/network/online
                value REAL NOT NULL,                     -- 指标数值
                data_status VARCHAR(10) DEFAULT 'normal',-- 数据状态：normal/warning/error
                latitude REAL,                           -- 设备纬度
                longitude REAL,                          -- 设备经度
                accuracy INTEGER,                        -- 定位精度（米）
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- 记录创建时间
            )
```   
2. 环境数据表 (environment_data)

```sql
CREATE TABLE IF NOT EXISTS environment_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,    -- 自增主键
                device_id VARCHAR(50) NOT NULL,          -- 设备唯一标识
                timestamp BIGINT NOT NULL,               -- 数据采集时间戳
                type VARCHAR(20) NOT NULL,               -- 数据类型（如：temperature）
                value REAL NOT NULL,                     -- 测量值
                unit VARCHAR(10),                        -- 单位（如：°C）
                data_status VARCHAR(10) DEFAULT 'normal',-- 数据状态：normal/warning/error
                latitude REAL,                           -- 设备纬度
                longitude REAL,                          -- 设备经度
                accuracy INTEGER,                        -- 定位精度（米）
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- 记录创建时间
            )
```   

1. 通信数据表 (telemetry_data)
用于记录设备的通信相关数据，如数据上传频率、通信质量等指标。

```sql
CREATE TABLE IF NOT EXISTS telemetry_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,    -- 自增主键
                device_id VARCHAR(50) NOT NULL,          -- 设备唯一标识
                timestamp BIGINT NOT NULL,               -- 数据采集时间戳
                data_type VARCHAR(30) NOT NULL,          -- 数据类型（如：upload_frequency）
                value REAL NOT NULL,                     -- 测量值
                data_status VARCHAR(10) DEFAULT 'normal',-- 数据状态：normal/warning/error
                latitude REAL,                           -- 设备纬度
                longitude REAL,                          -- 设备经度
                accuracy INTEGER,                        -- 定位精度（米）
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- 记录创建时间
            )
```
5. 工厂设备数据表 (factory_devices)

```sql
CREATE TABLE IF NOT EXISTS factory_devices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,    -- 自增主键
                device_id VARCHAR(50) NOT NULL,          -- 设备唯一标识
                timestamp BIGINT NOT NULL,               -- 数据更新时间戳
                name VARCHAR(100) NOT NULL,              -- 设备名称（如：数控机床A1）
                type VARCHAR(50) NOT NULL,               -- 设备类型（如：数控机床、机器人等）
                x INTEGER NOT NULL,                      -- SVG坐标系X坐标
                y INTEGER NOT NULL,                      -- SVG坐标系Y坐标
                status VARCHAR(20) NOT NULL,             -- 设备状态：online/offline/warning/error
                zone VARCHAR(50) NOT NULL,               -- 所属区域（如：production/storage等）
                position VARCHAR(50) NOT NULL,           -- 位置编码（如：1区3排）
                parameters TEXT,                         -- JSON格式的设备参数（温度、压力等）
                data_status VARCHAR(10) DEFAULT 'normal',-- 数据状态标识
                latitude REAL,                           -- 设备纬度
                longitude REAL,                          -- 设备经度
                accuracy INTEGER,                        -- 定位精度（米）
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- 记录创建时间
            )
```
6. 数据统计表 (data_statistics)
用于存储各类数据的统计信息，支持按小时统计的数据分析和报表功能。

```sql
CREATE TABLE IF NOT EXISTS data_statistics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,    -- 自增主键
                date DATE NOT NULL,                      -- 统计日期
                hour INTEGER NOT NULL,                   -- 统计小时（0-23）
                data_type VARCHAR(20) NOT NULL,          -- 数据类型（对应各个数据表）
                category VARCHAR(20),                    -- 数据类别（如core_metrics的cpu/memory等）
                avg_value REAL,                          -- 平均值
                max_value REAL,                          -- 最大值
                min_value REAL,                          -- 最小值
                count INTEGER,                           -- 数据点总数
                error_count INTEGER,                     -- 错误数据点数量
                warning_count INTEGER,                   -- 警告数据点数量
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- 记录创建时间
            )
```
## 各种想法

2025-10-14
死ai我真无语了，应该就建一张工厂设备总表就行了，剩下的都能从这查然后统计，还能展示性能

模拟器推单个设备数据（一个实例代表一个设备）->异常检测->统计->展示
同时开10个实例然后服务器定时推送10个示例的数据（模拟整个工厂设备的数据上报）
可能存在的问题：
1. 10台太少了真实情况可能有一大堆
2. 推送频率问题，不一定所有设备都是1秒推送，有的可能10秒一次
服务器单次推送数据库写入一次，设备模拟和数据库在同一服务器中 
前端服务器到底跟谁长连接？前端负责把连接数据统计加工并展示 
数据展示流程（实时和非实时）为基础功能！
进阶：报警闭环（需要实现设备报警-处理-恢复的全链路监控）
感觉越做越复杂了，想逝了