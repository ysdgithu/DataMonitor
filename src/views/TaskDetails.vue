<template>
  <div class="task-detail-page">
    <div class="page-header">
      <div>
        <div class="page-kicker">诊断任务管理</div>
        <h2 class="page-title">{{ taskDetail?.name }}</h2>
      </div>
      <div class="header-actions">
        <el-tag :type="getStatusType(taskDetail?.status)" effect="plain">{{ getStatusText(taskDetail?.status) }}</el-tag>
        <el-tag :type="getPriorityType(taskDetail?.priority)" effect="plain">{{ getPriorityText(taskDetail?.priority) }}</el-tag>
        <el-button type="primary" class="primary-btn" :loading="confirmingTask" :disabled="taskDetail?.status === 1" @click="confirmTask">
          {{ taskDetail?.status === 1 ? '已确认' : '确认' }}
        </el-button>
        <el-button type="primary" class="primary-btn" :loading="updatingTask" :disabled="taskDetail?.status === 2" @click="updateTask">
          {{ taskDetail?.status === 2 ? '已完成' : '完成' }}
        </el-button>
      </div>
    </div>

    <el-card class="detail-card" shadow="never">
      <div class="info-grid">
        <p class="info-item"><span class="label">处理人：</span>{{ taskDetail?.assignee }}</p>
        <p class="info-item"><span class="label">设备：</span>{{ taskDetail?.device_id }}</p>
        <p class="info-item"><span class="label">创建时间：</span>{{ formatTime(taskDetail?.createTime) }}</p>
      </div>

      <div class="detail-block">
        <span class="label label-top">任务描述：</span>
        <div class="detail-content">
          <pre class="detail-summary">{{ parsedDetail.summary }}</pre>
          <pre v-if="parsedDetail.detailData" class="detail-formatted">{{ formatDetailData(parsedDetail.detailData) }}</pre>
        </div>
      </div>
    </el-card>

    <el-card class="ai-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>AI 分析</span>
          <el-button type="primary" class="primary-btn" @click="askAI">
            <el-icon>
              <Connection />
            </el-icon>
            AI 一键分析
          </el-button>
        </div>
      </template>

      <div class="ai-result-content" v-loading="loading">
        <div class="ai-result-inner" v-html="aiResultHtml" @click="handleAiResultClick"></div>

        <div v-if="displayReferences.length" class="references-block">
          <p class="references-title">参考来源：</p>
          <ul class="reference-list">
            <li v-for="(ref, idx) in displayReferences" :key="ref.refId || idx" class="reference-item">
              <button type="button" class="reference-pill reference-pill-button" @click="openReferenceCard(ref)">
                {{ ref.name || `来源 ${idx + 1}` }}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="referenceVisible" width="720px" class="reference-dialog" title="参考文本块" @close="closeReferenceDialog">
      <div v-if="activeReference" class="reference-dialog-content">
        <div class="reference-dialog-header">
          <div>
            <p class="reference-dialog-title">{{ activeReference.name || '参考来源' }}</p>
            <p class="reference-dialog-subtitle">
              <span v-if="activeReference.figureLabel">{{ activeReference.figureLabel }}</span>
              <span v-if="activeReference.page !== undefined"> · 第 {{ activeReference.page }} 页</span>
            </p>
          </div>
          <el-button v-if="activeReference.url" type="primary" link @click="openSourceLink(activeReference)">打开来源</el-button>
        </div>

        <div class="reference-dialog-snippet">
          <p class="text-sm" style="margin-bottom: 8px; color: var(--text-secondary);">文本块</p>
          <p style="white-space: pre-wrap; line-height: 1.8;">{{ activeReference.snippet || '暂无片段内容' }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Connection } from '@element-plus/icons-vue'
import { DiagnosticApi, type DiagnosisTask } from '../utils/diagnosticApi'
import { parseTaskDetail, formatDetailData } from '../utils/alarmFormatter'
import { ElMessage, ElMessageBox } from 'element-plus'
import MarkdownIt from 'markdown-it'

const first = ref(true)
// 接收任务数据属性
const props = defineProps<{
  taskData?: DiagnosisTask
}>()

const emit = defineEmits<{
  (e: 'task-updated', payload: { id: number; status: number }): void
}>()

// 任务详情数据（直接使用传入的数据）
const taskDetail = computed<DiagnosisTask | undefined>(() => props.taskData)

/** 后端自动诊断完成后会把整段报告写在 detail 里（含以下标记），不会写入 ai 列 */
const isAutomatedAiReportDetail = (detail: string) => {
  const t = detail.trim()
  return t.startsWith('【AI诊断报告】') || t.startsWith('【基础诊断报告】')
}

