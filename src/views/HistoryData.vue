<template>
  <main-layout>
    <div class="history-data-page">
      <h3 class="page-title">历史数据查询与报表</h3>

      <!-- 功能切换选项卡 -->
      <el-tabs v-model="activeTab" class="func-tabs" type="border-card">
        <el-tab-pane label="历史数据查询" name="history">
          <!-- 历史数据查询模块 -->
          <div class="history-query-module">
            <!-- 筛选区 -->
            <div class="filter-section">
              <el-row :gutter="20" align="middle">
                <el-col :span="6">
                  <div class="filter-item">
                    <span class="filter-label">设备名称</span>
                    <el-select v-model="queryForm.deviceId" placeholder="请选择设备" clearable style="width: 100%">
                      <el-option v-for="device in deviceOptions" :key="device.value" :label="device.label"
                        :value="device.value" />
                    </el-select>
                  </div>
                </el-col>

                <el-col :span="10">
                  <div class="filter-item">
                    <span class="filter-label">时间范围</span>
                    <el-radio-group v-model="queryForm.timeRange">
                      <el-radio-button label="today">今日</el-radio-button>
                      <el-radio-button label="7days">近7天</el-radio-button>
                      <el-radio-button label="30days">近30天</el-radio-button>
                      <el-radio-button label="custom">自定义</el-radio-button>
                    </el-radio-group>
                  </div>
                </el-col>

                <el-col :span="8" v-if="queryForm.timeRange === 'custom'">
                  <div class="filter-item">
                    <span class="filter-label">自定义时间</span>
                    <el-date-picker v-model="queryForm.customRange" type="daterange" range-separator="至"
                      start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" />
                  </div>
                </el-col>
              </el-row>

              <el-row :gutter="20" style="margin-top: 15px;">
                <el-col :span="24">
                  <div class="filter-actions">
                    <el-button type="primary" :loading="loading" :disabled="!queryForm.deviceId" @click="handleQuery">
                      <el-icon>
                        <Search />
                      </el-icon>
                      查询
                    </el-button>
                    <el-button @click="handleReset">
                      <el-icon>
                        <Refresh />
                      </el-icon>
                      重置
                    </el-button>
                  </div>
                </el-col>
              </el-row>
            </div>

            <!-- 数据展示区 -->
            <div v-if="hasQueried" class="data-display-area">
              <!-- 指标历史数据表格 -->
              <div class="section">
                <div class="section-header">
                  <h4 class="section-title">指标历史数据</h4>
                  <div class="data-range-tips">
                    数据范围：<span class="range-text">{{ dataRangeText }}</span>
                  </div>
                </div>
                <VirtualTable :columns="indicatorColumns" :data="indicatorData" :height="300" :loading="loading" />
              </div>

              <!-- 趋势图 -->
              <div class="section">
                <h4 class="section-title">数据趋势图</h4>
                <div class="chart-container">
                  <BaseChart :options="trendChartOptions" :loading="loading" />
                </div>
              </div>

              <!-- 异常告警记录 -->
              <div class="section">
                <h4 class="section-title">异常告警记录</h4>
                <DataTable :columns="alarmColumns" :data="alarmData" :loading="loading" style="max-height: 300px" />
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="empty-state">
              <CommonEmpty description="请选择设备和时间范围后点击查询" />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="统计报表导出" name="report">
          <!-- 统计报表导出模块 -->
          <div class="report-export-module">
            <!-- 报表类型切换 -->
            <div class="report-type-section">
              <el-radio-group v-model="reportType" size="large">
                <el-radio-button label="device-run">设备运行统计报表</el-radio-button>
                <el-radio-button label="alarm-stat">异常告警统计报表</el-radio-button>
              </el-radio-group>
            </div>

            <!-- 报表筛选区 -->
            <div class="filter-section">
              <el-row :gutter="20" align="middle">
                <el-col :span="10">
                  <div class="filter-item">
                    <span class="filter-label">时间范围</span>
                    <el-radio-group v-model="reportForm.timeRange">
                      <el-radio-button label="today">今日</el-radio-button>
                      <el-radio-button label="7days">近7天</el-radio-button>
                      <el-radio-button label="30days">近30天</el-radio-button>
                      <el-radio-button label="custom">自定义</el-radio-button>
                    </el-radio-group>
                  </div>
                </el-col>

                <el-col :span="8" v-if="reportForm.timeRange === 'custom'">
                  <div class="filter-item">
                    <span class="filter-label">自定义时间</span>
                    <el-date-picker v-model="reportForm.customRange" type="daterange" range-separator="至"
                      start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" />
                  </div>
                </el-col>

                <el-col :span="6">
                  <el-button type="primary" :loading="reportLoading" @click="handleGenerateReport">
                    生成报表
                  </el-button>
                </el-col>
              </el-row>
            </div>

            <!-- 报表预览区 -->
            <div v-if="hasGeneratedReport" class="report-preview-area">
              <!-- 设备运行统计报表 -->
              <div v-if="reportType === 'device-run'" class="report-content">
                <h4 class="section-title">设备运行统计</h4>
                <VirtualTable :columns="deviceRunColumns" :data="deviceRunData" :height="350" />
              </div>

              <!-- 异常告警统计报表 -->
              <div v-else class="report-content">
                <div class="alarm-report-layout">
                  <div class="alarm-table-section">
                    <h4 class="section-title">异常告警统计</h4>
                    <VirtualTable :columns="alarmStatColumns" :data="alarmStatData" :height="350" />
                  </div>
                  <div class="alarm-chart-section">
                    <h4 class="section-title">告警类型分布</h4>
                    <div class="chart-container">
                      <BaseChart :options="alarmPieChartOptions" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- 导出操作区 -->
              <div class="export-section">
                <el-row justify="space-between" align="middle">
                  <el-button type="success" :disabled="!hasGeneratedReport" @click="handleExport">
                    <el-icon>
                      <Download />
                    </el-icon>
                    一键导出Excel
                  </el-button>

                  <div class="export-history">
                    <h5 class="history-title">导出历史</h5>
                    <DataTable :columns="exportHistoryColumns" :data="exportHistoryData" style="width: 400px" />
                  </div>
                </el-row>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="empty-state">
              <CommonEmpty description="请点击生成报表查看数据" />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </main-layout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import MainLayout from '../components/layout/MainLayout.vue'
