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
                    <el-option v-for="device in deviceOptions" :key="device.value" :label="device.label" :value="device.value" />
                  </el-select>
                </div>

                <div class="filter-item">
                  <span class="filter-label">指标类型</span>
                  <el-select v-model="queryForm.metrics" multiple collapse-tags collapse-tags-tooltip placeholder="请选择指标" class="filter-control filter-control--select">
                    <el-option v-for="metric in metricOptions" :key="metric.value" :label="metric.label" :value="metric.value" />
                  </el-select>
                </div>

                <div class="filter-item">
                  <span class="filter-label">时间范围</span>
                  <div class="range-button-group range-button-group--history">
                    <el-button v-for="option in timeRangeOptions" :key="option.value" class="range-btn" :class="{ 'is-active': queryForm.timeRange === option.value }" @click="queryForm.timeRange = option.value">
                      {{ option.label }}
                    </el-button>
                  </div>
                </div>

                <div v-if="queryForm.timeRange === 'custom'" class="filter-item filter-item-wide">
                  <span class="filter-label">自定义时间</span>
                  <el-date-picker v-model="queryForm.customRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" class="filter-control filter-control--date" />
                </div>
              </div>

              <div class="filter-actions">
                <el-button type="primary" :loading="loading" @click="handleQuery"><el-icon><Search /></el-icon>查询</el-button>
                <el-button @click="handleReset"><el-icon><Refresh /></el-icon>重置</el-button>
              </div>
            </div>

            <div v-if="hasQueried" class="data-display-area">
              <div class="section">
                <div class="section-heading">
                  <div>
                    <div class="section-kicker">统计摘要</div>
                    <h4 class="section-title">关键统计量</h4>
                  </div>
                </div>
                <div class="summary-grid">
                  <div v-for="item in summaryCards" :key="item.key" class="summary-card">
                    <span class="summary-label">{{ item.label }}</span>
                    <span class="summary-value">{{ item.value }}</span>
                    <span class="summary-desc">{{ item.desc }}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-heading">
                  <div>
                    <div class="section-kicker">数据结果</div>
                    <h4 class="section-title">历史运行明细</h4>
                  </div>
                  <div class="data-range-tips">数据范围：<span class="range-text">{{ dataRangeText }}</span></div>
                </div>
                <DataTable :columns="indicatorColumns" :data="indicatorData" :loading="loading" :show-pagination="true" :current-page="currentPage" :page-size="pageSize" :total="total" @page-change="handlePageChange" />
              </div>
            </div>

            <div v-else class="empty-state">
              <CommonEmpty description="请选择条件后点击查询" />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="统计报表导出" name="report">
          <div class="report-export-module">
            <div class="filter-section filter-section--compact filter-section--report">
              <div class="filter-grid filter-grid-report">
                <div class="filter-item">
                  <span class="filter-label">设备名称</span>
                  <el-select v-model="reportForm.deviceId" placeholder="全部设备" clearable class="filter-control filter-control--select">
                    <el-option v-for="device in deviceOptions" :key="device.value" :label="device.label" :value="device.value" />
                  </el-select>
                </div>
                <div class="filter-item">
                  <span class="filter-label">指标类型</span>
                  <el-select v-model="reportForm.metrics" multiple collapse-tags collapse-tags-tooltip placeholder="请选择指标" class="filter-control filter-control--select">
                    <el-option v-for="metric in metricOptions" :key="metric.value" :label="metric.label" :value="metric.value" />
                  </el-select>
                </div>
                <div class="filter-item">
                  <span class="filter-label">时间范围</span>
                  <div class="range-button-group range-button-group--report">
                    <el-button v-for="option in timeRangeOptions" :key="option.value" class="range-btn" :class="{ 'is-active': reportForm.timeRange === option.value }" @click="reportForm.timeRange = option.value">
                      {{ option.label }}
                    </el-button>
                  </div>
                </div>
                <div v-if="reportForm.timeRange === 'custom'" class="filter-item filter-item-wide">
                  <span class="filter-label">自定义时间</span>
                  <el-date-picker v-model="reportForm.customRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" class="filter-control" />
                </div>
              </div>

              <div class="filter-actions">
                <el-button type="primary" :loading="reportLoading" @click="handleGenerateReport">生成报表</el-button>
                <el-button type="success" :disabled="!hasGeneratedReport" @click="handleExport">一键导出Excel</el-button>
              </div>
            </div>

            <div v-if="hasGeneratedReport" class="report-preview-area">
              <div class="section">
                <div class="section-heading">
                  <div>
                    <div class="section-kicker">查询条件</div>
                    <h4 class="section-title">报表内容结构</h4>
                  </div>
                </div>
                <div class="summary-grid summary-grid--report">
                  <div v-for="item in reportQueryCards" :key="item.key" class="summary-card">
                    <span class="summary-label">{{ item.label }}</span>
                    <span class="summary-value">{{ item.value }}</span>
                    <span class="summary-desc">{{ item.desc }}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-heading">
                  <div>
                    <div class="section-kicker">统计摘要</div>
                    <h4 class="section-title">报表指标汇总</h4>
                  </div>
                </div>
                <DataTable :columns="reportSummaryColumns" :data="reportSummaryData" :loading="reportLoading" />
              </div>

              <div class="section">
                <div class="section-heading">
                  <div>
                    <div class="section-kicker">原始数据明细</div>
                    <h4 class="section-title">报表导出预览</h4>
                  </div>
                </div>
                <VirtualTable :columns="reportDetailColumns" :data="reportDetailData" :height="350" />
              </div>
            </div>

            <div v-else class="empty-state">
              <CommonEmpty description="请先生成报表预览" />
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
import CommonEmpty from '../components/common/Empty/index.vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { historyApi } from '../utils/historyApi'
import type { Column as DataColumn } from '../components/common/DataTable/types'
import { ElMessage } from 'element-plus'

