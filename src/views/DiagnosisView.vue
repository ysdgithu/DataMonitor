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

      <!-- 筛选和搜索区域 -->
      <el-card class="filter-card">
        <el-row :gutter="16" align="middle">
          <el-col :span="6">
            <el-input v-model="searchKeyword" placeholder="搜索任务名称" prefix-icon="Search" clearable />
          </el-col>
          <el-col :span="4">
            <el-select v-model="filterStatus" placeholder="任务状态" clearable>
              <el-option label="待确认" :value="0" />
              <el-option label="进行中" :value="1" />
              <el-option label="已完成" :value="2" />
              <el-option label="失败" :value="3" />
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

        <VirtualTable :data="taskList" :columns="columns" :height="tableHeight" :loading="loading" style="width: 100%"
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
      <TaskDetailsComponent v-if="currentTask" :taskData="currentTask" @task-updated="handleTaskUpdated" />
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="showPanel = false">关闭</el-button>
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
import { ref, onMounted, computed } from 'vue'
import MainLayout from '../components/layout/MainLayout.vue'
import TaskDetailsComponent from './TaskDetails.vue'
import AddTask from './AddTask.vue'
import { ElMessage } from 'element-plus'
import VirtualTable from '../components/common/VirtualTable/index.vue'
import { DiagnosticApi, type DiagnosisTask, type QueryParams } from '../utils/diagnosticApi'
import {
  Plus,
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

const handleTaskUpdated = async (payload: { id: number; status: number }) => {
  const target = taskList.value.find((item) => item.id === payload.id)
  if (target) {
    target.status = payload.status
  }
  if (currentTask.value?.id === payload.id) {
    currentTask.value.status = payload.status
  }
  await getData()
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
const tableHeight = computed(() => Math.max(400, pageSize.value * 52 + 100))

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
  padding: 0;
  margin: 0;
  min-height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  color: #182235;
  font-size: 24px;
  font-weight: 700;
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

.filter-card,
.task-list-card {
  background: transparent;
  border: 0;
  box-shadow: none;
  border-radius: 0;
}

.filter-card :deep(.el-card__body) {
  padding: 0;
}

.filter-card :deep(.el-select),
.filter-card :deep(.el-date-editor) {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #172033;
  font-weight: 600;
}

.task-table {
  background-color: transparent;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
  padding: 12px 0 0;
}

.pagination-container :deep(.el-pagination) {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  color: #6f7d92;
  flex-wrap: wrap;
}

.pagination-container :deep(.el-pagination__total) {
  margin-right: 10px;
  color: #6f7d92;
  font-size: 12px;
  border-right: 1px solid rgba(148, 163, 184, 0.22);
  padding-right: 10px;
}

.pagination-container :deep(.btn-prev),
.pagination-container :deep(.btn-next),
.pagination-container :deep(.el-pager li) {
  min-width: 28px;
  height: 28px;
  line-height: 26px;
  padding: 0 6px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.72);
  color: #516079;
  font-weight: 400;
  margin: 0;
  font-size: 12px;
}

.pagination-container :deep(.el-pager li:not(.is-active):hover),
.pagination-container :deep(.btn-prev:hover:not(.disabled)),
.pagination-container :deep(.btn-next:hover:not(.disabled)) {
  color: #1f3356;
  background-color: rgba(79, 124, 255, 0.08);
  border-color: rgba(79, 124, 255, 0.2);
}

.pagination-container :deep(.el-pager li.is-active) {
  background-color: rgba(79, 124, 255, 0.14);
  color: #1f3356;
  border-color: rgba(79, 124, 255, 0.28);
}

.pagination-container :deep(.btn-prev.is-disabled),
.pagination-container :deep(.btn-next.is-disabled) {
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.48);
  border-color: rgba(148, 163, 184, 0.14);
}

.pagination-container :deep(.el-pagination__sizes),
.pagination-container :deep(.el-pagination__jump) {
  margin: 0;
  color: #6f7d92;
}

.pagination-container :deep(.el-select .el-input__wrapper),
.pagination-container :deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.72);
}

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
