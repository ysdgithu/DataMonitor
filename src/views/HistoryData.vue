<template>
  <main-layout>
    <div class="history-data-page">

      <el-tabs v-model="activeTab" class="func-tabs" type="border-card">
        <el-tab-pane label="历史数据查询" name="history">
          <div class="history-query-module">
            <div class="filter-section filter-section--compact filter-section--history">
              <div class="filter-grid filter-grid-history">
                <div class="filter-item">
                  <span class="filter-label">设备名称</span>
                  <el-select v-model="queryForm.deviceId" placeholder="请选择设备" clearable class="filter-control filter-control--select">
                    <el-option v-for="device in deviceOptions" :key="device.value" :label="device.label"
                      :value="device.value" />
                  </el-select>
                </div>

                <div class="filter-item">
                  <span class="filter-label">时间范围</span>
                  <div class="range-button-group range-button-group--history">
                    <el-button
                      v-for="option in timeRangeOptions"
                      :key="option.value"
                      class="range-btn"
                      :class="{ 'is-active': queryForm.timeRange === option.value }"
                      @click="queryForm.timeRange = option.value"
                    >
                      {{ option.label }}
                    </el-button>
                  </div>
                </div>

                <div v-if="queryForm.timeRange === 'custom'" class="filter-item filter-item-wide">
                  <span class="filter-label">自定义时间</span>
                  <el-date-picker v-model="queryForm.customRange" type="daterange" range-separator="至"
                    start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" class="filter-control filter-control--date" />
                </div>
              </div>

              <div class="filter-actions">
                <el-button type="primary" :loading="loading" @click="handleQuery">
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
            </div>

            <div v-if="hasQueried" class="data-display-area">
              <div class="section">
                <div class="section-heading">
                  <div>
                    <div class="section-kicker">数据结果</div>
                  </div>
                  <div class="data-range-tips">数据范围：<span class="range-text">{{ dataRangeText }}</span></div>
                </div>
                <DataTable :columns="indicatorColumns" :data="indicatorData" :loading="loading" :show-pagination="true"
                  :current-page="currentPage" :page-size="pageSize" :total="total" @page-change="handlePageChange" />
              </div>
            </div>

            <div v-else class="empty-state">
              <CommonEmpty description="请选择时间范围后点击查询" />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="统计报表导出" name="report">
          <div class="report-export-module">
            <div class="report-type-section">
              <div class="report-type-group">
                <el-button
                  v-for="option in reportTypeOptions"
                  :key="option.value"
                  class="toggle-btn"
                  :class="{ 'is-active': reportType === option.value }"
                  @click="reportType = option.value"
                >
                  {{ option.label }}
                </el-button>
              </div>
              <div class="report-hint">
                当前预览：<strong>{{ reportType === 'device-run' ? '设备运行统计' : '异常告警统计' }}</strong>
              </div>
            </div>

            <div class="filter-section filter-section--compact filter-section--report">
              <div class="filter-grid filter-grid-report">
                <div class="filter-item">
                  <span class="filter-label">时间范围</span>
                  <div class="range-button-group range-button-group--report">
                    <el-button
                      v-for="option in timeRangeOptions"
                      :key="option.value"
                      class="range-btn"
                      :class="{ 'is-active': reportForm.timeRange === option.value }"
                      @click="reportForm.timeRange = option.value"
                    >
                      {{ option.label }}
                    </el-button>
                  </div>
                </div>

                <div v-if="reportForm.timeRange === 'custom'" class="filter-item filter-item-wide">
                  <span class="filter-label">自定义时间</span>
                  <el-date-picker v-model="reportForm.customRange" type="daterange" range-separator="至"
                    start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" class="filter-control" />
                </div>
              </div>

              <div class="filter-actions">
                <el-button type="primary" :loading="reportLoading" @click="handleGenerateReport">
                  生成报表
                </el-button>
              </div>
            </div>

            <div v-if="hasGeneratedReport" class="report-preview-area">
              <div v-if="reportType === 'device-run'" class="report-content">
                <div class="section-heading">
                  <div>
                    <div class="section-kicker">报表预览</div>
                    <h4 class="section-title">设备运行统计</h4>
                  </div>
                </div>
                <VirtualTable :columns="deviceRunColumns" :data="deviceRunData" :height="350" />
              </div>

              <div v-else class="report-content">
                <div class="alarm-report-layout">
                  <div class="alarm-table-section">
                    <div class="section-heading compact-header">
                      <div>
                        <div class="section-kicker">报表预览</div>
                        <h4 class="section-title">异常告警统计</h4>
                      </div>
                    </div>
                    <VirtualTable :columns="alarmStatColumns" :data="alarmStatData" :height="350" />
                  </div>
                  <div class="alarm-chart-section">
                    <div class="section-heading compact-header">
                      <div>
                        <div class="section-kicker">图表摘要</div>
                        <h4 class="section-title">告警类型分布</h4>
                      </div>
                    </div>
                    <div class="chart-container">
                      <BaseChart :options="alarmPieChartOptions" />
                    </div>
                  </div>
                </div>
              </div>

              <div class="export-section">
                <div class="export-layout">
                  <el-button type="success" :disabled="!hasGeneratedReport" @click="handleExport">
                    <el-icon>
                      <Download />
                    </el-icon>
                    一键导出Excel
                  </el-button>

                  <div class="export-history">
                    <h5 class="history-title">导出历史</h5>
                    <DataTable :columns="exportHistoryColumns" :data="exportHistoryData" style="width: 100%" />
                  </div>
                </div>
              </div>
            </div>

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
import { ref, reactive, computed, watch, onMounted } from 'vue'
import MainLayout from '../components/layout/MainLayout.vue'
import DataTable from '../components/common/DataTable/index.vue'
import VirtualTable from '../components/common/VirtualTable/index.vue'
import BaseChart from '../components/charts/BaseChart.vue'
import CommonEmpty from '../components/common/Empty/index.vue'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import type { EChartsOption } from 'echarts'
import { historyApi } from '../utils/historyApi'
import type { Column as DataColumn } from '../components/common/DataTable/types'
import { ElMessage } from 'element-plus'

