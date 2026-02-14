<template>
  <!-- 工厂地图容器组件 -->
  <div class="factory-map-container">
    <!-- 地图头部控制区 -->
    <div class="map-header">
      <!-- 地图控制按钮组 -->
      <div class="map-controls">
        <el-button-group>
          <el-button @click="zoomIn" :icon="Plus" size="small">放大</el-button>
          <el-button @click="zoomOut" :icon="Minus" size="small">缩小</el-button>
          <el-button @click="resetView" :icon="Refresh" size="small">重置</el-button>
        </el-button-group>
      </div>
      <!-- 图例 -->
      <div class="map-legend">
        <div class="legend-items">
          <div class="legend-item">
            <div class="legend-color" style="background-color: #4caf50;"></div>
            <span>在线</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #f44336;"></div>
            <span>离线</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #ff9800;"></div>
            <span>警告</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #9e9e9e;"></div>
            <span>错误</span>
          </div>
        </div>
      </div>
    </div>

    <div class="map-content" ref="mapContainer">
      <svg ref="svgElement" :width="svgWidth" :height="svgHeight" :viewBox="`0 0 ${baseWidth} ${baseHeight}`"
        class="factory-svg" @mousedown="startPan" @mousemove="onPan" @mouseup="endPan" @mouseleave="endPan"
        @wheel="onWheel">
        <!-- 工厂区域 -->
        <g class="zones">
          <path v-for="zone in zones" :key="zone.id" :d="zone.path" :fill="zone.color" :stroke="darkenColor(zone.color)"
            stroke-width="2" fill-opacity="0.3" class="zone-area" />

          <!-- 区域标签 -->
          <text v-for="zone in zones" :key="`label-${zone.id}`" :x="getZoneLabelPosition(zone).x"
            :y="getZoneLabelPosition(zone).y" text-anchor="middle" class="zone-label" fill="#fff" font-size="16"
            font-weight="bold">
            {{ zone.name }}
          </text>
        </g>

        <!-- 设备点位 -->
        <g class="devices">
          <g v-for="device in devices" :key="device.id" class="device-group" @click="showDeviceInfo(device)">
            <!-- 设备图标 -->
            <circle :cx="device.x" :cy="device.y" :r="8" :fill="getDeviceColor(device.status)"
              :stroke="getDeviceStrokeColor(device.status)" stroke-width="2" class="device-icon" />

            <!-- 设备状态指示器 -->
            <circle v-if="device.status === 'warning'" :cx="device.x + 6" :cy="device.y - 6" r="3" fill="#ff9800"
              class="status-indicator" />

            <!-- 设备标签 -->
            <text :x="device.x" :y="device.y + 20" text-anchor="middle" class="device-label" fill="#fff" font-size="10">
              {{ device.position }}
            </text>
          </g>
        </g>
      </svg>
    </div>

  </div>


  <!-- 设备信息弹窗 -->
  <el-dialog v-model="showDeviceDialog" :title="selectedDevice?.name || '设备信息'" width="400px"
    :before-close="closeDeviceDialog">
    <div v-if="selectedDevice" class="device-info">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="设备名称">
          {{ selectedDevice.name }}
        </el-descriptions-item>
        <el-descriptions-item label="设备类型">
          {{ selectedDevice.type }}
        </el-descriptions-item>
        <el-descriptions-item label="位置编码">
          {{ selectedDevice.position }}
        </el-descriptions-item>
        <el-descriptions-item label="所属区域">
          {{ getZoneName(selectedDevice.zone) }}
        </el-descriptions-item>
        <el-descriptions-item label="设备状态">
          <StatusTag category="device" :value="selectedDevice.status" />
        </el-descriptions-item>
      </el-descriptions>

      <!-- 设备参数 -->
      <div v-if="selectedDevice.parameters" class="device-parameters">
        <h4>设备参数</h4>
        <el-row :gutter="16">
          <el-col :span="12" v-for="(value, key) in selectedDevice.parameters" :key="key">
            <div class="parameter-item">
              <span class="parameter-label">{{ getParameterLabel(key) }}:</span>
              <span class="parameter-value">{{ formatParameterValue(key, value) }}</span>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>
  </el-dialog>

</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { Plus, Minus, Refresh } from '@element-plus/icons-vue'
import type { FactoryDevice, FactoryZone } from '@/utils/type'
import { useFactoryDeviceDataStore } from '@/stores/FactoryDeviceData'

// 响应式数据
const mapContainer = ref<HTMLElement>()
const svgElement = ref<SVGElement>()
const showDeviceDialog = ref(false)
const selectedDevice = ref<FactoryDevice | null>(null)

