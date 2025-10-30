<template>
  <el-main class="dashboard-main">
    <!-- 控制栏 -->
    <el-card class="control-bar">
      <el-button type="primary" plain @click="showHistoryPanel = true">历史数据查询</el-button>
      <el-select v-model="timeRange" class="time-range">
        <el-option label="最近1小时" value="1h" />
        <el-option label="最近24小时" value="24h" />
        <el-option label="自定义" value="custom" />
      </el-select>
      <el-button-group>
      </el-button-group>
    </el-card>

    <!-- 主要内容区域 -->
    <el-row :gutter="20">
      <!-- 左侧核心指标 -->
      <el-col :span="6">
        <el-card style="margin-bottom: 10px;" class="metrics-panel">
          <template #header>
            <div class="panel-header">核心指标</div>
          </template>
          <el-row :gutter="20" class="metrics-grid">
            <el-col :span="12" v-for="metric in coreMetricStore.boardList" :key="metric.name">
              <div class="metric-item">
                <div class="metric-header">
                  {{ metric.name }}
                </div>
                <div class="metric-value" :class="metric.status">{{ metric.value }}</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
        <el-card class="chart-card metrics-panel"
        @click="openHistory('device_type')">
          <template #header>
            <div class="panel-header">设备类型分布</div>
          </template>
          <BaseChart
            :options="deviceTypeDataChartOptions"
            style="height: 220px;"
          />
        </el-card>
      </el-col>

      <!-- 中间地图区域 -->
      <el-col :span="12">
        <el-card class="map-card panel-header">
          <template #header>
            <div class="panel-header">工厂车间地图</div>
          </template>
          <FactoryMap></FactoryMap>
        </el-card>
      </el-col>

      <!-- 右侧图表 -->
      <el-col :span="6" >
        <el-card class="chart-card panel-header" style="margin-bottom: 10px;">
          <template #header>实时环境温度</template>
           <BaseChart
            :options="environmentDataChartOptions"
            style="height: 220px;"
          />
        </el-card>
        <el-card class="chart-card" @click="openHistory('request_count')">
          <template #header>
            <div class="panel-header">实时通信数据</div>
          </template>
          <BaseChart
            :options="requestCountChartOptions"
            style="height: 220px;"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 添加历史数据弹窗 -->
    <HistoryDataDialog
      v-model="showHistory"
      :type="currentType"
    />

    <!-- 历史数据查询面板弹窗 -->
    <el-dialog
      v-model="showHistoryPanel"
      title="历史数据查询"
      width="90%"
      :before-close="handleCloseHistoryPanel"
    >
      <HistoryDataPanel />
    </el-dialog>
  </el-main>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import BaseChart from '../charts/BaseChart.vue'
import HistoryDataPanel from './HistoryDataPanel.vue'
import { createLineChart, createBarChart, createPieChart, createMapChart } from '../../utils/chartOptions'
import { useCoreMetricStore } from '../../stores/CoreMetricData'
import { useEnvironmentDataStore } from '../../stores/EnvironmentData'
import { useDeviceTelemetryDataStore } from '../../stores/DeviceTelemetryData'
import { historyApi, DEVICE_TYPE_NAMES, type DeviceTypeData } from '../../utils/historyApi'
import { useRealtimeStore } from '../../stores/realtime'
import FactoryMap from '../FactoryMap.vue'
const realtimeStore = useRealtimeStore()  // 实时监控
const coreMetricStore = useCoreMetricStore()   // 核心指标
const environmentDataStore = useEnvironmentDataStore()  //环境数据
const telemetryData=useDeviceTelemetryDataStore()  //通信数据
const timeRange = ref('1h')
const showHistoryPanel = ref(false)


//环境数据统计图表配置
const environmentDataChartOptions = computed(() => {
  const boardList = environmentDataStore.boardList;
  // 确保数据按时间戳排序
  const sortedData = [...boardList].sort((a, b) => a.timestamp - b.timestamp);
  // 只取最新的10条数据
  const recentData = sortedData.slice(-10);
  return createLineChart({
    series: recentData.map(item => item.value),
    xAxis: recentData.map(item => new Date(item.timestamp).toLocaleTimeString()),
    status: recentData.map(item => item.status)
  });
})

// 请求量统计图表配置
const requestCountChartOptions = computed(() => createBarChart({
  series: telemetryData.boardData.map(item => item.value),
  xAxis: {
    type:'category',
    data: telemetryData.boardData.map(item => new Date(item.timestamp).toLocaleTimeString())},
  maxPoints: 10  // 限制显示最新的20条数据
}))


// 存储设备类型数据
const deviceTypeData = ref<DeviceTypeData[]>([])

// 获取设备类型数据
const fetchDeviceTypeData = async () => {
  const response = await historyApi.getDeviceStatus()
  deviceTypeData.value = response.data
}

// 设备类型分布图表配置
const deviceTypeDataChartOptions = computed(() => {
  const pieData = deviceTypeData.value.map(item => ({
    name: DEVICE_TYPE_NAMES[item.deviceType],
    value: item.count
  }))
  
  return createPieChart({
    series: pieData
  })
})