// 解析任务描述：若 detail 仅为自动诊断全文且无独立 ai 列，避免与下方「AI 分析结果」重复展示
const parsedDetail = computed(() => {
  const raw = taskDetail.value?.detail || ''
  const hasRagflowAi = !!(taskDetail.value?.ai && String(taskDetail.value.ai).trim())
  if (!hasRagflowAi && isAutomatedAiReportDetail(raw)) {
    return {
      summary: '系统自动诊断已完成，完整报告见下方「AI 分析结果」。',
      detailData: undefined
    }
  }
  return parseTaskDetail(raw)
})
let aiResult = ref('')
let aiResultHtml = ref('')
const references = ref<Array<{ name?: string; url?: string; figureLabel?: string; snippet?: string; page?: number; refId?: string | number }>>([])
const displayReferences = computed(() => {
  const seen = new Set<string>()
  return references.value.filter((ref) => {
    const dedupeKey = [ref.docId, ref.refId, ref.source, ref.url, ref.title, ref.name]
      .map((item) => String(item || '').trim())
      .find((item) => item.length > 0) || ''
    if (!dedupeKey) return true
    if (seen.has(dedupeKey)) return false
    seen.add(dedupeKey)
    return true
  }).map((ref, index) => ({
    ...ref,
    refId: ref.refId ?? String(index + 1),
    displayId: String(index + 1),
    name: ref.name || ref.figureLabel || `来源 ${index + 1}`
  }))
})
const referenceVisible = ref(false)
const activeReference = ref<{ name?: string; url?: string; figureLabel?: string; snippet?: string; page?: number } | null>(null)
const loading = ref(true)
const updatingTask = ref(false)
const confirmingTask = ref(false)
const md = new MarkdownIt()
const api = new DiagnosticApi()

// 格式化时间戳
const formatTime = (timestamp?: number) => {
  if (!timestamp) return '暂无数据'
  return new Date(timestamp).toLocaleString()
}

// 初始化时：RAGFlow 结果在 ai 列；自动诊断流水线写在 detail 且带报告标记
const initAIResult = () => {
  const fromAiCol = (taskDetail.value?.ai && String(taskDetail.value.ai).trim()) || ''
  const detail = taskDetail.value?.detail || ''
  const fromDetail =
    !fromAiCol && isAutomatedAiReportDetail(detail) ? detail.trim() : ''
  const savedAi = fromAiCol || fromDetail
  if (savedAi) {
    first.value = false
    aiResult.value = savedAi
    aiResultHtml.value = formatAiAnswer(savedAi)
    loading.value = false
    return
  }

  first.value = false
  aiResult.value = ''
  references.value = []
  aiResultHtml.value = '<p style="color: #999;">暂无 AI 分析结果，点击「AI 一键分析」生成。</p>'
  loading.value = false
}