// SVG尺寸和缩放
const baseWidth = 800
const baseHeight = 600
const svgWidth = ref(800)
const svgHeight = ref(600)
const scale = ref(1)
const panX = ref(0)
const panY = ref(0)

// 拖拽状态
const isPanning = ref(false)
const lastPanPoint = reactive({ x: 0, y: 0 })

// 工厂区域数据
// 定义工厂区域数据，包含各区域的ID、名称、颜色和SVG路径
const zones = ref<FactoryZone[]>([
  {
    id: 'production', // 区域唯一标识
    name: '生产区', // 区域显示名称
    color: '#2196f3', // 区域填充颜色
    path: 'M 50 50 L 350 50 L 350 250 L 50 250 Z' // SVG路径定义区域形状
  },
  {
    id: 'storage',
    name: '仓储区',
    color: '#4caf50',
    path: 'M 400 50 L 750 50 L 750 200 L 400 200 Z'
  },
  {
    id: 'office',
    name: '办公区',
    color: '#ff9800',
    path: 'M 400 250 L 600 250 L 600 400 L 400 400 Z'
  },
  {
    id: 'testing',
    name: '检测区',
    color: '#9c27b0',
    path: 'M 650 250 L 750 250 L 750 400 L 650 400 Z'
  },
  {
    id: 'maintenance',
    name: '维护区',
    color: '#607d8b',
    path: 'M 50 300 L 350 300 L 350 550 L 50 550 Z'
  }
])

const factoryDeviceDataStore = useFactoryDeviceDataStore()
// 使用计算属性来保持数据响应性
const devices = computed(() => factoryDeviceDataStore.allDevices)

// 示例设备数据
// const devices = ref<FactoryDevice[]>([
//   // 生产区设备
//   { id: 'prod-001', name: '数控机床A1', type: '数控机床', lastUpdate: Date.now(), x: 100, y: 100, status: 'online', zone: 'production', position: '1区1排', parameters: { temperature: 45, power: 85 } },
//   { id: 'prod-002', name: '数控机床A2', type: '数控机床',lastUpdate: Date.now(),x: 200, y: 100, status: 'online', zone: 'production', position: '1区2排', parameters: { temperature: 42, power: 78 } },
//   { id: 'prod-003', name: '装配线B1', type: '装配线',lastUpdate: Date.now(), x: 150, y: 150, status: 'warning', zone: 'production', position: '1区3排', parameters: { temperature: 38, vibration: 2.1 } },
//   { id: 'prod-004', name: '焊接机器人C1', type: '焊接机器人',lastUpdate: Date.now(), x: 250, y: 150, status: 'online', zone: 'production', position: '1区4排', parameters: { temperature: 55, power: 92 } },
//   { id: 'prod-005', name: '质检设备D1', type: '质检设备',lastUpdate: Date.now(), x: 300, y: 200, status: 'offline', zone: 'production', position: '1区5排', parameters: { temperature: 25 } },

//   // 仓储区设备
//   { id: 'stor-001', name: '自动货架A', type: '自动货架',lastUpdate: Date.now(), x: 450, y: 80, status: 'online', zone: 'storage', position: '2区1排', parameters: { temperature: 28, power: 45 } },
//   { id: 'stor-002', name: '自动货架B', type: '自动货架',lastUpdate: Date.now(), x: 550, y: 80, status: 'online', zone: 'storage', position: '2区2排', parameters: { temperature: 26, power: 42 } },
//   { id: 'stor-003', name: '输送带系统', type: '输送带', lastUpdate: Date.now(),x: 650, y: 120, status: 'online', zone: 'storage', position: '2区3排', parameters: { temperature: 32, power: 38 } },
//   { id: 'stor-004', name: '叉车充电桩', type: '充电桩', lastUpdate: Date.now(),x: 500, y: 150, status: 'warning', zone: 'storage', position: '2区4排', parameters: { power: 95 } },
//   { id: 'stor-005', name: '温湿度监控', type: '环境监控',lastUpdate: Date.now(), x: 600, y: 170, status: 'online', zone: 'storage', position: '2区5排', parameters: { temperature: 24, pressure: 1013 } },

//   // 办公区设备
//   { id: 'off-001', name: '服务器机柜', type: '服务器', lastUpdate: Date.now(),x: 450, y: 300, status: 'online', zone: 'office', position: '3区1排', parameters: { temperature: 35, power: 78 } },
//   { id: 'off-002', name: '网络交换机', type: '网络设备', lastUpdate: Date.now(),x: 500, y: 320, status: 'online', zone: 'office', position: '3区2排', parameters: { temperature: 28, power: 25 } },
//   { id: 'off-003', name: 'UPS电源', type: 'UPS', lastUpdate: Date.now(),x: 550, y: 350, status: 'online', zone: 'office', position: '3区3排', parameters: { power: 65 } },

