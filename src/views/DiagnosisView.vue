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
                <div class="stat-value">128</div>
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
                <div class="stat-value">24</div>
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
                <div class="stat-value">89</div>
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
                <div class="stat-value">15</div>
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
            <el-select v-model="filterStatus" placeholder="任务状态" clearable @change="getData()">
              <el-option label="全部" value=-1 />
              <el-option label="待执行" value=4 />
              <el-option label="进行中" value=0 />
              <el-option label="已完成" value=1 />
              <el-option label="失败" value=2 />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select v-model="filterPriority" placeholder="优先级" clearable @change="getData()">
              <el-option label="全部" value=-1 />
              <el-option label="高" value=2 />
              <el-option label="中" value=1 />
              <el-option label="低" value=0 />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
              end-placeholder="结束日期" size="default" />
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="getData()">查询</el-button>
            <el-button>重置</el-button>
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

        <VirtualTable 
          :data="taskList" 
          :columns="columns" 
          :height="400" 
          :loading="loading" 
          style="width: 100%" 
          class="task-table" 
        />

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
            :total="total" layout="total, sizes, prev, pager, next, jumper" background />
        </div>
      </el-card>
    </div>
    <!-- 历史数据查询面板弹窗 -->
    <el-drawer v-model="showPanel" :modal="false" modal-penetrable :with-header="false" :resizable="true" size="50%">
      <!-- <span>任务详情</span> -->
      <TaskDetailsComponent :taskId="currentTaskId" :before-close="close" />
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
const currentTaskId = ref<number>(0)

const detailClick = (id: number) => {
  currentTaskId.value = id
  showPanel.value = true
}

const handleClosePanel = () => {
  showPanel.value = false
  currentTaskId.value = 0
}

// 搜索和筛选
const searchKeyword = ref('')
const filterStatus = ref(undefined)
const filterPriority = ref(undefined)
const dateRange = ref<[Date, Date]>()
// 分页
const currentPage = ref(1)
const pageSize = ref(20)
//const total = ref(128)

// 查询参数
const queryParams = ref<QueryParams>({})

// 测试数据
const testTaskData: DiagnosisTask[] = [
  {
    id: 1,
    name: '设备A异常诊断',
    device_id: 'DEV-001',
    status: '0',
    priority: '2',
    create_time: 1707900000000,
    update_time: 1707906000000
  },
  {
    id: 2,
    name: '生产线性能分析',
    device_id: 'DEV-002',
    status: '1',
    priority: '1',
    create_time: 1707813600000,
    update_time: 1707897600000
  },
  {
    id: 3,
    name: '传感器数据校准',
    device_id: 'DEV-003',
    status: '4',
    priority: '0',
    create_time: 1707727200000,
    update_time: 1707727200000
  },
  {
    id: 4,
    name: '系统健康度评估',
    device_id: 'DEV-001',
    status: '2',
    priority: '2',
    create_time: 1707640800000,
    update_time: 1707903600000
  },
  {
    id: 5,
    name: '预测性维护分析',
    device_id: 'DEV-004',
    status: '0',
    priority: '1',
    create_time: 1707554400000,
    update_time: 1707904200000
  },
  {
    id: 6,
    name: '工业设备监测',
    device_id: 'DEV-005',
    status: '1',
    priority: '0',
    create_time: 1707468000000,
    update_time: 1707901800000
  },
  {
    id: 7,
    name: '故障根因分析',
    device_id: 'DEV-002',
    status: '0',
    priority: '2',
    create_time: 1707381600000,
    update_time: 1707906600000
  },
  {
    id: 8,
    name: '能源消耗优化',
    device_id: 'DEV-006',
    status: '4',
    priority: '1',
    create_time: 1707295200000,
    update_time: 1707295200000
  }
]

// const taskList = ref<DiagnosisTask[]>(testTaskData)
const taskList = testTaskData
const total = ref(testTaskData.length)
const api = new DiagnosticApi()
const getData = async () => {
  try {
    queryParams.value = {
      page: currentPage.value,
      pageSize: pageSize.value,
      status: filterStatus.value == -1 ? undefined : filterStatus.value,
      priority: filterPriority.value == -1 ? undefined : filterPriority.value,
      name: searchKeyword.value,
      startTime: dateRange.value ? dateRange.value[0].getTime() : undefined,
      endTime: dateRange.value ? dateRange.value[1].getTime() : undefined

    }
    console.log('[DiagnosisView] 请求参数:', queryParams.value)
    const res = await api.getDiagnosisList(queryParams.value)
    if (res.success) {
      taskList.value = res.data
      total.value = res.total
    }
  } catch (error) {
    console.error('获取诊断任务列表失败:', error)
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
    key: 'create_time', 
    title: '创建时间', 
    dataKey: 'create_time', 
    width: 160,
    isTime: true
  },
  { 
    key: 'update_time', 
    title: '更新时间', 
    dataKey: 'update_time', 
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
      { label: '查看', type: 'primary', onClick: (row: DiagnosisTask) => detailClick(row.id) },
      { label: '暂停', type: 'warning', onClick: (row: DiagnosisTask) => console.log('暂停', row), show: (row: DiagnosisTask) => row.status === 0 },
      { label: '启动', type: 'success', onClick: (row: DiagnosisTask) => console.log('启动', row), show: (row: DiagnosisTask) => row.status === 4 },
      { label: '删除', type: 'danger', onClick: (row: DiagnosisTask) => deleteTask(row.id) }
    ]
  }
]

// 初始化加载数据
onMounted(() => {
  getData()
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
