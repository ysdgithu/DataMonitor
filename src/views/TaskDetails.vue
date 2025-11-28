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
      <el-divider style="margin: 0"/>
      <el-main style="padding: 20px;">
        <!-- 处理人+任务详情+设备+创建时间 -->
        <el-col class="info-section">
            <p class="info-item"><span class="label">处理人：</span>{{ taskDetail?.assignee }}</p>
            <p class="info-item"><span class="label">任务描述：</span>{{ taskDetail?.detail }}</p>
            <p class="info-item"><span class="label">设备：</span>{{ taskDetail?.device_id }}</p>
            <p class="info-item"><span class="label">创建时间：</span>{{ formatTime(taskDetail?.createTime) }}</p>
        </el-col>
        <el-divider />
        <!-- ai 分析部分 -->
        <div class="ai-analysis-section">
          <el-button type="primary" class="ai-button" @click="askAI">
            <el-icon ><Connection /></el-icon>
            AI 一键分析
          </el-button>
          <!-- ai 分析结果 -->
          <el-card class="ai-result-card">
            <template #header>
              <div class="ai-result-header">
                <el-icon><ChatRound /></el-icon>
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
import { ref, onMounted, watch, defineProps } from 'vue'
import { Connection, ChatRound } from '@element-plus/icons-vue'
import { DiagnosticApi, type DiagnosisTask ,type TriggerDiagnosisParams,type AIDiagnosisResponse} from '../utils/diagnosticApi'
import MarkdownIt from 'markdown-it'

const first=ref(true)
// 接收任务ID属性
const props = defineProps<{
  taskId: number
}>()

// 任务详情数据
const taskDetail = ref<DiagnosisTask>()
let aiResult = ref('')
let aiResultHtml = ref('')
const loading = ref(true)
const md = new MarkdownIt()
// 获取任务详情
const getTaskDetail = async () => {
  if (!props.taskId) return
  
  try {
    const api = new DiagnosticApi()
    const res = await api.getDiagnosisDetail(props.taskId)
    if (res.success) {
      taskDetail.value = res.data
    }
  } catch (error) {
    console.error('获取任务详情失败:', error)
  }
}

// 监听任务ID变化
watch(() => props.taskId, (newId) => {
  if (newId) {
    getTaskDetail()
  }
}, { immediate: true })

// 格式化时间戳
const formatTime = (timestamp?: number) => {
  if (!timestamp) return '暂无数据'
  return new Date(timestamp).toLocaleString()
}

// askAI
const askAI = async() => {
   first.value=false
   const api=new DiagnosticApi()
   const params: TriggerDiagnosisParams = {
     timestamp: Date.now(),
     deviceId: taskDetail.value?.device_id || '000',
     diagnosisTaskId: props.taskId
   }
   const res: AIDiagnosisResponse =await api.triggerAIDiagnosis(params)
   aiResult.value=convertMD(res.data.diagnosis.diagnosis)
   aiResultHtml.value=aiResult.value
   loading.value=false
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

// 完成当前任务处理 4-0-1
const updateTask = () => {
  const api = new DiagnosticApi()
  const res=api.updateDiagnosisTask(props.taskId,{})
}



// 状态映射
const getStatusType = (status?: number) => {
  const map: Record<number, string> = {
    4: 'info',
    0: 'warning',
    1: 'success',
    2: 'danger'
  }
  return map[status || 4] || 'info'
}

const getStatusText = (status?: number) => {
  const map: Record<number, string> = {
    4: '待执行',
    0: '进行中',
    1: '已完成',
    2: '失败'
  }
  return map[status || 4] || '未知'
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
    font-size: 18px;
    margin: 0;
}

.info-section {
    margin-bottom: 20px;
}

.info-item {
    margin: 8px 0;
}

.label {
    color: #94A3B8;
    display: inline-block;
    width: 80px;
}

.ai-analysis-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.ai-button {
    align-self: flex-start;
}

.ai-result-card {
    border: 1px solid rgba(74, 144, 226, 0.15);
    border-radius: 8px;
}

.ai-result-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
}

.ai-result-content {
    padding: 12px;
    background-color: rgba(74, 144, 226, 0.1);
    border-radius: 4px;
    line-height: 1.5;
}

:deep(.el-card__header) {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(74, 144, 226, 0.15);
}

:deep(.el-card__body) {
    padding: 16px;
}

:deep(.el-divider--horizontal) {
    border-color: rgba(74, 144, 226, 0.15);
}
</style>