const activeTab = ref('history')
const loading = ref(false)
const reportLoading = ref(false)
const hasQueried = ref(false)
const hasGeneratedReport = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const deviceOptions = ref<Array<{ label: string; value: string }>>([])
const metricOptions = [
  { label: '灌装量', value: 'fill_volume' },
  { label: '压力', value: 'pressure' },
  { label: '速度', value: 'speed' },
  { label: '温度', value: 'temp' },
  { label: '液位', value: 'level' },
  { label: '电流', value: 'current' },
  { label: 'pH值', value: 'ph' }
]

const queryForm = reactive({ deviceId: '', metrics: ['fill_volume'], timeRange: '1h', customRange: [] as string[] })
const reportForm = reactive({ deviceId: '', metrics: ['fill_volume'], timeRange: '1h', customRange: [] as string[] })
const timeRangeOptions = [
  { label: '1h', value: '1h' },
  { label: '24h', value: '24h' },
  { label: '48h', value: '48h' },
  { label: '自定义', value: 'custom' }
]

const indicatorColumns = ref<DataColumn[]>([])
const indicatorData = ref<any[]>([])
const reportSummaryColumns: DataColumn[] = [
  { prop: 'metricLabel', label: '指标', width: 140 },
  { prop: 'avg', label: '平均值', width: 120 },
  { prop: 'max', label: '最大值', width: 120 },
  { prop: 'min', label: '最小值', width: 120 },
  { prop: 'std', label: '标准差', width: 120 },
  { prop: 'anomalyCount', label: '异常次数', width: 120 },
  { prop: '_spacer', label: '', minWidth: 240 }
]
const reportSummaryData = ref<any[]>([])
const reportDetailColumns = ref<any[]>([])
const reportDetailData = ref<any[]>([])
const reportQueryData = ref<any>({})

const dataRangeText = computed(() => {
  const { startTime, endTime } = calculateTimeRange(queryForm.timeRange, queryForm.customRange)
  return `${formatDate(startTime)} ~ ${formatDate(endTime)}`
})

const summaryCards = computed(() => {
  const values = queryMetricsSummary.value
  return [
    { key: 'avg', label: '平均值', value: values.avg, desc: '当前查询结果的平均水平' },
    { key: 'max', label: '最大值', value: values.max, desc: '当前查询结果的峰值' },
    { key: 'min', label: '最小值', value: values.min, desc: '当前查询结果的低值' },
    { key: 'std', label: '标准差', value: values.std, desc: '当前查询结果的波动程度' }
  ]
})

const queryMetricsSummary = computed(() => {
  const first = reportSummaryData.value[0]
  if (!first) return { avg: '-', max: '-', min: '-', std: '-' }
  return {
    avg: formatNum(first.avg),
    max: formatNum(first.max),
    min: formatNum(first.min),
    std: formatNum(first.std)
  }
})