// ========== 基础状态 ==========
const activeTab = ref('history')
const loading = ref(false)
const reportLoading = ref(false)
const hasQueried = ref(false)
const hasGeneratedReport = ref(false)

// ========== 分页状态 ==========
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// ========== 设备选项（从后端获取） ==========
const deviceOptions = ref<Array<{ label: string; value: string }>>([])

// ========== 历史查询表单 ==========
const queryForm = reactive({
  deviceId: '',
  timeRange: 'today',
  customRange: [] as string[]
})

// ========== 报表表单 ==========
const reportType = ref('device-run')
const reportTypeOptions = [
  { label: '设备运行统计报表', value: 'device-run' },
  { label: '异常告警统计报表', value: 'alarm-stat' }
]
const reportForm = reactive({
  timeRange: 'today',
  customRange: [] as string[]
})
const timeRangeOptions = [
  { label: '今日', value: 'today' },
  { label: '近7天', value: '7days' },
  { label: '近30天', value: '30days' },
  { label: '自定义', value: 'custom' }
]

// ========== 数据范围显示文本 ==========
const dataRangeText = computed(() => {
  const { startTime, endTime } = calculateTimeRange(queryForm.timeRange, queryForm.customRange)
  const format = (t: number) => new Date(t).toLocaleString('zh-CN', { hour12: false })
  return `${format(startTime)} ~ ${format(endTime)}`
})

const currentPageDeviceCount = computed(() => {
  return new Set(indicatorData.value.map(row => row.deviceId).filter(Boolean)).size
})

const metricColumnCount = computed(() => Math.max(indicatorColumns.value.length - 3, 0))

// ========== 动态表格列 ==========
const indicatorColumns = ref<DataColumn[]>([])

// ========== 指标历史数据 ==========
const indicatorData = ref<any[]>([])



// ========== 设备运行统计表格配置 ==========
const deviceRunColumns: any[] = [
  { key: 'deviceName', title: '设备名称', dataKey: 'deviceName', width: 150 },
  { key: 'runTime', title: '运行时长(h)', dataKey: 'runTime', width: 120 },
  { key: 'onlineRate', title: '在线率(%)', dataKey: 'onlineRate', width: 120 },
  { key: 'alarmCount', title: '异常告警次数', dataKey: 'alarmCount', width: 130 },
  { key: 'mtbf', title: 'MTBF(h)', dataKey: 'mtbf', width: 120 }
]

// ========== 设备运行统计数据 ==========
const deviceRunData = ref<any[]>([])

// ========== 告警统计表格配置 ==========
const alarmStatColumns: any[] = [
  { key: 'deviceName', title: '设备名称', dataKey: 'deviceName', width: 150 },
  { key: 'alarmType', title: '异常类型', dataKey: 'alarmType', width: 150 },
  { key: 'count', title: '告警次数', dataKey: 'count', width: 120 },
  { key: 'percentage', title: '占比(%)', dataKey: 'percentage', width: 120 }
]

