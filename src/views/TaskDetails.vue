<template>
  <div class="common-layout" style="height: 100%;">
    <el-container>
      <el-header style="height: auto; padding: 16px;">
        <!-- 任务名+状态+优先级   修改状态和优先级-->
        <el-row class="task-header">
          <el-space size="medium">
            <h3 class="task-title">{{ taskDetail?.name }}</h3>
            <el-tag :type="getStatusType(taskDetail?.status)">{{ getStatusText(taskDetail?.status) }}</el-tag>
            <el-tag :type="getPriorityType(taskDetail?.priority)">{{ getPriorityText(taskDetail?.priority) }}</el-tag>
          </el-space>
          <el-button type="primary">完成</el-button>
        </el-row>
      </el-header>
      <el-divider style="margin: 0" />
      <el-main style="padding: 20px;">
        <!-- 处理人+任务详情+设备+创建时间 -->
        <el-col class="info-section">
          <p class="info-item"><span class="label">处理人：</span>{{ taskDetail?.assignee }}</p>
          <p class="info-item"><span class="label">设备：</span>{{ taskDetail?.device_id }}</p>
          <p class="info-item"><span class="label">创建时间：</span>{{ formatTime(taskDetail?.createTime) }}</p>
          <!-- 任务描述：优先解析 JSON 详情，否则直接显示原文 -->
          <div class="info-item detail-block">
            <span class="label">任务描述：</span>
            <div class="detail-content">
              <pre class="detail-summary">{{ parsedDetail.summary }}</pre>
              <pre v-if="parsedDetail.detailData" class="detail-formatted">{{ formatDetailData(parsedDetail.detailData) }}</pre>
            </div>
          </div>
        </el-col>
        <el-divider />
        <!-- ai 分析部分 -->
        <div class="ai-analysis-section">
          <el-button type="primary" class="ai-button" @click="askAI">
            <el-icon>
              <Connection />
            </el-icon>
            AI 一键分析
          </el-button>
          <!-- ai 分析结果 -->
          <el-card class="ai-result-card">
            <template #header>
              <div class="ai-result-header">
                <el-icon>
                  <ChatRound />
                </el-icon>
                <span>AI 分析结果</span>
              </div>
            </template>
            <div class="ai-result-content">
              <div v-if="first"></div>
              <div v-loading="loading" v-html="aiResultHtml" v-else></div>
            </div>
          </el-card>
        </div>
      </el-main>
    </el-container>
  </div>

</template>

<script setup lang="ts">
import { ref, onMounted, computed, defineProps } from 'vue'
import { Connection, ChatRound } from '@element-plus/icons-vue'
import { DiagnosticApi, type DiagnosisTask, type TriggerDiagnosisParams, type AIDiagnosisResponse } from '../utils/diagnosticApi'
import { parseTaskDetail, formatDetailData } from '../utils/alarmFormatter'
import MarkdownIt from 'markdown-it'

const first = ref(true)
// 接收任务数据属性
const props = defineProps<{
  taskData?: DiagnosisTask
}>()

// 任务详情数据（直接使用传入的数据）
const taskDetail = computed<DiagnosisTask | undefined>(() => props.taskData)

// 解析任务描述中的 JSON 详情
const parsedDetail = computed(() => {
  return parseTaskDetail(taskDetail.value?.detail || '')
})
let aiResult = ref('')
let aiResultHtml = ref('')
const loading = ref(true)
const md = new MarkdownIt()

// 格式化时间戳
const formatTime = (timestamp?: number) => {
  if (!timestamp) return '暂无数据'
  return new Date(timestamp).toLocaleString()
}

// askAI
const askAI = async () => {
  first.value = false
  const api = new DiagnosticApi()
  const params: TriggerDiagnosisParams = {
    timestamp: Date.now(),
    deviceId: taskDetail.value?.device_id || '000',
    diagnosisTaskId: taskDetail.value?.id || 0
  }
  const res: AIDiagnosisResponse = await api.triggerAIDiagnosis(params)
  aiResult.value = convertMD(res.data.diagnosis.diagnosis)
  aiResultHtml.value = aiResult.value
  loading.value = false
}
// md格式转换
const convertMD = (data: string) => {
  let raw = data
  // 1. 每个 #### 前加换行
  raw = raw.replace(/(####)/g, '\n$1')
  // 2. 标题后加换行（让标题和内容分开）
  raw = raw.replace(/(#### .+?)(?=[^#])/g, '$1\n')
  // 3. 短横线前加换行（让列表项单独一行）
  raw = raw.replace(/(\s)- /g, '\n- ')
  // 4. 数字列表前加换行
  raw = raw.replace(/(\d\.) /g, '\n$1 ')
  return md.render(raw)
}

// 完成当前任务处理
const updateTask = () => {
  console.log('完成任务:', taskDetail.value?.id)
}



// 状态映射
const getStatusType = (status?: number) => {
  const map: Record<number, string> = {
    0: 'warning',
    1: 'success',
    2: 'danger'
  }
  return map[status || 0] || 'info'
}

const getStatusText = (status?: number) => {
  const map: Record<number, string> = {
    0: '进行中',
    1: '已完成',
    2: '失败'
  }
  return map[status || 0] || '未知'
}

// 优先级映射
const getPriorityType = (priority?: number) => {
  const map: Record<number, string> = {
    2: 'danger',
    1: 'warning',
    0: 'info'
  }
  return map[priority || 0] || 'info'
}

const getPriorityText = (priority?: number) => {
  const map: Record<number, string> = {
    2: '高',
    1: '中',
    0: '低'
  }
  return map[priority || 0] || '未知'
}
onMounted(() => {
  //askAI()
})

</script>

<style scoped>
.task-header {
  display: flex;
  align-items: center;
}

.task-title {
  font-weight: bold;
  font-size: var(--font-lg);
  margin: 0;
}

.info-section {
  margin-bottom: var(--spacing-base);
}

.info-item {
  margin: var(--spacing-sm) 0;
}

.label {
  color: var(--text-tertiary);
  display: inline-block;
  width: 80px;
  flex-shrink: 0;
}

.detail-block {
  display: flex;
  align-items: flex-start;
}

.detail-content {
  flex: 1;
  min-width: 0;
}

.detail-summary {
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-main);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0 0 8px 0;
  padding: 0;
  background: transparent;
}

.detail-formatted {
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  font-size: 13px;
  line-height: 1.7;
  color: #555;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  border-left: 3px solid var(--primary);
}

.ai-analysis-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.ai-button {
  align-self: flex-start;
}

.ai-result-card {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
}

.ai-result-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
}

.ai-result-content {
  padding: var(--spacing-sm);
  background-color: var(--primary-light);
  border-radius: var(--radius-sm);
  line-height: 1.5;
}

:deep(.el-card__header) {
  padding: var(--spacing-sm) var(--spacing-base);
  border-bottom: 1px solid var(--border-light);
}

:deep(.el-card__body) {
  padding: var(--spacing-base);
}

:deep(.el-divider--horizontal) {
  border-color: var(--border-light);
}
</style>