const reportQueryCards = computed(() => [
  { key: 'device', label: '设备', value: reportQueryData.value.deviceId || '全部设备', desc: '' },
  { key: 'time', label: '时间范围', value: `${reportQueryData.value.startTime || '-'} ~ ${reportQueryData.value.endTime || '-'}`, desc: '' },
  { key: 'metrics', label: '指标', value: (reportQueryData.value.metrics || []).join('、') || '-', desc: '' }
])

function calculateTimeRange(timeRange: string, customRange: string[]) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  let startTime = todayStart.getTime()
  let endTime = todayEnd.getTime()
  if (timeRange === '1h') startTime = now.getTime() - 1 * 60 * 60 * 1000
  if (timeRange === '24h') startTime = now.getTime() - 24 * 60 * 60 * 1000
  if (timeRange === '48h') startTime = now.getTime() - 48 * 60 * 60 * 1000
  if (timeRange === 'custom' && customRange?.length === 2) {
    const s = new Date(customRange[0]); const e = new Date(customRange[1])
    startTime = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0).getTime()
    endTime = new Date(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59).getTime()
  }
  return { startTime, endTime }
}

function formatDate(time: number) { return new Date(time).toLocaleString('zh-CN', { hour12: false }) }
function formatNum(val: any) { return val === null || val === undefined ? '-' : Number(val).toFixed(2) }
function formatMetricKey(key: string) { return metricOptions.find(m => m.value === key)?.label || key }

async function loadDeviceOptions() {
  try {
    const devices = await historyApi.getDeviceList()
    deviceOptions.value = devices.map(d => ({ label: `${d.deviceId}-${d.deviceType}`, value: d.deviceId }))
  } catch (error) {
    console.error('加载设备列表失败:', error)
  }
}