//   // 检测区设备
//   { id: 'test-001', name: 'X射线检测仪', type: '检测设备', lastUpdate: Date.now(),x: 680, y: 280, status: 'online', zone: 'testing', position: '4区1排', parameters: { temperature: 40, power: 120 } },
//   { id: 'test-002', name: '超声波检测仪', type: '检测设备',lastUpdate: Date.now(), x: 720, y: 320, status: 'error', zone: 'testing', position: '4区2排', parameters: { temperature: 22 } },
//   { id: 'test-003', name: '光谱分析仪', type: '分析设备', lastUpdate: Date.now(),x: 700, y: 360, status: 'online', zone: 'testing', position: '4区3排', parameters: { temperature: 45, power: 85 } },

//   // 维护区设备
//   { id: 'main-001', name: '空压机A', type: '空压机', lastUpdate: Date.now(),x: 100, y: 350, status: 'online', zone: 'maintenance', position: '5区1排', parameters: { temperature: 65, pressure: 8.5, power: 110 } },
//   { id: 'main-002', name: '空压机B', type: '空压机', lastUpdate: Date.now(),x: 150, y: 380, status: 'warning', zone: 'maintenance', position: '5区2排', parameters: { temperature: 72, pressure: 8.2, power: 105 } },
//   { id: 'main-003', name: '冷却塔', type: '冷却设备',lastUpdate: Date.now(), x: 200, y: 420, status: 'online', zone: 'maintenance', position: '5区3排', parameters: { temperature: 18, power: 75 } },
//   { id: 'main-004', name: '变压器', type: '电力设备',lastUpdate: Date.now(), x: 280, y: 450, status: 'online', zone: 'maintenance', position: '5区4排', parameters: { temperature: 55, power: 200 } },
//   { id: 'main-005', name: '废料处理器', type: '处理设备',lastUpdate: Date.now(), x: 120, y: 500, status: 'offline', zone: 'maintenance', position: '5区5排', parameters: { temperature: 30 } }
// ])

// ===== 工具方法 =====
/**
 * 根据设备状态获取对应的显示颜色
 * @param status 设备状态：online(在线)、offline(离线)、warning(警告)、error(错误)
 * @returns 对应状态的颜色代码
 */
const getDeviceColor = (status: string) => {
  const colors = {
    online: '#4caf50', // 在线状态 - 绿色
    offline: '#f44336', // 离线状态 - 红色
    warning: '#ff9800', // 警告状态 - 橙色
    error: '#9e9e9e' // 错误状态 - 灰色
  }
  return colors[status as keyof typeof colors] || '#9e9e9e'
}

const getDeviceStrokeColor = (status: string) => {
  const colors = {
    online: '#2e7d32',
    offline: '#c62828',
    warning: '#f57c00',
    error: '#616161'
  }
  return colors[status as keyof typeof colors] || '#616161'
}

const darkenColor = (color: string) => {
  // 简单的颜色加深函数
  const colorMap: { [key: string]: string } = {
    '#2196f3': '#1976d2',
    '#4caf50': '#388e3c',
    '#ff9800': '#f57c00',
    '#9c27b0': '#7b1fa2',
    '#607d8b': '#455a64'
  }
  return colorMap[color] || color
}

const getZoneLabelPosition = (zone: FactoryZone) => {
  // 根据区域路径计算标签位置（简化版本）
  const positions: { [key: string]: { x: number, y: number } } = {
    production: { x: 200, y: 80 },
    storage: { x: 575, y: 80 },
    office: { x: 500, y: 280 },
    testing: { x: 700, y: 280 },
    maintenance: { x: 200, y: 330 }
  }
  return positions[zone.id] || { x: 400, y: 300 }
}

const getZoneName = (zoneId: string) => {
  const zone = zones.value.find(z => z.id === zoneId)
  return zone?.name || '未知区域'
}



/**
 * 获取参数的中文标签
 * @param key 参数键名
 * @returns 参数的中文显示名称
 */
const getParameterLabel = (key: string | number): string => {
  const labelMap: { [key: string]: string } = {
    temperature: '温度',
    pressure: '压力',
    vibration: '振动',
    power: '功率'
  }
  return labelMap[String(key)] || String(key)
}

