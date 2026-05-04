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
                <DataTable :columns="indicatorColumns" :data="indicatorData" :loading="loading" :show-pagination="true"
                  :current-page="currentPage" :page-size="pageSize" :total="total" @page-change="handlePageChange" />
              </div>

            </div>

            <!-- 空状态 -->
            <div v-else class="empty-state">
              <CommonEmpty description="请选择时间范围后点击查询" />
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
import { ref, reactive, computed, watch, onMounted } from 'vue'
import MainLayout from '../components/layout/MainLayout.vue'
import DataTable from '../components/common/DataTable/index.vue'
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
const reportForm = reactive({
  timeRange: 'today',
  customRange: [] as string[]
})

// ========== 数据范围显示文本 ==========
const dataRangeText = computed(() => {
  const { startTime, endTime } = calculateTimeRange(queryForm.timeRange, queryForm.customRange)
  const format = (t: number) => new Date(t).toLocaleString('zh-CN', { hour12: false })
  return `${format(startTime)} ~ ${format(endTime)}`
})

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