async function handleQuery() {
  loading.value = true
  try {
    const { startTime, endTime } = calculateTimeRange(queryForm.timeRange, queryForm.customRange)
    const res = await historyApi.generateReport({ deviceId: queryForm.deviceId || undefined, timeRange: queryForm.timeRange, customRange: queryForm.customRange, metrics: queryForm.metrics, page: currentPage.value, pageSize: pageSize.value })
    if (res.success && res.data) {
      total.value = res.data.total || 0
      indicatorColumns.value = [
        { prop: 'time', label: '采集时间', width: 180 },
        { prop: 'deviceId', label: '设备ID', width: 100 },
        { prop: 'dataType', label: '数据类型', width: 120 },
        ...queryForm.metrics.map((m: string) => ({ prop: m, label: formatMetricKey(m), width: 130 })),
        { prop: 'anomaly', label: '状态', width: 100 },
        { prop: '_spacer', label: '', minWidth: 240 }
      ]
      indicatorData.value = res.data.details || []
      reportSummaryData.value = res.data.summary || []
      hasQueried.value = true
    } else {
      indicatorData.value = []
      reportSummaryData.value = []
    }
  } catch (error) {
    console.error('查询失败:', error)
    ElMessage.error('查询失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => { currentPage.value = page; handleQuery() }
const handleReset = () => { queryForm.deviceId = ''; queryForm.metrics = ['fill_volume']; queryForm.timeRange = '1h'; queryForm.customRange = []; currentPage.value = 1; total.value = 0; hasQueried.value = false; indicatorData.value = []; indicatorColumns.value = [] }

async function handleGenerateReport() {
  reportLoading.value = true
  try {
    const res = await historyApi.generateReport({ deviceId: reportForm.deviceId || undefined, timeRange: reportForm.timeRange, customRange: reportForm.customRange, metrics: reportForm.metrics, page: 1, pageSize: 1000 })
    if (res.success && res.data) {
      reportQueryData.value = res.data.queryCondition || {}
      reportSummaryData.value = res.data.summary || []
      reportDetailData.value = res.data.details || []
      reportDetailColumns.value = [
        { key: 'time', title: '采集时间', dataKey: 'time', width: 180 },
        { key: 'deviceId', title: '设备ID', dataKey: 'deviceId', width: 110 },
        { key: 'dataType', title: '数据类型', dataKey: 'dataType', width: 120 },
        ...reportForm.metrics.map(m => ({ key: m, title: formatMetricKey(m), dataKey: m, width: 130 })),
        { key: 'anomaly', title: '状态', dataKey: 'anomaly', width: 100 }
      ]
      hasGeneratedReport.value = true
      ElMessage.success('报表生成成功')
    } else {
      ElMessage.error(res.message || '报表生成失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '报表生成失败')
  } finally {
    reportLoading.value = false
  }
}

async function handleExport() {
  try {
    const blob = await historyApi.exportReport({ deviceId: reportForm.deviceId || undefined, timeRange: reportForm.timeRange, customRange: reportForm.customRange, metrics: reportForm.metrics })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `历史数据分析报表_${new Date().toISOString().split('T')[0]}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('报表导出成功')
  } catch (error: any) {
    ElMessage.error(error.message || '导出报表失败')
  }
}

watch([() => queryForm.timeRange, () => queryForm.customRange], () => { currentPage.value = 1 })
watch([() => reportForm.timeRange, () => reportForm.customRange], () => { hasGeneratedReport.value = false })
onMounted(async () => { await loadDeviceOptions(); await handleQuery() })
</script>

<style scoped>
.history-data-page { padding: 0; margin: 0; min-height: calc(100vh - 100px); display: flex; flex-direction: column; gap: 16px; }
.section-kicker { color: #6b7a90; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; }
.section-title { margin: 6px 0 0; font-size: 18px; color: #172033; }
.func-tabs :deep(.el-tabs__header), .func-tabs :deep(.el-tabs__content), .history-data-page :deep(.el-tabs--border-card), .history-data-page :deep(.el-tabs--border-card > .el-tabs__content), .history-data-page :deep(.el-tabs--border-card > .el-tabs__header), .history-data-page :deep(.el-tabs--border-card > .el-tabs__body) { background: transparent; border: 0; box-shadow: none; }
.func-tabs :deep(.el-tabs__item) { border-radius: 14px; margin-right: 8px; color: #6f7d92; background: rgba(255,255,255,0.72); border: 1px solid rgba(148, 163, 184, 0.16); box-shadow: 0 6px 16px rgba(148, 163, 184, 0.08); }
.func-tabs :deep(.el-tabs__item.is-active) { color: #1f3356; background: rgba(79, 124, 255, 0.08); }
.history-query-module, .report-export-module { display: flex; flex-direction: column; gap: 16px; }
.filter-section, .section, .empty-state { border-radius: 0; padding: 0; }
.section-heading, .filter-actions { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 10px; }
.filter-grid { display: grid; gap: 14px; margin-top: 16px; }
.filter-grid-history, .filter-grid-report { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.filter-item { display: flex; flex-direction: column; gap: 8px; }
.filter-label { font-size: 13px; color: #516079; font-weight: 600; }
.filter-control { width: 100%; }
.filter-control--select :deep(.el-input__wrapper), .filter-control--date :deep(.el-input__wrapper) { border-radius: 16px; min-height: 44px; background: rgba(255,255,255,0.88); box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.12); }
.range-button-group { display: flex; flex-wrap: wrap; gap: 10px; }
.range-btn { border-radius: 16px !important; min-height: 44px; padding: 0 18px; background: rgba(255,255,255,0.72); color: #516079; border: 1px solid rgba(148, 163, 184, 0.18); }
.range-btn.is-active { background: rgba(79, 124, 255, 0.14); border-color: rgba(79, 124, 255, 0.28); color: #1f3356; }
.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.summary-grid--report { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.summary-card { border: 1px solid rgba(79, 124, 255, 0.1); background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(246,250,255,0.82)); border-radius: 18px; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; }
.summary-label { color: #6f7d92; font-size: 12px; }
.summary-value { font-size: 18px; color: #1b2740; }
.summary-desc { color: #94a3b8; font-size: 12px; }
.data-range-tips { color: #6f7d92; font-size: 12px; }
.range-text { font-weight: 700; color: #1f3356; }
.empty-state { padding: 52px 20px; display: grid; place-items: center; }
@media (max-width: 1200px) { .filter-grid-history, .filter-grid-report, .summary-grid, .summary-grid--report { grid-template-columns: 1fr; } }
@media (max-width: 768px) { .section-heading, .filter-actions { flex-direction: column; align-items: flex-start; } }
</style>
