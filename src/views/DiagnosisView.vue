<template>
  <main-layout>
    <div class="diagnosis-main">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2 class="page-title">诊断任务管理</h2>
        <el-button type="primary" class="create-btn" @click="add()">
          <el-icon><Plus /></el-icon>
          新建任务
        </el-button>
      </div>

      <!-- 统计卡片区域 -->
      <el-row :gutter="20" class="statistics-row">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total">
                <el-icon><Document /></el-icon>
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
                <el-icon><Loading /></el-icon>
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
                <el-icon><CircleCheck /></el-icon>
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
                <el-icon><CircleClose /></el-icon>
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
            <el-input
              v-model="searchKeyword"
              placeholder="搜索任务名称"
              prefix-icon="Search"
              clearable
            />
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
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="default"
            />
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
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </template>

        <el-table
          :data="taskList"
          style="width: 100%"
          class="task-table"
        >
          <el-table-column prop="id" label="任务ID" width="100" />
          <el-table-column prop="name" label="任务名称" min-width="180" />
          <el-table-column prop="device_id" label="设备ID" width="120" />
          <el-table-column label="任务状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="优先级" width="100">
            <template #default="{ row }">
              <el-tag :type="getPriorityType(row.priority)" size="small">
                {{ getPriorityText(row.priority) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="160" >
            <template #default="{ row }">
              {{ formatTimestamp(row.create_time) }}
            </template>
          </el-table-column>
          <el-table-column  label="更新时间" width="160">
            <template #default="{ row }">
              {{ formatTimestamp(row.update_time) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="detailClick(row.id)">查看</el-button>
              <el-button link type="warning" size="small" v-if="row.status === 0">暂停</el-button>
              <el-button link type="success" size="small" v-if="row.status === 4">启动</el-button>
              <el-button link type="danger" size="small" @click="deleteTask(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            background
          />
        </div>
      </el-card>
    </div>
    <!-- 历史数据查询面板弹窗 -->
        <el-drawer 
        v-model="showPanel" :modal="false" modal-penetrable :with-header="false"
        :resizable="true" size="50%">
          <!-- <span>任务详情</span> -->
          <TaskDetailsComponent :taskId="currentTaskId" :before-close="close"/>
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
const addShow=ref(false)
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
const total = ref(128)

// 查询参数
const queryParams = ref<QueryParams>({})
const taskList = ref<DiagnosisTask[]>([])
const api = new DiagnosticApi()
const getData = async () => {
  try {
    queryParams.value = {
      page: currentPage.value,
      pageSize: pageSize.value,
      status:filterStatus.value==-1?undefined:filterStatus.value,
      priority:filterPriority.value==-1?undefined:filterPriority.value,
      name:searchKeyword.value,
      startTime:dateRange.value?dateRange.value[0].getTime():undefined,
      endTime:dateRange.value?dateRange.value[1].getTime():undefined
      
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
const add=()=>{
  // 新增表单弹出
  addShow.value=true
  getData()
}
// 新增表单的关闭
const close=()=>{
  addShow.value=true
}

// 删除
const deleteTask = async (id: number) => {
  const res = await api.deleteDiagnosisTask(id)
  if(res.success){
    ElMessage.success('删除成功')
    getData()
  }else{
    ElMessage.error('删除失败')
  }
}



// 时间戳转换
const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}
// 状态映射
const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    4:'pending',
    0:'running',
    1:'completed',
    2:'failed'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    4: '待执行',
    0: '进行中',
    1: '已完成',
    2: '失败'
  }
  return map[status] || status
}

// 优先级映射
const getPriorityType = (priority: string) => {
  const map: Record<string, any> = {
    2: 'danger',
    1: 'warning',
    0: 'info'
  }
  return map[priority] || 'info'
}

const getPriorityText = (priority: string) => {
  const map: Record<string, string> = {
    2: '高',
    1: '中',
    0: '低'
  }
  return map[priority] || priority
}

// 初始化加载数据
onMounted(() => {
  getData()
})
</script>

<style scoped>
.diagnosis-main {
  padding: 20px;
  background-color: #F5F7FA;
  min-height: 100%;
}

/* 页面标题 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  color: #303133;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.create-btn {
  background-color: #4A90E2;
  border-color: #4A90E2;
}

.create-btn:hover {
  background-color: #357ABD;
  border-color: #357ABD;
}

/* 统计卡片 */
.statistics-row {
  margin-bottom: 20px;
}

.stat-card {
  background-color: #FFFFFF;
  border: 1px solid rgba(74, 144, 226, 0.15);
  border-radius: 8px;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: rgba(74, 144, 226, 0.3);
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.stat-icon.running {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.stat-icon.completed {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

.stat-icon.failed {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: #fff;
}

.stat-info {
  flex: 1;
}

.stat-label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 4px;
}

.stat-value {
  color: #303133;
  font-size: 28px;
  font-weight: 700;
}

/* 筛选卡片 */
.filter-card {
  background-color: #FFFFFF;
  border: 1px solid rgba(74, 144, 226, 0.15);
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.filter-card :deep(.el-card__body) {
  padding: 16px;
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
  background-color: #FFFFFF;
  border: 1px solid rgba(74, 144, 226, 0.15);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #303133;
  font-weight: 600;
}

/* 表格样式 */
.task-table {
  background-color: #FFFFFF;
}

.task-table :deep(.el-table__header-wrapper) {
  background-color: #F5F7FA;
}

.task-table :deep(.el-table__header th) {
  background-color: #F5F7FA;
  color: #606266;
  font-weight: 600;
  border-bottom: 1px solid #EBEEF5;
}

.task-table :deep(.el-table__body tr) {
  background-color: #FFFFFF;
  color: #606266;
}

.task-table :deep(.el-table__body tr:hover > td) {
  background-color: rgba(74, 144, 226, 0.05) !important;
}

.task-table :deep(.el-table__body tr.el-table__row--striped) {
  background-color: #FAFAFA;
}

.task-table :deep(.el-table__body td) {
  border-bottom: 1px solid #EBEEF5;
}

.task-table :deep(.el-table__empty-block) {
  background-color: #FFFFFF;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding: 16px 0;
}

/* 滚动条美化 */
.diagnosis-main::-webkit-scrollbar {
  width: 8px;
}

.diagnosis-main::-webkit-scrollbar-track {
  background: #F0F2F5;
  border-radius: 4px;
}

.diagnosis-main::-webkit-scrollbar-thumb {
  background: #C0C4CC;
  border-radius: 4px;
}

.diagnosis-main::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

</style>