onMounted(() => {
  // 启动实时监控
  realtimeStore.setMonitoring(true)
  fetchDeviceTypeData()
})

const showHistory = ref(false)
const currentType = ref('')

const openHistory = (type: string) => {
  currentType.value = type
  showHistory.value = true
}

const handleCloseHistoryPanel = () => {
  showHistoryPanel.value = false
}
</script>

<style scoped>
.dashboard-main {
  padding: 20px;
  background-color: #1A2333;
  min-height: 100vh;
  color: #E5E7EB;
}

/* 控制栏样式 */
.control-bar {
  background-color: #243142;
  border: none;
  box-shadow: 0 0 15px rgba(74, 144, 226, 0.2);
  border-radius: 8px;
  backdrop-filter: blur(5px);
}

.control-bar :deep(.el-button--primary) {
  background-color: #4A90E2;
  border-color: #4A90E2;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.control-bar :deep(.el-button--primary)::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: 0.5s;
}

.control-bar :deep(.el-button--primary.is-active) {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
  color: #ffffff;
  box-shadow: 0 0 10px rgba(29, 78, 216, 0.4);
}

.control-bar :deep(.el-button--primary.is-active)::before {
  left: 100%;
}

.control-bar :deep(.el-button--primary.is-plain) {
  color: #4A90E2;
  background: rgba(74, 144, 226, 0.1);
  border-color: #4A90E2;
}

/* 卡片通用样式 */
:deep(.el-card) {
  background-color: #243142;
  border: none;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(74, 144, 226, 0.15);
}

:deep(.el-card__header) {
  border-bottom: 1px solid #334155;
  padding: 12px 20px;
}


.metric-item:hover {
  border-color: #4A90E2;
  box-shadow: 0 0 12px rgba(74, 144, 226, 0.2);
}

.metric-header {
  color: #94A3B8;
  font-size: 13px;
}

.metric-value {
  color: #E5E7EB;
  font-size: 22px;
  font-weight: 600;
}

/* Tag样式调整 */
:deep(.el-tag--success) {
  background: linear-gradient(45deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.2));
  border: 1px solid rgba(0, 255, 136, 0.5);
  color: #00FF88;
  text-shadow: 0 0 8px rgba(0, 255, 136, 0.3);
}

:deep(.el-tag--danger) {
  background-color: rgba(255, 86, 86, 0.1);
  border-color: #FF5656;
  color: #FF5656;
}

/* 加载状态样式 */
.loading-placeholder {
  color: #94A3B8;
}

/* 图表容器样式 */
.chart-card {
  background-color: #243142;
}

.chart-card :deep(.el-card__body) {
  padding: 12px;
}

/* 地图卡片特殊样式 */
.map-card {
  background: radial-gradient(circle at 50% 0%, #243142 0%, #1A2333 100%);
  border: 1px solid rgba(74, 144, 226, 0.2);
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #1A2333;
}

::-webkit-scrollbar-thumb {
  background: #4A90E2;
  border-radius: 3px;
}


.metric-card {
  height: 150px;
  margin-bottom: 20px;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-value {
  font-size: 80%;
  font-weight: bold;
  text-align: center;
  margin-top: 10px;
  text-shadow: 0 0 10px rgba(74, 144, 226, 0.3);
}

.chart-card {
  height: 300px;
  position: relative;
}

.el-card__body {
  padding: 0;
}

.chart-placeholder {
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.control-bar {
  height: 50px;
  margin-bottom: 10px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.time-range {
  width: 150px;
  margin-right: 10px;
  margin-left: 10px;
}

.metrics-panel {
  height: 300px;  /* 减小面板高度 */
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.metrics-panel:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.4);
}

.metrics-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.metrics-grid {
  padding: 0;  /* 减小内边距 */
}

.metric-item {
  background-color: #1A2333;
  color: #606266;
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 4px;
  padding: 6px;  /* 减小内边距 */
  margin-bottom: 12px;  /* 减小底部间距 */
  transition: all 0.3s;
  height: 95px;  /* 限制每个卡片的高度 */
  position: relative;
  overflow: hidden;
}

.metric-item::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 25%,
    rgba(74, 144, 226, 0.1) 50%,
    transparent 75%
  );
  animation: shine 3s infinite linear;
}
@keyframes shine {
  100% { transform: translate(50%, 50%); }
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;  /* 稍微减小字体 */
  margin-bottom: 6px;  /* 减小间距 */
}

.metric-value {
  font-size: 20px;  /* 减小数值字体大小 */
  font-weight: bold;
  text-align: center;
  margin-top: 6px;  /* 减小上边距 */
}

/* 状态颜色 */
.metric-value.normal {
  color: #67C23A;  /* 绿色 */
}

.metric-value.warning {
  color: #E6A23C;  /* 黄色 */
}

.metric-value.error {
  color: #F56C6C;  /* 红色 */
}

.panel-header {
  font-size: 16px;
  font-weight: bold;
  color: #E5E7EB;
  letter-spacing: 1px;
  text-transform: uppercase;
  opacity: 0.9;
}

.map-card {
  height: 610px;
}

.loading-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #909399;
}
</style>