// ========== 告警统计数据 ==========
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

// ========== 导出历史数据 ==========
const exportHistoryData = ref<any[]>([])

// ========== 时间范围计算 ==========
function calculateTimeRange(timeRange: string, customRange: string[]) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  let startTime = todayStart.getTime()
  let endTime = todayEnd.getTime()

  switch (timeRange) {
    case 'today':
      startTime = todayStart.getTime()
      endTime = todayEnd.getTime()
      break
    case '7days':
      startTime = todayStart.getTime() - 7 * 24 * 60 * 60 * 1000
      endTime = todayEnd.getTime()
      break
    case '30days':
      startTime = todayStart.getTime() - 30 * 24 * 60 * 60 * 1000
      endTime = todayEnd.getTime()
      break
    case 'custom':
      if (customRange && customRange.length === 2) {
        const s = new Date(customRange[0])
        const e = new Date(customRange[1])
        startTime = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0).getTime()
        endTime = new Date(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59).getTime()
      }
      break
  }

  return { startTime, endTime }
}

// ========== 格式化指标key为中文标题 ==========
function formatMetricKey(key: string): string {
  const map: Record<string, string> = {
    temp: '温度(℃)',
    level: '液位(L)',
    current: '电流(A)',
    ph: 'pH值',
    fill_volume: '灌装量(ml)',
    pressure: '压力(MPa)',
    speed: '速度(瓶/分)',
  }
  return map[key] || key
}

// ========== 加载设备列表 ==========
async function loadDeviceOptions() {
  try {
    const devices = await historyApi.getDeviceList()
    deviceOptions.value = devices.map(d => ({
      label: `${d.deviceId}-${d.deviceType}`,
      value: d.deviceId
    }))
  } catch (error) {
    console.error('加载设备列表失败:', error)
  }
}

// ========== 查询处理 ==========
const handleQuery = async () => {
  loading.value = true

  try {
    const { startTime, endTime } = calculateTimeRange(queryForm.timeRange, queryForm.customRange)

    // 查询历史数据（分页）
    const historyRes = await historyApi.getDeviceHistory({
      deviceId: queryForm.deviceId || undefined,
      startTime,
      endTime,
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value
    })

    if (historyRes.success && historyRes.data) {
      total.value = historyRes.total || 0

      // 提取动态列（排除非指标字段）
      const excludedKeys = new Set(['id', 'device_id', 'data_type', 'timestamp', 'data_status', 'payload', 'created_at', 'line'])
      const allKeys = new Set<string>()

      historyRes.data.forEach((item: any) => {
        Object.keys(item).forEach(key => {
          if (!excludedKeys.has(key) && item[key]?.value !== undefined) {
            allKeys.add(key)
          }
        })
      })

      // 构建动态列：固定列 + 动态指标列（DataColumn 格式）
      const fixedColumns: DataColumn[] = [
        { prop: 'time', label: '采集时间', width: 180 },
        { prop: 'deviceId', label: '设备ID', width: 100 },
        { prop: 'deviceType', label: '设备类型', width: 120 },
      ]

      const dynamicColumns = Array.from(allKeys).map(key => ({
        prop: key,
        label: formatMetricKey(key),
        width: 120
      }))

      indicatorColumns.value = [...fixedColumns, ...dynamicColumns]

      // 预处理数据：把指标对象格式化为字符串
      indicatorData.value = historyRes.data.map((item: any) => {
        const row: any = {
          time: new Date(item.timestamp).toLocaleString('zh-CN', { hour12: false }),
          deviceId: item.device_id,
          deviceType: item.data_type,
        }
        allKeys.forEach(key => {
          if (item[key]?.value !== undefined) {
            row[key] = `${item[key].value}${item[key].unit || ''}`
          } else {
            row[key] = '-'
          }
        })
        return row
      })
    } else {
      indicatorData.value = []
      indicatorColumns.value = []
      total.value = 0
    }

    hasQueried.value = true
  } catch (error) {
    console.error('查询失败:', error)
    ElMessage.error('查询失败')
  } finally {
    loading.value = false
  }
}

// ========== 分页切换 ==========
const handlePageChange = (page: number) => {
  currentPage.value = page
  handleQuery()
}

watch([() => queryForm.timeRange, () => queryForm.customRange], () => {
  currentPage.value = 1
})

watch([() => reportForm.timeRange, () => reportForm.customRange], () => {
  hasGeneratedReport.value = false
})

