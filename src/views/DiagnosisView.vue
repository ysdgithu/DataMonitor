<template>
  <main-layout>
    <div class="diagnosis-main">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2 class="page-title">诊断任务管理</h2>
        <el-button type="primary" class="create-btn" @click="add()">
          <el-icon>
            <Plus />
          </el-icon>
          新建任务
        </el-button>
      </div>

      <!-- 统计卡片区域 -->
      <el-row :gutter="20" class="statistics-row">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total">
                <el-icon>
                  <Document />
                </el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">总任务数</div>
                <div class="stat-value">{{ stats.total }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon running">
                <el-icon>
                  <Loading />
                </el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">进行中</div>
                <div class="stat-value">{{ stats.running }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon completed">
                <el-icon>
                  <CircleCheck />
                </el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">已完成</div>
                <div class="stat-value">{{ stats.completed }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon failed">
                <el-icon>
                  <CircleClose />
                </el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">失败</div>
                <div class="stat-value">{{ stats.failed }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 筛选和搜索区域 -->
      <el-card class="filter-card">
        <el-row :gutter="16" align="middle">
          <el-col :span="6">
            <el-input v-model="searchKeyword" placeholder="搜索任务名称" prefix-icon="Search" clearable />
          </el-col>
          <el-col :span="4">
            <el-select v-model="filterStatus" placeholder="任务状态" clearable>
              <el-option label="进行中" :value="0" />
              <el-option label="已完成" :value="1" />
              <el-option label="失败" :value="2" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select v-model="filterPriority" placeholder="优先级" clearable>
              <el-option label="高" :value="2" />
              <el-option label="中" :value="1" />
              <el-option label="低" :value="0" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
              end-placeholder="结束日期" size="default" value-format="x" />
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="handleSearch" icon="Search">查询</el-button>
            <el-button @click="handleReset" icon="Refresh">重置</el-button>
          </el-col>
        </el-row>
      </el-card>

      <!-- 任务列表 -->
      <el-card class="task-list-card">
        <template #header>
          <div class="card-header">
            <span>任务列表</span>
            <el-button text type="primary" @click="getData()">
              <el-icon>
                <Refresh />
              </el-icon>
              刷新
            </el-button>
          </div>
        </template>

        <VirtualTable :data="taskList" :columns="columns" :height="400" :loading="loading" style="width: 100%"
          class="task-table" />

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
            :total="total" layout="total, sizes, prev, pager, next, jumper" background
            @current-change="handlePageChange" @size-change="handlePageSizeChange" />
        </div>
      </el-card>
    </div>
    <!-- 历史数据查询面板弹窗 -->
    <el-drawer v-model="showPanel" :modal="false" :with-header="false" size="50%">
      <TaskDetailsComponent v-if="currentTask" :taskData="currentTask" />
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="showPanel = false">取消</el-button>
          <el-button type="primary" @click="showPanel = false">
            确认
          </el-button>
        </div>
      </template>
    </el-drawer>
    <!-- 新增弹窗 -->
    <el-dialog v-model="addShow">
      <AddTask @close="addShow = false"></AddTask>
    </el-dialog>
  </main-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MainLayout from '../components/layout/MainLayout.vue'
import TaskDetailsComponent from './TaskDetails.vue'
import AddTask from './AddTask.vue'
import { ElMessage } from 'element-plus'
import VirtualTable from '../components/common/VirtualTable/index.vue'
import { DiagnosticApi, type DiagnosisTask, type QueryParams } from '../utils/diagnosticApi'
import {
  Plus,
  Document,
  Loading,
  CircleCheck,
  CircleClose,
  Refresh
} from '@element-plus/icons-vue'

// 弹窗
const showPanel = ref(false)
const addShow = ref(false)
const currentTask = ref<DiagnosisTask | null>(null)

const detailClick = async (row: DiagnosisTask) => {
  showPanel.value = true
  currentTask.value = row

  try {
    const res = await api.getDiagnosisDetail(row.id)
    if (res.success && res.data) {
      currentTask.value = {
        ...row,
        ...res.data,
        createTime: res.data.createTime || (res.data as any).create_time || row.createTime,
        updateTime: res.data.updateTime || (res.data as any).update_time || row.updateTime
      }
    }
  } catch (error) {
    console.error('[DiagnosisView] 获取任务详情失败:', error)
  }
}

const handleClosePanel = () => {
  showPanel.value = false
  currentTask.value = null
}

// 统计数据
const stats = ref({
  total: 0,
  running: 0,
  completed: 0,
  failed: 0
})

// 搜索和筛选
const searchKeyword = ref('')
const filterStatus = ref<number | undefined>(undefined)
const filterPriority = ref<number | undefined>(undefined)
const dateRange = ref<[Date, Date] | null>(null)

// 分页
const currentPage = ref(1)
const pageSize = ref(20)

// 查询参数
const queryParams = ref<QueryParams>({})

const taskList = ref<DiagnosisTask[]>([])
const total = ref(0)
const loading = ref(false)
const api = new DiagnosticApi()

// 获取统计数据
const getStats = async () => {
  try {
    const res = await api.getDiagnosisTaskStats()
    if (res.success) {
      stats.value = res.data
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const getData = async () => {
  try {
    loading.value = true

    // 构建查询参数
    queryParams.value = {
      page: currentPage.value,
      pageSize: pageSize.value,
      status: filterStatus.value === undefined ? undefined : filterStatus.value,
      priority: filterPriority.value === undefined ? undefined : filterPriority.value,
      name: searchKeyword.value || undefined,
      startTime: dateRange.value ? Number(dateRange.value[0]) : undefined,
      endTime: dateRange.value ? Number(dateRange.value[1]) : undefined
    }

    console.log('[DiagnosisView] 📋 请求参数:', queryParams.value)

    const res = await api.getDiagnosisList(queryParams.value)

    if (res.success) {
      // 映射后端字段名（下划线）到前端字段名（驼峰）
      taskList.value = res.data.map((task: any) => ({
        ...task,
        createTime: task.create_time || task.createTime,
        updateTime: task.update_time || task.updateTime
      }))
      total.value = res.total
      console.log('[DiagnosisView] ✅ 获取到 ' + taskList.value.length + ' 条数据 (总计 ' + total.value + ' 条)')
    } else {
      ElMessage.error('获取诊断任务列表失败')
    }
  } catch (error) {
    console.error('[DiagnosisView] ❌ 获取诊断任务列表失败:', error)
    ElMessage.error('获取诊断任务列表失败')
  } finally {
    loading.value = false
  }
}

// 新增
const add = () => {
  // 新增表单弹出
  addShow.value = true
  getData()
}
// 新增表单的关闭
const close = () => {
  addShow.value = true
}

// 删除
const deleteTask = async (id: number) => {
  const res = await api.deleteDiagnosisTask(id)
  if (res.success) {
    ElMessage.success('删除成功')
    getData()
  } else {
    ElMessage.error('删除失败')
  }
}

// 【新增】搜索功能
const handleSearch = () => {
  console.log('[DiagnosisView] 🔍 执行搜索')
  currentPage.value = 1 // 重置页码
  getData()
}

// 【新增】重置搜索条件
const handleReset = () => {
  console.log('[DiagnosisView] 🔄 重置搜索条件')
  searchKeyword.value = ''
  filterStatus.value = undefined
  filterPriority.value = undefined
  dateRange.value = null
  currentPage.value = 1
  getData()
}

// 【新增】分页变化
const handlePageChange = (page: number) => {
  console.log('[DiagnosisView] 📄 切换到第 ' + page + ' 页')
  currentPage.value = page
  getData()
}

// 【新增】页大小变化
const handlePageSizeChange = (size: number) => {
  console.log('[DiagnosisView] 📄 修改页大小为 ' + size)
  pageSize.value = size
  currentPage.value = 1
  getData()
}



// 时间戳转换
const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

// 表格列配置
const columns = [
  { key: 'id', title: '任务ID', dataKey: 'id', width: 100 },
  { key: 'name', title: '任务名称', dataKey: 'name', width: 180 },
  { key: 'device_id', title: '设备ID', dataKey: 'device_id', width: 120 },
  {
    key: 'status',
    title: '任务状态',
    dataKey: 'status',
    width: 120,
    isStatus: true,
    statusCategory: 'status'
  },
  {
    key: 'priority',
    title: '优先级',
    dataKey: 'priority',
    width: 100,
    isStatus: true,
    statusCategory: 'priority'
  },
  {
    key: 'createTime',
    title: '创建时间',
    dataKey: 'createTime',
    width: 160,
    isTime: true
  },
  {
    key: 'updateTime',
    title: '更新时间',
    dataKey: 'updateTime',
    width: 160,
    isTime: true
  },
  {
    key: 'actions',
    title: '操作',
    dataKey: 'actions',
    width: 200,
    isActions: true,
    actions: [
      { label: '查看', type: 'primary', onClick: (row: DiagnosisTask) => detailClick(row) },
      { label: '暂停', type: 'warning', onClick: (row: DiagnosisTask) => console.log('暂停', row), show: (row: DiagnosisTask) => row.status === 0 },
      { label: '重试', type: 'success', onClick: (row: DiagnosisTask) => console.log('重试', row), show: (row: DiagnosisTask) => row.status === 2 },
      { label: '删除', type: 'danger', onClick: (row: DiagnosisTask) => deleteTask(row.id) }
    ]
  }
]

// 初始化加载数据
onMounted(() => {
  getStats()  // 获取统计数据
  getData()   // 获取诊断任务列表
})
</script>

<style scoped>
.diagnosis-main {
  padding: var(--spacing-base);
  background-color: var(--bg-secondary);
  min-height: 100%;
}

/* 页面标题 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-base);
}

.page-title {
  color: var(--text-main);
  font-size: var(--font-xl);
  font-weight: 600;
  margin: 0;
}

.create-btn {
  background-color: var(--primary);
  border-color: var(--primary);
}

.create-btn:hover {
  background-color: var(--primary-hover);
  border-color: var(--primary-hover);
}

/* 统计卡片 */
.statistics-row {
  margin-bottom: var(--spacing-base);
}

.stat-card {
  background-color: var(--bg-main);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  transition: all 0.3s;
  box-shadow: var(--shadow-light);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-base);
  border-color: var(--border-light);
}

.stat-card :deep(.el-card__body) {
  padding: var(--spacing-base);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-xl);
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: var(--text-white);
}

.stat-icon.running {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: var(--text-white);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: var(--text-white);
}

.stat-icon.failed {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: var(--text-white);
}

.stat-info {
  flex: 1;
}

.stat-label {
  color: var(--text-tertiary);
  font-size: var(--font-sm);
  margin-bottom: var(--spacing-xs);
}

.stat-value {
  color: var(--text-main);
  font-size: var(--font-2xl);
  font-weight: 700;
}

/* 筛选卡片 */
.filter-card {
  background-color: var(--bg-main);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-base);
  box-shadow: var(--shadow-light);
}

.filter-card :deep(.el-card__body) {
  padding: var(--spacing-base);
}

/* Select 和 DatePicker 宽度设置 */
.filter-card :deep(.el-select) {
  width: 100%;
}

.filter-card :deep(.el-date-editor) {
  width: 100%;
}

/* 任务列表卡片 */
.task-list-card {
  background-color: var(--bg-main);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-light);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-main);
  font-weight: 600;
}

/* 表格样式 */
.task-table {
  background-color: var(--bg-main);
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--spacing-base);
  padding: var(--spacing-base) 0;
}

/* 滚动条美化 */
.diagnosis-main::-webkit-scrollbar {
  width: 8px;
}

.diagnosis-main::-webkit-scrollbar-track {
  background: var(--bg-hover);
  border-radius: var(--radius-sm);
}

.diagnosis-main::-webkit-scrollbar-thumb {
  background: var(--border-dark);
  border-radius: var(--radius-sm);
}

.diagnosis-main::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}
</style>