import VirtualTable from '../components/common/VirtualTable/index.vue'
import DataTable from '../components/common/DataTable/index.vue'
import BaseChart from '../components/charts/BaseChart.vue'
import CommonEmpty from '../components/common/Empty/index.vue'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import type { EChartsOption } from 'echarts'

// ========== 基础状态 ==========
const activeTab = ref('history')
const loading = ref(false)
const reportLoading = ref(false)
const hasQueried = ref(false)
const hasGeneratedReport = ref(false)

// ========== 设备选项（假数据） ==========
const deviceOptions = [
  { label: '设备A-调配罐', value: 'deviceA' },
  { label: '设备B-灌装机', value: 'deviceB' },
  { label: '设备C-封盖机', value: 'deviceC' },
  { label: '设备D-贴标机', value: 'deviceD' },
]

// ========== 历史查询表单 ==========
const queryForm = reactive({
  deviceId: '',
  timeRange: 'today',
  customRange: [] as string[]
})

// ========== 报表表单 ==========
const reportType = ref('device-run')
const reportForm = reactive({
  timeRange: 'today',
  customRange: [] as string[]
})

// ========== 数据范围显示文本 ==========
const dataRangeText = computed(() => {
  if (queryForm.timeRange === 'today') {
    const today = new Date().toISOString().split('T')[0]
    return `${today} 00:00:00 ~ ${today} 23:59:59`
  }
  return '2026-02-24 00:00:00 ~ 2026-02-24 23:59:59'
})

// ========== 指标历史数据表格配置 ==========
import type { Column as VirtualColumn } from '../components/common/VirtualTable/types'
import type { Column as DataColumn } from '../components/common/DataTable/types'

const indicatorColumns: VirtualColumn[] = [
  { key: 'time', title: '采集时间', dataKey: 'time', width: 180 },
  { key: 'temperature', title: '温度(℃)', dataKey: 'temperature', width: 120 },
  { key: 'pressure', title: '压力(MPa)', dataKey: 'pressure', width: 120 },
  { key: 'speed', title: '转速(rpm)', dataKey: 'speed', width: 120 },
  {
    key: 'status',
    title: '状态',
    dataKey: 'status',
    width: 100,
    isStatus: true,
    statusCategory: 'indicator'
  },
  {
    key: 'actions',
    title: '操作',
    dataKey: 'actions',
    width: 120,
    isActions: true,
    actions: [
      { label: '查看详情', type: 'primary', onClick: (row: any) => console.log('查看详情', row) }
    ]
  }
]

// ========== 指标历史数据（假数据） ==========
const indicatorData = ref<any[]>([])

// ========== 告警记录表格配置 ==========
const alarmColumns: DataColumn[] = [
  { prop: 'alarmTime', label: '告警时间', width: 180 },
  { prop: 'alarmType', label: '告警类型', width: 120 },
  { prop: 'description', label: '告警描述', width: 250 },
  {
    prop: 'status',
    label: '处理状态',
    width: 100,
    isStatus: true,
    statusCategory: 'alarm'
  }
]

// ========== 告警记录数据（假数据） ==========
const alarmData = ref<any[]>([])