// ========== 重置处理 ==========
const handleReset = () => {
  queryForm.deviceId = ''
  queryForm.timeRange = 'today'
  queryForm.customRange = []
  currentPage.value = 1
  total.value = 0
  hasQueried.value = false
  indicatorData.value = []
  indicatorColumns.value = []
}

// ========== 生成报表处理 ==========
const handleGenerateReport = async () => {
  reportLoading.value = true

  try {
    const res = await historyApi.generateReport({
      reportType: reportType.value as 'device-run' | 'alarm-stat',
      timeRange: reportForm.timeRange,
      customRange: reportForm.customRange.length > 0 ? reportForm.customRange : undefined,
      deviceId: undefined
    })

    if (res.success && res.data) {
      if (reportType.value === 'device-run') {
        deviceRunData.value = res.data.details || []
      } else {
        alarmStatData.value = res.data.details || []
      }
      hasGeneratedReport.value = true
      ElMessage.success('报表生成成功')
    } else {
      ElMessage.error(res.message || '报表生成失败')
    }
  } catch (error: any) {
    console.error('生成报表失败:', error)
    ElMessage.error(error.message || '生成报表失败')
  } finally {
    reportLoading.value = false
  }
}



// ========== 导出处理 ==========
const handleExport = async () => {
  try {
    const reportTypeLabel = reportType.value === 'device-run' ? '设备运行统计报表' : '异常告警统计报表'
    const dateStr = new Date().toISOString().split('T')[0]

    // 调用后端导出接口
    const blob = await historyApi.exportReport({
      reportType: reportType.value as 'device-run' | 'alarm-stat',
      timeRange: reportForm.timeRange,
      customRange: reportForm.customRange.length > 0 ? reportForm.customRange : undefined,
      deviceId: undefined
    })

    // 创建下载链接
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${reportTypeLabel}_${dateStr}.xlsx`
    link.click()
    URL.revokeObjectURL(url)

    // 记录导出历史
    const now = new Date().toLocaleString('zh-CN')
    exportHistoryData.value.unshift({
      exportTime: now,
      reportType: reportTypeLabel,
      status: 'success'
    })

    if (exportHistoryData.value.length > 5) {
      exportHistoryData.value = exportHistoryData.value.slice(0, 5)
    }

    ElMessage.success('报表导出成功')
  } catch (error: any) {
    console.error('导出报表失败:', error)
    ElMessage.error(error.message || '导出报表失败')
  }
}

// ========== 监听报表类型切换 ==========
watch(reportType, () => {
  hasGeneratedReport.value = false
})

// ========== 页面挂载时加载设备列表并默认查询 ==========
onMounted(async () => {
  await loadDeviceOptions()
  await handleQuery()
})
</script>

<style scoped>
.history-data-page {
  padding: 0;
  margin: 0;
  min-height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-kicker {
  color: #6b7a90;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;

}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #182235;
}

.page-head__desc {
  color: #5d6b82;
  font-size: 14px;
  line-height: 1.7;
}

.func-tabs :deep(.el-tabs__header) {
  background: transparent;
  border-bottom: 0;
  margin-top: 10px;
}

.func-tabs :deep(.el-tabs__nav-wrap) {
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 0;
  backdrop-filter: none;
}

.func-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.func-tabs :deep(.el-tabs__nav) {
  border: 0;
  background: transparent;
}

.func-tabs :deep(.el-tabs__item) {
  border-radius: 14px;
  margin-right: 8px;
  color: #6f7d92;
  transition: all 0.2s ease;
}

.func-tabs :deep(.el-tabs__item:hover) {
  color: #3c5fa8;
}

.func-tabs :deep(.el-tabs__item.is-active) {
  color: #1f3356;
  background: rgba(79, 124, 255, 0.08);
  box-shadow: none;
}

.func-tabs :deep(.el-tabs__item) {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 6px 16px rgba(148, 163, 184, 0.08);
}

.func-tabs :deep(.el-tabs__item:hover) {
  background: rgba(79, 124, 255, 0.08);
  border-color: rgba(79, 124, 255, 0.16);
}

.func-tabs :deep(.el-tabs__content) {
  padding: 16px 0 0;
  background: transparent;
  box-shadow: none;
}

.func-tabs :deep(.el-tab-pane) {
  background: transparent;
}

.history-data-page :deep(.el-tabs--border-card),
.history-data-page :deep(.el-tabs--border-card > .el-tabs__content),
.history-data-page :deep(.el-tabs--border-card > .el-tabs__header),
.history-data-page :deep(.el-tabs--border-card > .el-tabs__body) {
  background: transparent;
  border: 0;
  box-shadow: none;
}

.history-query-module,
.report-export-module {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-section,
.report-type-section,
.report-content,
.export-section,
.empty-state,
.section {
  background: transparent;
  border: 0;
  box-shadow: none;
  border-radius: 0;
  padding: 0;
  backdrop-filter: none;
}

.section-heading,
.filter-actions,
.export-layout {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.section-title {
  margin: 6px 0 0;
  font-size: 18px;
  color: #172033;
}

.filter-grid {
  display: grid;
  gap: 14px;
  margin-top: 16px;
}

.filter-grid-history {
  grid-template-columns: 1fr 1.4fr 1fr;
}

.filter-grid-report {
  grid-template-columns: 1.6fr 1fr;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  color: #516079;
  font-weight: 600;
}

.filter-control {
  width: 100%;
}

.filter-control--select :deep(.el-input__wrapper),
.filter-control--date :deep(.el-input__wrapper) {
  border-radius: 16px;
  min-height: 44px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.12);
}

.filter-item-wide {
  min-width: 0;
}

.range-button-group--history {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.range-btn {
  border-radius: 16px !important;
  min-height: 44px;
  padding: 0 18px;
  background: rgba(255, 255, 255, 0.72);
  color: #516079;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: none;
}

.range-btn:hover {
  background: rgba(79, 124, 255, 0.08);
  border-color: rgba(79, 124, 255, 0.2);
  color: #1f3356;
}

.range-btn.is-active {
  background: rgba(79, 124, 255, 0.14);
  border-color: rgba(79, 124, 255, 0.28);
  color: #1f3356;
  box-shadow: inset 0 0 0 1px rgba(79, 124, 255, 0.08);
}

.filter-actions {
  margin-top: 14px;
  justify-content: flex-start;
}

.filter-actions :deep(.el-button--primary) {
  background: rgba(79, 124, 255, 0.08);
  border-color: rgba(79, 124, 255, 0.16);
  color: #1f3356;
  box-shadow: none;
}

.filter-actions :deep(.el-button--primary:hover),
.filter-actions :deep(.el-button--primary:focus) {
  background: rgba(79, 124, 255, 0.12);
  border-color: rgba(79, 124, 255, 0.22);
  color: #1f3356;
}

.filter-actions :deep(.el-button:not(.el-button--primary)) {
  background: rgba(255, 255, 255, 0.78);
  border-color: rgba(148, 163, 184, 0.18);
  color: #516079;
}

.data-display-area,
.report-preview-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.data-range-tips,
.history-title {
  color: #6f7d92;
  font-size: 12px;
}

.range-text {
  font-weight: 700;
  color: #1f3356;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.summary-card {
  border: 1px solid rgba(79, 124, 255, 0.1);
  background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(246,250,255,0.82));
  border-radius: 18px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-card--primary {
  background: linear-gradient(135deg, rgba(79, 124, 255, 0.08), rgba(79, 124, 255, 0.03));
}

.summary-label {
  color: #6f7d92;
  font-size: 12px;
}

.summary-value {
  font-size: 18px;
  color: #1b2740;
}

.summary-value--accent {
  color: #4f7cff;
  font-size: 14px;
  line-height: 1.5;
}

.summary-desc {
  color: #94a3b8;
  font-size: 12px;
}

.report-type-section {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.report-type-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.toggle-btn {
  border-radius: 16px !important;
  min-height: 44px;
  padding: 0 18px;
  background: rgba(255, 255, 255, 0.72);
  color: #516079;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: none;
}

.toggle-btn:hover {
  background: rgba(79, 124, 255, 0.08);
  border-color: rgba(79, 124, 255, 0.2);
  color: #1f3356;
}

.toggle-btn.is-active {
  background: rgba(79, 124, 255, 0.14);
  border-color: rgba(79, 124, 255, 0.28);
  color: #1f3356;
  box-shadow: inset 0 0 0 1px rgba(79, 124, 255, 0.08);
}

.report-hint {
  color: #6f7d92;
  font-size: 12px;
}

.alarm-report-layout {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 16px;
}

.compact-header {
  margin-bottom: 12px;
}

.export-layout {
  align-items: flex-start;
}

.export-history {
  width: min(420px, 100%);
}

.empty-state {
  padding: 52px 20px;
  display: grid;
  place-items: center;
}

@media (max-width: 1200px) {
  .filter-grid,
  .alarm-report-layout,
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .section-heading,
  .filter-actions,
  .export-layout {
    flex-direction: column;
    align-items: flex-start;
  }
}

</style>