// askAI - 流式调用 RAGFlow AI 分析
const askAI = async () => {
  first.value = false
  loading.value = true
  aiResult.value = ''
  aiResultHtml.value = ''
  references.value = []

  const api = new DiagnosticApi()
  const taskId = taskDetail.value?.id

  if (!taskId) {
    aiResultHtml.value = '<p style="color: red;">任务 ID 无效</p>'
    loading.value = false
    return
  }

  try {
    await api.streamAIAnalysis(taskId, {
      onMessage: (content) => {
        aiResult.value += content
        aiResultHtml.value = formatAiAnswer(aiResult.value)
        loading.value = false
      },
      onReferences: (refs) => {
        const normalized = refs.map((ref, index) => normalizeReference(ref, index))
        const seen = new Set<string>()
        references.value = normalized.filter((ref) => {
          const dedupeKey = [ref.refId, ref.source, ref.url, ref.title, ref.name]
            .map((item) => String(item || '').trim())
            .find((item) => item.length > 0) || ''
          if (!dedupeKey) return true
          if (seen.has(dedupeKey)) return false
          seen.add(dedupeKey)
          return true
        })
        loading.value = false
      },
      onError: (error) => {
        aiResultHtml.value = `<p style="color: red;">AI 分析出错: ${error}</p>`
        loading.value = false
      },
      onDone: () => {
        loading.value = false
      }
    })
  } catch (err: any) {
    aiResultHtml.value = `<p style="color: red;">AI 分析失败: ${err.message}</p>`
    loading.value = false
  }
}
const formatAiAnswer = (data: string) => {
  const sourceText = String(data || '')
  const withLineBreaks = sourceText
    .replace(/(####)/g, '\n$1')
    .replace(/(#### .+?)(?=[^#])/g, '$1\n')
    .replace(/(\s)- /g, '\n- ')
    .replace(/(\d\.) /g, '\n$1 ')

  const html = md.render(withLineBreaks)
    .replace(/Fig\.\s*\[ID:\s*(\d+)\]/g, (_match, id) => {
      return `<button type="button" class="inline-reference" data-ref-id="${id}">Fig. ${id}</button>`
    })
    .replace(/\[ID:\s*(\d+)\]/g, (_match, id) => {
      return `<button type="button" class="inline-reference" data-ref-id="${id}">Fig. ${id}</button>`
    })
    .replace(/Fig\.\s*(\d+)/g, (_match, id) => {
      return `<button type="button" class="inline-reference" data-ref-id="${id}">Fig. ${id}</button>`
    })

  return html
}

const normalizeReference = (ref: any, index = 0) => ({
  name: ref?.name || ref?.title || ref?.doc_name || ref?.document_name || ref?.source_name || `来源 ${index + 1}`,
  url: ref?.url || ref?.source_url || ref?.link,
  figureLabel: ref?.figureLabel || ref?.figure || ref?.label || ref?.chunk_label,
  snippet: ref?.snippet || ref?.content || ref?.text || ref?.chunk || ref?.excerpt,
  page: ref?.page ?? ref?.page_no ?? ref?.pageNumber,
  source: ref?.source || ref?.file_path || ref?.path,
  title: ref?.title || ref?.doc_title || ref?.document_title,
  refId: ref?.refId ?? ref?.id ?? ref?.chunk_id ?? ref?.chunkId ?? ref?.reference_id,
  docId: ref?.docId ?? ref?.documentId ?? ref?.fileId ?? ref?.file_id
})

const openReference = (ref: any) => {
  activeReference.value = ref || null
  referenceVisible.value = true
}

const openReferenceCard = (ref: any) => {
  openReference(ref)
}

const openSourceLink = (ref: any) => {
  if (ref?.url) {
    window.open(ref.url, '_blank', 'noopener,noreferrer')
  }
}

const openReferenceById = (refId: string) => {
  const id = String(refId || '').trim().replace(/^Fig\.?\s*/i, '').replace(/[^\d]/g, '')
  const target = displayReferences.value.find(ref => String(ref.displayId ?? '').trim() === id)
    || displayReferences.value.find(ref => String(ref.refId ?? '').trim() === id)
  if (target) {
    openReference(target)
  }
}

const closeReferenceDialog = () => {
  referenceVisible.value = false
  activeReference.value = null
}

const handleAiResultClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null
  const button = target?.closest?.('button[data-ref-id]') as HTMLButtonElement | null
  if (!button) return
  const refId = button.getAttribute('data-ref-id')
  if (refId) {
    openReferenceById(refId)
  }
}

// 确认当前任务（状态 -> 1 进行中）
const confirmTask = async () => {
  const id = taskDetail.value?.id
  if (!id) {
    ElMessage.error('任务ID无效')
    return
  }

  if (taskDetail.value?.status === 1) {
    ElMessage.info('任务已是进行中状态')
    return
  }

  try {
    await ElMessageBox.confirm('确认将该诊断任务标记为“进行中”吗？', '确认任务', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  try {
    confirmingTask.value = true
    const res = await api.updateDiagnosisTask(id, { status: 1 })
    if (res.success) {
      if (taskDetail.value) {
        taskDetail.value.status = 1
      }
      emit('task-updated', { id, status: 1 })
      ElMessage.success('任务已标记为进行中')
    } else {
      ElMessage.error(res.message || '任务状态更新失败')
    }
  } catch (error: any) {
    console.error('[TaskDetails] 确认任务失败:', error)
    ElMessage.error(error?.message || '任务状态更新失败')
  } finally {
    confirmingTask.value = false
  }
}

// 完成当前任务（状态 -> 2 已完成）
const updateTask = async () => {
  const id = taskDetail.value?.id
  if (!id) {
    ElMessage.error('任务ID无效')
    return
  }

  if (taskDetail.value?.status === 2) {
    ElMessage.info('任务已是完成状态')
    return
  }

  try {
    await ElMessageBox.confirm('确认将该诊断任务标记为“已完成”吗？', '完成确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  try {
    updatingTask.value = true
    const res = await api.updateDiagnosisTask(id, { status: 2 })
    if (res.success) {
      if (taskDetail.value) {
        taskDetail.value.status = 2
      }
      emit('task-updated', { id, status: 2 })
      ElMessage.success('任务已标记为完成')
    } else {
      ElMessage.error(res.message || '任务状态更新失败')
    }
  } catch (error: any) {
    console.error('[TaskDetails] 更新任务状态失败:', error)
    ElMessage.error(error?.message || '任务状态更新失败')
  } finally {
    updatingTask.value = false
  }
}


// 状态映射
const getStatusType = (status?: number) => {
  const map: Record<number, string> = {
    0: 'warning',
    1: 'primary',
    2: 'success',
    3: 'danger'
  }
  return map[status ?? 0] || 'info'
}

const getStatusText = (status?: number) => {
  const map: Record<number, string> = {
    0: '待确认',
    1: '进行中',
    2: '已完成',
    3: '失败'
  }
  return map[status ?? 0] || '未知'
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

// 监听 taskData 变化：切换任务时重置 AI 分析状态
watch(() => props.taskData, (newTask, oldTask) => {
  if (newTask?.id !== oldTask?.id) {
    first.value = true
    aiResult.value = ''
    aiResultHtml.value = ''
    loading.value = true
    initAIResult()
  }
}, { immediate: true })

onMounted(() => {
  initAIResult()
})

</script>

<style scoped>
.task-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.page-kicker {
  color: #6b7a90;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #182235;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.primary-btn {
  background: rgba(79, 124, 255, 0.14);
  border-color: rgba(79, 124, 255, 0.24);
  color: #1f3356;
}

.primary-btn:hover,
.primary-btn:focus {
  background: rgba(79, 124, 255, 0.18);
  border-color: rgba(79, 124, 255, 0.3);
  color: #1f3356;
}

.detail-card,
.ai-card {
  border: 0;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(31, 45, 61, 0.08);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px 20px;
  margin-bottom: 16px;
}

.info-item {
  margin: 0;
  color: #24324a;
}

.label {
  color: #6f7d92;
  display: inline-block;
  width: 80px;
  flex-shrink: 0;
}

.label-top {
  padding-top: 2px;
}

.detail-block {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.detail-content {
  flex: 1;
  min-width: 0;
}

.detail-summary {
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #24324a;
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
  color: #4d5a70;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  padding: 0;
  background: transparent;
  border: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-weight: 600;
  color: #172033;
}

.ai-result-content {
  padding: 4px 0 0;
  line-height: 1.65;
  color: #24324a;
}

.ai-result-inner {
  max-width: 680px;
  margin: 0 auto;
  line-height: 1.8;
  font-size: 14px;
  color: #2a3746;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.ai-result-inner :deep(p) {
  margin: 0 0 12px;
}

.ai-result-inner :deep(p:last-child) {
  margin-bottom: 0;
}

.ai-result-inner :deep(ol),
.ai-result-inner :deep(ul) {
  margin: 0 0 12px 20px;
  padding-left: 16px;
}

.ai-result-inner :deep(li) {
  margin-bottom: 6px;
}

.ai-result-inner :deep(strong) {
  color: #182235;
  font-weight: 600;
}

.ai-result-inner :deep(a) {
  color: #3f5bd8;
  text-decoration: none;
}

.ai-result-inner :deep(a:hover) {
  text-decoration: underline;
}

.references-block {
  margin-top: 16px;
  padding: 10px 12px;
  border: 1px solid #e4eaf1;
  border-radius: 12px;
  background: #f9fbfd;
}

.references-title {
  margin: 0 0 10px;
  color: #6f7d92;
  font-size: 12px;
  font-weight: 600;
}

.reference-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 8px;
  align-items: flex-start;
  padding-left: 0;
  margin: 0;
  list-style: none;
}

.reference-item {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.reference-pill,
.reference-pill-button {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  border: 1px solid #cfd9e4;
  background: #fff;
  color: #4f6b8a;
  border-radius: 999px;
  padding: 5px 12px;
  line-height: 1.2;
}

.reference-pill-button {
  cursor: pointer;
  font: inherit;
}

.reference-pill-button:hover {
  border-color: #b9c7d8;
  background: #f7faff;
}

.inline-reference {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d4d9df;
  background: #f6f7f8;
  color: #5f666f;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  border-radius: 4px;
  padding: 0 6px;
  min-height: 20px;
  cursor: pointer;
}

.inline-reference:hover {
  border-color: #c2c8cf;
  background: #eef0f2;
  color: #3f4750;
}

:deep(.el-card__header) {
  padding: 14px 18px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
}

:deep(.el-card__body) {
  padding: 18px;
}

:deep(.el-divider--horizontal) {
  border-color: rgba(148, 163, 184, 0.16);
}

@media (max-width: 900px) {
  .page-header,
  .card-header,
  .detail-block {
    flex-direction: column;
    align-items: flex-start;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