// ========== 趋势图配置 ==========
const trendChartOptions = computed<EChartsOption>(() => {
  const times = indicatorData.value.map(d => d.time)
  const temperatures = indicatorData.value.map(d => d.temperature)
  const pressures = indicatorData.value.map(d => d.pressure)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['温度(℃)', '压力(MPa)'],
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: times
    },
    yAxis: [
      {
        type: 'value',
        name: '温度(℃)',
        position: 'left',
        axisLine: { show: true, lineStyle: { color: '#5470c6' } }
      },
      {
        type: 'value',
        name: '压力(MPa)',
        position: 'right',
        axisLine: { show: true, lineStyle: { color: '#91cc75' } }
      }
    ],
    series: [
      {
        name: '温度(℃)',
        type: 'line',
        yAxisIndex: 0,
        data: temperatures,
        smooth: true,
        itemStyle: { color: '#5470c6' }
      },
      {
        name: '压力(MPa)',
        type: 'line',
        yAxisIndex: 1,
        data: pressures,
        smooth: true,
        itemStyle: { color: '#91cc75' }
      }
    ]
  }
})

// ========== 设备运行统计表格配置 ==========
const deviceRunColumns: VirtualColumn[] = [
  { key: 'deviceName', title: '设备名称', dataKey: 'deviceName', width: 150 },
  { key: 'runTime', title: '运行时长(h)', dataKey: 'runTime', width: 120 },
  { key: 'onlineRate', title: '在线率(%)', dataKey: 'onlineRate', width: 120 },
  { key: 'alarmCount', title: '异常告警次数', dataKey: 'alarmCount', width: 130 },
  { key: 'mtbf', title: 'MTBF(h)', dataKey: 'mtbf', width: 120 }
]

// ========== 设备运行统计数据（假数据） ==========
const deviceRunData = ref<any[]>([])

// ========== 告警统计表格配置 ==========
const alarmStatColumns: VirtualColumn[] = [
  { key: 'deviceName', title: '设备名称', dataKey: 'deviceName', width: 150 },
  { key: 'alarmType', title: '异常类型', dataKey: 'alarmType', width: 150 },
  { key: 'count', title: '告警次数', dataKey: 'count', width: 120 },
  { key: 'percentage', title: '占比(%)', dataKey: 'percentage', width: 120 }
]

// ========== 告警统计数据（假数据） ==========
const alarmStatData = ref<any[]>([])

// ========== 告警饼图配置 ==========
const alarmPieChartOptions = computed<EChartsOption>(() => {
  const data = alarmStatData.value.map(item => ({
    name: item.alarmType,
    value: item.count
  }))

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center'
    },
    series: [
      {
        name: '告警类型',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {c}'
        },
        data: data.length > 0 ? data : [
          { value: 0, name: '暂无数据' }
        ]
      }
    ],
    color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de']
  }
})

// ========== 导出历史配置 ==========
const exportHistoryColumns: DataColumn[] = [
  { prop: 'exportTime', label: '导出时间', width: 150 },
  { prop: 'reportType', label: '报表类型', width: 150 },
  { prop: 'status', label: '状态', width: 100, isStatus: true, statusCategory: 'export' }
]

// ========== 导出历史数据（假数据） ==========
const exportHistoryData = ref<any[]>([])

// ========== 查询处理 ==========
const handleQuery = async () => {
  if (!queryForm.deviceId) {
    return
  }

  loading.value = true

  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 500))

  // 生成假数据
  generateMockIndicatorData()
  generateMockAlarmData()

  hasQueried.value = true
  loading.value = false
}

// ========== 生成指标假数据 ==========
const generateMockIndicatorData = () => {
  const data = []
  const baseTime = new Date()
  baseTime.setHours(9, 0, 0, 0)

  for (let i = 0; i < 20; i++) {
    const time = new Date(baseTime.getTime() + i * 30 * 60 * 1000)
    data.push({
      time: time.toLocaleString('zh-CN', { hour12: false }),
      temperature: (35 + Math.random() * 5).toFixed(1),
      pressure: (1.0 + Math.random() * 0.5).toFixed(2),
      speed: Math.floor(1400 + Math.random() * 200),
      status: Math.random() > 0.8 ? '1' : '0'
    })
  }
  indicatorData.value = data
}

// ========== 生成告警假数据 ==========
const generateMockAlarmData = () => {
  alarmData.value = [
    {
      alarmTime: '2026-02-24 10:15:30',
      alarmType: '温度过高',
      description: `${queryForm.deviceId}温度超过阈值(36℃)`,
      status: '0'
    },
    {
      alarmTime: '2026-02-24 14:22:18',
      alarmType: '压力异常',
      description: `${queryForm.deviceId}压力超出正常范围`,
      status: '1'
    }
  ]
}

// ========== 重置处理 ==========
const handleReset = () => {
  queryForm.deviceId = ''
  queryForm.timeRange = 'today'
  queryForm.customRange = []
  hasQueried.value = false
  indicatorData.value = []
  alarmData.value = []
}

