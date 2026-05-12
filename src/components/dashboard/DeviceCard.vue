<template>
  <el-card class="device-card" :class="{ 'is-alarm': hasAlarm }">
    <!-- 卡片头部 -->
    <template #header>
      <div class="device-header">
        <div>
          <h3>{{ deviceData.device_name }}</h3>
          <span class="device-id">ID: {{ deviceData.id }}</span>
        </div>
        <el-tag :type="statusTagType" size="large">
          {{ statusText }}
        </el-tag>
      </div>
    </template>

    <!-- 参数列表 -->
    <div class="params-list">
      <div v-for="(param, key) in deviceData.monitor_data" :key="key" class="param-row"
        :class="{ 'is-alarm': param.status === 'alarm' }">
        <span class="param-label">{{ getParamLabel(key) }}</span>
        <span class="param-value">
          {{ param.value.toFixed(1) }} {{ param.unit }}
        </span>
      </div>
    </div>

    <!-- 告警提示（仅在告警时显示） -->
    <!-- <div v-if="hasAlarm" class="alarm-tips">
      <el-icon>
        <Warning />
      </el-icon>
      <span>{{ alarmMessage }}</span>
    </div> -->
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Warning } from '@element-plus/icons-vue'
import { useRealtimeStore } from '../../stores/realtime'

interface DeviceData {
  id: number
  device_name: string
  device_type: string
  status: number  // 0-离线 1-在线 2-故障
  monitor_data: Record<string, {
    value: number
    unit: string
    status: string
  }>
}

const props = defineProps<{
  deviceData: DeviceData
}>()

const realtimeStore = useRealtimeStore()

// 参数中文标签映射
const paramLabels: Record<string, string> = {
  temp: '温度',
  level: '液位',
  current: '电流',
  ph: 'pH值'
}

const getParamLabel = (key: string): string => {
  return paramLabels[key] || key
}

// 是否有告警
const hasAlarm = computed(() => {
  return Object.values(props.deviceData.monitor_data).some(p => p.status === 'alarm')
})

// 告警消息
const alarmMessage = computed(() => {
  const alarmParams = Object.entries(props.deviceData.monitor_data)
    .filter(([_, v]) => v.status === 'alarm')
    .map(([k, _]) => getParamLabel(k))
  return `${alarmParams.join('、')} 异常`
})

// 设备状态文本（仅根据 WebSocket 连接状态判断）
const statusText = computed(() => {
  return realtimeStore.isConnected ? '在线' : '离线'
})

// 设备状态标签类型（仅根据 WebSocket 连接状态判断）
const statusTagType = computed(() => {
  return realtimeStore.isConnected ? 'success' : 'info'
})
</script>

<style scoped>
.device-card {
  height: 100%;
  transition: all 0.3s;
}

.device-card.is-alarm {
  border-color: var(--el-color-danger);
  box-shadow: 0 0 20px rgba(245, 108, 108, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {

  0%,
  100% {
    box-shadow: 0 0 20px rgba(245, 108, 108, 0.3);
  }

  50% {
    box-shadow: 0 0 30px rgba(245, 108, 108, 0.6);
  }
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.device-header h3 {
  margin: 0;
  font-size: 18px;
}

.device-id {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.params-list {
  padding: 10px 0;
}

.param-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s;
}

.param-row:last-child {
  border-bottom: none;
}

.param-row.is-alarm {
  background-color: rgba(245, 108, 108, 0.1);
  padding: 12px 10px;
  margin: 0 -10px;
  border-radius: 4px;
}

.param-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.param-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.param-row.is-alarm .param-value {
  color: var(--el-color-danger);
}

.alarm-tips {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 8px;
  background-color: rgba(245, 108, 108, 0.1);
  border-radius: 4px;
  color: var(--el-color-danger);
  font-size: 14px;
}
</style>
