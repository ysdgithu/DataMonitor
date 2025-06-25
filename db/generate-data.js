import { writeFileSync } from 'fs';
const metrics = [];
const deviceTypes = ["mobile", "pc", "sensor", "server"];
const startTimestamp = 1620000000; // 开始时间戳（假设为2021-05-03）
const endTimestamp = 1620086400;   // 结束时间戳（2021-05-04）

// 生成核心指标（CPU、内存、延迟、活跃设备）
for (let i = 0; i < 50000; i++) {
  metrics.push({
    id: metrics.length + 1,
    type: "cpu_usage",
    value: Math.random() * 100, // 0%~100%
    timestamp: startTimestamp + Math.floor(Math.random() * (endTimestamp - startTimestamp))
  });
  metrics.push({
    id: metrics.length + 1,
    type: "memory_usage",
    value: Math.random() * 100,
    timestamp: startTimestamp + Math.floor(Math.random() * (endTimestamp - startTimestamp))
  });
  metrics.push({
    id: metrics.length + 1,
    type: "latency",
    value: Math.floor(Math.random() * 500) + 1, // 1~500ms
    timestamp: startTimestamp + Math.floor(Math.random() * (endTimestamp - startTimestamp))
  });
  metrics.push({
    id: metrics.length + 1,
    type: "active_devices",
    value: Math.floor(Math.random() * 100) + 1, // 1~100台
    timestamp: startTimestamp + Math.floor(Math.random() * (endTimestamp - startTimestamp))
  });
}

// 生成设备类型分布（每小时统计一次）
let currentTimestamp = startTimestamp;
while (currentTimestamp <= endTimestamp) {
  deviceTypes.forEach(type => {
    metrics.push({
      id: metrics.length + 1,
      type: "device_type",
      deviceType: type,
      count: Math.floor(Math.random() * 50) + 10, // 10~60台
      timestamp: currentTimestamp
    });
  });
  currentTimestamp += 3600; // 每小时生成一次
}

// 生成请求量统计（每分钟递增）
currentTimestamp = startTimestamp;
let requestCount = 0;
while (currentTimestamp <= endTimestamp) {
  requestCount += Math.floor(Math.random() * 10); // 随机增长
  metrics.push({
    id: metrics.length + 1,
    type: "request_count",
    count: requestCount,
    timestamp: currentTimestamp
  });
  currentTimestamp += 60; // 每分钟一次
}

writeFileSync("db.json", JSON.stringify({ metrics }, null, 2));