// ========== 生成报表处理 ==========
const handleGenerateReport = async () => {
  reportLoading.value = true

  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 500))

  if (reportType.value === 'device-run') {
    generateMockDeviceRunData()
  } else {
    generateMockAlarmStatData()
  }

  hasGeneratedReport.value = true
  reportLoading.value = false
}

// ========== 生成设备运行假数据 ==========
const generateMockDeviceRunData = () => {
  deviceRunData.value = [
    { deviceName: '设备A-调配罐', runTime: '120', onlineRate: '99.8', alarmCount: 5, mtbf: '480' },
    { deviceName: '设备B-灌装机', runTime: '115', onlineRate: '99.5', alarmCount: 8, mtbf: '360' },
    { deviceName: '设备C-封盖机', runTime: '118', onlineRate: '99.7', alarmCount: 3, mtbf: '520' },
    { deviceName: '设备D-贴标机', runTime: '122', onlineRate: '99.9', alarmCount: 2, mtbf: '600' }
  ]
}

// ========== 生成告警统计假数据 ==========
const generateMockAlarmStatData = () => {
  alarmStatData.value = [
    { deviceName: '设备A-调配罐', alarmType: '温度过高', count: 3, percentage: '37.5' },
    { deviceName: '设备A-调配罐', alarmType: '压力异常', count: 2, percentage: '25.0' },
    { deviceName: '设备B-灌装机', alarmType: '温度过高', count: 2, percentage: '25.0' },
    { deviceName: '设备B-灌装机', alarmType: '其他', count: 1, percentage: '12.5' }
  ]
}

// ========== 导出处理 ==========
const handleExport = () => {
  // 模拟导出
  const now = new Date().toLocaleString('zh-CN')
  const typeName = reportType.value === 'device-run' ? '设备运行统计报表' : '异常告警统计报表'

  exportHistoryData.value.unshift({
    exportTime: now,
    reportType: typeName,
    status: 'success'
  })

  // 限制历史记录数量
  if (exportHistoryData.value.length > 5) {
    exportHistoryData.value = exportHistoryData.value.slice(0, 5)
  }

  // 模拟文件下载
  const blob = new Blob(['报表数据示例'], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${typeName}_${new Date().toISOString().split('T')[0]}.xls`
  link.click()
  URL.revokeObjectURL(url)
}

// ========== 监听报表类型切换 ==========
watch(reportType, () => {
  hasGeneratedReport.value = false
})
</script>

<style scoped>
.history-data-page {
  padding: var(--spacing-base);
  margin: var(--spacing-base);
  background-color: var(--bg-main);
  min-height: calc(100vh - 100px);
}

.page-title {
  font-size: var(--font-lg);
  font-weight: bold;
  margin-bottom: var(--spacing-base);
  color: var(--text-primary);
}

/* 功能选项卡样式 */
.func-tabs :deep(.el-tabs__header) {
  margin-bottom: var(--spacing-base);
}

.func-tabs :deep(.el-tabs__content) {
  padding: var(--spacing-base) 0;
}

/* 筛选区样式 */
.filter-section {
  background-color: var(--bg-secondary);
  padding: var(--spacing-base);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
}

.filter-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.filter-label {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  font-weight: 500;
  white-space: nowrap;
  min-width: 70px;
}

.filter-actions {
  display: flex;
  gap: var(--spacing-sm);
}

/* 数据展示区样式 */
.data-display-area {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.section {
  background-color: var(--bg-secondary);
  padding: var(--spacing-base);
  border-radius: var(--radius-md);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-base);
}

.section-title {
  font-size: var(--font-base);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-base) 0;
}

.data-range-tips {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.range-text {
  font-weight: 600;
  color: var(--primary);
}

.chart-container {
  height: 300px;
  width: 100%;
}

/* 报表模块样式 */
.report-type-section {
  margin-bottom: var(--spacing-base);
  padding: var(--spacing-base);
  background-color: var(--bg-secondary);
  border-radius: var(--radius-md);
  text-align: center;
}

.report-preview-area {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.alarm-report-layout {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: var(--spacing-base);
}

.alarm-table-section,
.alarm-chart-section {
  background-color: var(--bg-secondary);
  padding: var(--spacing-base);
  border-radius: var(--radius-md);
}

.export-section {
  background-color: var(--bg-secondary);
  padding: var(--spacing-base);
  border-radius: var(--radius-md);
}

.history-title {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-sm) 0;
}

/* 空状态样式 */
.empty-state {
  padding: 60px 0;
  background-color: var(--bg-secondary);
  border-radius: var(--radius-md);
}

/* 响应式适配 */
@media (max-width: 1200px) {
  .alarm-report-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .filter-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }

  .filter-label {
    min-width: auto;
  }
}
</style>