/**
 * 格式化参数值，添加适当的单位
 * @param key 参数键名
 * @param value 参数值
 * @returns 格式化后的参数值（带单位）
 */
const formatParameterValue = (key: string | number, value: any): string => {
  const unitMap: { [key: string]: string } = {
    temperature: '°C',
    pressure: 'bar',
    vibration: 'm/s²',
    power: '%'
  }
  const unit = unitMap[String(key)] || ''
  return `${value}${unit}`
}

// ===== 交互功能方法 =====
/**
 * 显示设备详细信息对话框
 * @param device 选中的设备对象
 */
const showDeviceInfo = (device: FactoryDevice) => {
  selectedDevice.value = device
  showDeviceDialog.value = true
}

/**
 * 关闭设备详情对话框并清空选中的设备
 */
const closeDeviceDialog = () => {
  showDeviceDialog.value = false
  selectedDevice.value = null
}

// ===== 地图缩放和平移功能 =====
/**
 * 放大地图
 */
const zoomIn = () => {
  scale.value = Math.min(scale.value * 1.2, 3)
  updateSvgSize()
  updateViewBox()
}

/**
 * 缩小地图
 */
const zoomOut = () => {
  scale.value = Math.max(scale.value / 1.2, 0.5)
  updateSvgSize()
  updateViewBox()
}

/**
 * 重置地图视图到初始状态
 */
const resetView = () => {
  scale.value = 1
  panX.value = 0
  panY.value = 0
  updateSvgSize()
  updateViewBox()
}

const updateSvgSize = () => {
  if (!mapContainer.value) return

  const containerRect = mapContainer.value.getBoundingClientRect()
  svgWidth.value = containerRect.width
  svgHeight.value = containerRect.height
}

// 拖拽功能
const startPan = (event: MouseEvent) => {
  isPanning.value = true
  lastPanPoint.x = event.clientX
  lastPanPoint.y = event.clientY
}

const onPan = (event: MouseEvent) => {
  if (!isPanning.value) return

  const deltaX = event.clientX - lastPanPoint.x
  const deltaY = event.clientY - lastPanPoint.y

  panX.value += deltaX / scale.value
  panY.value += deltaY / scale.value

  lastPanPoint.x = event.clientX
  lastPanPoint.y = event.clientY

  updateViewBox()
}

const endPan = () => {
  isPanning.value = false
}

// 鼠标滚轮缩放
const onWheel = (event: WheelEvent) => {
  event.preventDefault()

  const delta = event.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(0.5, Math.min(3, scale.value * delta))

  if (newScale !== scale.value) {
    scale.value = newScale
    updateSvgSize()
  }
}

const updateViewBox = () => {
  if (!svgElement.value) return

  const viewBoxX = -panX.value
  const viewBoxY = -panY.value
  const viewBoxWidth = baseWidth / scale.value
  const viewBoxHeight = baseHeight / scale.value

  svgElement.value.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`)
}

// 生命周期
onMounted(() => {
  updateSvgSize()

  // 监听窗口大小变化
  const resizeObserver = new ResizeObserver(() => {
    updateSvgSize()
  })

  if (mapContainer.value) {
    resizeObserver.observe(mapContainer.value)
  }

  // 清理函数
  return () => {
    resizeObserver.disconnect()
  }
})
</script>

<style scoped>
.factory-map-container {
  width: 500px;
  height: 500px;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-base);
}

.map-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.factory-svg {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.factory-svg:active {
  cursor: grabbing;
}

.zone-area {
  transition: fill-opacity 0.3s ease;
}

.zone-area:hover {
  fill-opacity: 0.5;
}

.zone-label {
  pointer-events: none;
  user-select: none;
}

.device-group {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.device-group:hover {
  transform: scale(1.2);
}

.device-icon {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.device-label {
  pointer-events: none;
  user-select: none;
}

.status-indicator {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }

  100% {
    opacity: 1;
  }
}

.map-legend {
  padding: var(--spacing-sm);
  border-radius: var(--radius-base);
  box-shadow: var(--shadow-light);
  min-width: 120px;
}

.map-legend h4 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-xs);
  color: var(--text-white);
}

.legend-items {
  display: flex;
  flex-direction: row;
  gap: var(--spacing-xs);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-xs);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.device-info {
  padding: var(--spacing-base) 0;
}

.device-parameters {
  margin-top: var(--spacing-base);
}

.device-parameters h4 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--text-white);
}

.parameter-item {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-xs) 0;
  font-size: var(--font-sm);
}

.parameter-label {
  color: var(--text-white);
}

.parameter-value {
  font-weight: 500;
  color: var(--text-white);
}
</style>
