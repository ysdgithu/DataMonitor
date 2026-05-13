<template>
  <main-layout>
    <div class="chat-container-wrapper">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h3 class="h3">问答历史记录</h3>
          <p class="text-tip">最近与智能助手的对话记录</p>
        </div>

        <div class="sidebar-content" @scroll="handleScroll">
          <div v-if="historyLoading" class="history-state">正在加载历史会话...</div>
          <div v-else-if="!historyList.length" class="history-state empty">暂无历史会话</div>
          <template v-else v-for="date in ['today', 'yesterday', 'earlier']" :key="date">
            <div class="date-group">
              <div class="date-group-header">
                <p class="date-label">{{ date === 'today' ? '今天' : date === 'yesterday' ? '昨天' : '更早' }}</p>
                <button
                  v-if="getHistoryByDate(date).length"
                  type="button"
                  class="group-delete-btn"
                  @click.stop="handleDeleteSessions(getHistoryByDate(date))"
                  aria-label="删除本组会话"
                  title="删除本组会话"
                >
                  <el-icon><CloseBold /></el-icon>
                </button>
              </div>
              <ul class="history-list">
                <li
                  v-for="item in getHistoryByDate(date)"
                  :key="item.id"
                  class="history-item"
                >
                  <div class="history-item-main" @click="loadSessionDetail(item)">
                    <p class="history-question">{{ item.question }}</p>
                    <p class="history-time">{{ item.time }}</p>
                  </div>
                  <button
                    type="button"
                    class="history-delete-btn"
                    @click.stop="handleDeleteSession(item)"
                    aria-label="删除会话"
                    title="删除会话"
                  >
                    <el-icon><CloseBold /></el-icon>
                  </button>
                </li>
              </ul>
            </div>
          </template>
        </div>
      </aside>

      <div class="chat-main">
        <header class="chat-header">
          <h2 class="h2">智能运维问答助手</h2>
          <p class="text-sm">基于 RAG 技术的工业设备智能诊断与问答系统</p>
        </header>

        <div class="chat-body" :class="{ 'is-empty': viweState }">
          <div v-if="viweState" class="welcome-container">
            <div class="welcome-content">
              <h1 class="h1">有什么我能帮你的吗？</h1>
              <p class="text-tip" style="margin-top: var(--spacing-sm);">
                我可以帮您解答设备运维、故障诊断等问题
              </p>

              <div class="suggested-questions">
                <p class="text-sm" style="margin-bottom: var(--spacing-base); color: var(--text-secondary);">猜你想了解：</p>
                <ul class="question-list">
                  <li
                    v-for="(question, index) in suggestedQuestions"
                    :key="index"
                    class="question-item"
                    @click="handleSuggestedQuestion(question)"
                  >
                    {{ question }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div v-else class="message-list">
            <template v-for="msg in messageList" :key="msg.id">
              <div v-if="msg.type === 'user'" class="message-wrapper user-message">
                <div class="message-bubble user-bubble">
                  <p>{{ msg.content }}</p>
                </div>
              </div>

              <div v-else class="message-wrapper ai-message">
                <div class="message-bubble ai-bubble">
                  <div v-if="msg.searchKeywords" class="search-keywords">
                    <el-icon :size="14" style="margin-right: var(--spacing-xs);">
                      <Search />
                    </el-icon>
                    <span class="text-sm">搜索：</span>
                    <span class="keywords">{{ msg.searchKeywords.join(' · ') }}</span>
                  </div>

                  <div v-if="msg.reasoningContent" class="reasoning-content">
                    <p class="text-sm reasoning-label">思考摘要</p>
                    <p class="reasoning-text">{{ msg.reasoningContent }}</p>
                  </div>

                  <div class="answer-content">
                    <p class="answer-text">
                      <template v-for="(part, index) in renderAnswerParts(msg.displayContent || msg.content)" :key="index">
                        <button
                          v-if="part.type === 'reference'"
                          type="button"
                          class="inline-reference"
                          @click="openReferenceById(msg, part.refId)"
                        >
                          Fig. {{ part.refId }} 
                        </button>
                        <span v-else v-html="renderMarkdownInline(part.text || '')"></span>
                      </template>
                    </p>
                  </div>

                  <div v-if="msg.references && msg.references.length > 0" class="references">
                    <p class="text-sm" style="margin-bottom: var(--spacing-xs); color: var(--text-secondary);">参考来源：</p>
                    <ul class="reference-list">
                      <li v-for="(ref, idx) in msg.references" :key="idx" class="reference-item">
                        <span class="reference-pill">
                          {{ ref.name || ref.figureLabel || `来源 ${idx + 1}` }}
                        </span>
                        <p v-if="ref.figureLabel || ref.page !== undefined" class="reference-meta">
                          <span v-if="ref.figureLabel">{{ ref.figureLabel }}</span>
                          <span v-if="ref.page !== undefined">第 {{ ref.page }} 页</span>
                        </p>
                      </li>
                    </ul>
                  </div>

                  <div class="message-actions">
                    <el-icon class="action-icon" @click="handleRegenerate(msg.id)">
                      <Refresh />
                    </el-icon>
                    <el-icon class="action-icon" @click="handleCopy(msg.content)">
                      <CopyDocument />
                    </el-icon>
                    <span class="message-time">{{ msg.time }}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <footer class="chat-footer">
          <div class="input-container">
            <el-input
              v-model="userQValue"
              placeholder="请输入您的问题，按 Enter 发送"
              class="chat-input-field"
              @keyup.enter="handleUserQuestion"
              clearable
            >
              <template #suffix>
                <el-icon class="send-icon" @click="handleUserQuestion">
                  <Position />
                </el-icon>
              </template>
            </el-input>
          </div>
        </footer>
      </div>
    </div>

    <el-dialog v-model="referenceDialogVisible" width="640px" class="reference-dialog" title="参考片段">
      <div v-if="activeReference" class="reference-dialog-content">
        <div class="reference-dialog-header">
          <div>
            <p class="reference-dialog-title">{{ activeReference.name }}</p>
            <p class="reference-dialog-subtitle">
              <span v-if="activeReference.figureLabel">{{ activeReference.figureLabel }}</span>
              <span v-if="activeReference.page !== undefined"> · 第 {{ activeReference.page }} 页</span>
            </p>
          </div>
          <el-button v-if="activeReference.url" type="primary" link @click="openSourceLink(activeReference)">
            打开来源
          </el-button>
        </div>

        <div v-if="activeReference.title || activeReference.source" class="reference-dialog-meta">
          <p v-if="activeReference.title"><strong>标题：</strong>{{ activeReference.title }}</p>
          <p v-if="activeReference.source"><strong>来源：</strong>{{ activeReference.source }}</p>
        </div>

        <div class="reference-dialog-snippet">
          <p class="text-sm" style="margin-bottom: 8px; color: var(--text-secondary);">片段内容</p>
          <p style="white-space: pre-wrap; line-height: 1.8;">{{ activeReference.snippet || '暂无片段内容' }}</p>
        </div>
      </div>
    </el-dialog>
  </main-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../components/layout/MainLayout.vue'
import { Position, Search, Refresh, CopyDocument, CloseBold } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { TokenManager } from '../utils/tokenManager'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const viweState = ref(true)
const loading = ref(false)
const historyLoading = ref(false)

interface HistorySession {
  id: string | number
  question: string
  time: string
  date: 'today' | 'yesterday' | 'earlier'
  raw?: any
}

const historyList = ref<HistorySession[]>([])
const suggestedQuestions = ref(['灌装机常见的故障原因是什么？'])

interface Message {
  id: number
  type: 'user' | 'ai'
  content: string
  displayContent?: string
  time: string
  searchKeywords?: string[]
  reasoningContent?: string
  references?: Array<{
    name?: string
    url?: string
    figureLabel?: string
    snippet?: string
    page?: number
    refId?: string | number
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

const messageList = ref<Message[]>([])
const userQValue = ref('')
const qaApiBase = import.meta.env.VITE_API_URL || 'http://localhost:3002/api'
let messageIdSeed = 0

const nextMessageId = () => Date.now() * 1000 + (messageIdSeed++ % 1000)
const currentTime = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

const formatSessionTime = (value: any) => {
  if (!value) return currentTime()
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(11, 16)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const getDateGroup = (value: any): 'today' | 'yesterday' | 'earlier' => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'earlier'
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000
  const ts = date.getTime()
  if (ts >= startOfToday) return 'today'
  if (ts >= startOfYesterday) return 'yesterday'
  return 'earlier'
}

const normalizeHistory = (items: any[]): HistorySession[] => {
  return items.map((item, index) => {
    const question = item.question || item.title || item.summary || item.name || item.last_question || '历史会话'
    const rawTime = item.updated_at || item.created_at || item.create_time || item.last_update || item.timestamp || item.time
    return {
      id: item.id ?? item.session_id ?? `${index}`,
      question,
      time: formatSessionTime(rawTime),
      date: getDateGroup(rawTime),
      raw: item
    }
  })
}

const extractChunkContent = (parsed: any) => {
  const choice = parsed?.choices?.[0] ?? {}
  const delta = choice?.delta ?? {}
  const message = choice?.message ?? {}
  return delta?.content ?? message?.content ?? parsed?.content ?? parsed?.final_content ?? delta?.final_content ?? message?.final_content ?? ''
}

const extractReferences = (parsed: any) => {
  const choice = parsed?.choices?.[0] ?? {}
  const delta = choice?.delta ?? {}
  const message = choice?.message ?? {}
  return delta?.reference ?? delta?.references ?? message?.reference ?? message?.references ?? parsed?.references ?? parsed?.data?.references ?? parsed?.data?.reference
}

const pushUserMessage = (content: string) => {
  const userMsg: Message = {
    id: nextMessageId(),
    type: 'user',
    content,
    time: currentTime()
  }
  messageList.value.push(userMsg)
  viweState.value = false
  return userMsg
}

const pushAiMessage = () => {
  const aiMsg: Message = {
    id: nextMessageId(),
    type: 'ai',
    content: '正在为您分析，请稍候...',
    displayContent: '正在为您分析，请稍候...',
    time: currentTime(),
    searchKeywords: ['RAGFlow', '智能问答']
  }
  messageList.value.push(aiMsg)
  return aiMsg
}

const updateAiMessage = (id: number, patch: Partial<Message>) => {
  const idx = messageList.value.findIndex(item => item.id === id)
  if (idx !== -1) {
    messageList.value[idx] = {
      ...messageList.value[idx],
      ...patch
    }
  }
}

const loadHistorySessions = async () => {
  historyLoading.value = true
  try {
    const res: any = await request.get('/ai-analysis/history', {
      params: { chatId: '46fb6734358611f180d46988dbe8f3ea' }
    })
    if (res?.success) {
      historyList.value = normalizeHistory(res.data || [])
    } else {
      ElMessage.error(res?.message || '获取历史会话失败')
    }
  } catch (error: any) {
    console.error('获取历史会话失败:', error)
    ElMessage.error(error.message || '获取历史会话失败')
  } finally {
    historyLoading.value = false
  }
}

const loadSessionDetail = async (item: HistorySession) => {
  const sessionId = getSessionId(item)
  if (!sessionId) {
    ElMessage.warning('无法识别会话ID')
    return
  }

  try {
    const res: any = await request.get(`/ai-analysis/history/${encodeURIComponent(sessionId)}`, {
      params: { chatId: '46fb6734358611f180d46988dbe8f3ea' }
    })

    if (!res?.success) {
      throw new Error(res?.message || '获取会话详情失败')
    }

    console.log('历史会话详情', res.data)
    ElMessage.success(`已加载会话：${item.question}`)
  } catch (error: any) {
    console.error('获取会话详情失败:', error)
    ElMessage.error(error.message || '获取会话详情失败')
  }
}

const getSessionId = (item: HistorySession) => String(item.raw?.session_id || item.raw?.id || item.id || '').trim()

const handleDeleteSession = async (item: HistorySession) => {
  const sessionId = getSessionId(item)
  if (!sessionId) {
    ElMessage.warning('无法识别会话ID')
    return
  }

  try {
    await ElMessageBox.confirm(`确认删除会话「${item.question}」吗？此操作不可恢复。`, '删除会话', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })

    const token = TokenManager.getAccessToken()
    const response = await fetch(`${qaApiBase}/ai-analysis/history?chatId=46fb6734358611f180d46988dbe8f3ea`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ ids: [sessionId] })
    })

    const res = await response.json().catch(() => ({}))
    if (!response.ok || !res?.success) {
      throw new Error(res?.message || '删除失败')
    }

    ElMessage.success('删除成功')
    await loadHistorySessions()
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handleDeleteSessions = async (items: HistorySession[]) => {
  const ids = items.map(getSessionId).filter(Boolean)
  if (!ids.length) {
    ElMessage.warning('没有可删除的会话')
    return
  }

  try {
    await ElMessageBox.confirm(`确认删除该组 ${ids.length} 条会话吗？此操作不可恢复。`, '批量删除会话', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })

    const token = TokenManager.getAccessToken()
    const response = await fetch(`${qaApiBase}/ai-analysis/history?chatId=46fb6734358611f180d46988dbe8f3ea`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ ids })
    })

    const res = await response.json().catch(() => ({}))
    if (!response.ok || !res?.success) {
      throw new Error(res?.message || '删除失败')
    }

    ElMessage.success('删除成功')
    await loadHistorySessions()
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

interface ReferenceItem {
  name?: string
  url?: string
  figureLabel?: string
  snippet?: string
  page?: number
  source?: string
  title?: string
  refId?: string | number
}

const referenceDialogVisible = ref(false)
const activeReference = ref<ReferenceItem | null>(null)

const normalizeReference = (ref: any, index = 0): ReferenceItem => {
  const name = ref?.name || ref?.title || ref?.doc_name || ref?.document_name || ref?.source_name || `来源 ${index + 1}`
  return {
    name,
    url: ref?.url || ref?.source_url || ref?.link,
    figureLabel: ref?.figureLabel || ref?.figure || ref?.label || ref?.chunk_label,
    snippet: ref?.snippet || ref?.content || ref?.text || ref?.chunk || ref?.excerpt,
    page: ref?.page ?? ref?.page_no ?? ref?.pageNumber,
    source: ref?.source || ref?.file_path || ref?.path,
    title: ref?.title || ref?.doc_title || ref?.document_title,
    refId: ref?.refId ?? ref?.id ?? ref?.chunk_id ?? ref?.chunkId ?? ref?.reference_id
  }
}

const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const normalizeWrappedText = (text: string) => {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/([^\n])\n([^\n])/g, '$1 $2')
    .replace(/\n{3,}/g, '\n\n')
}

const renderMarkdownInline = (text: string) => {
  const escaped = escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
  return escaped
}

const renderAnswerParts = (text: string) => {
  const parts: Array<{ type: 'text' | 'reference'; text?: string; refId?: string }> = []
  const regex = /\[ID:\s*(\d+)\]/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'reference', refId: match[1] })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', text: text.slice(lastIndex) })
  }

  return parts.length ? parts : [{ type: 'text', text }]
}

const openSourceLink = (ref: ReferenceItem) => {
  if (ref?.url) {
    window.open(ref.url, '_blank', 'noopener,noreferrer')
  }
}

const openReference = (ref: any) => {
  activeReference.value = normalizeReference(ref)
  referenceDialogVisible.value = true
}

const openReferenceById = (msg: Message, refId: string) => {
  const target = msg.references?.find(ref => String(ref.refId ?? '').trim() === String(refId).trim())
  if (target) {
    openReference(target)
    return
  }

  const byIndex = msg.references?.[Number(refId)] || msg.references?.[Number(refId) - 1]
  if (byIndex) {
    openReference(byIndex)
    return
  }

  ElMessage.warning(`未找到对应引用 [ID:${refId}]`)
}


const streamQuestion = async (question: string) => {
  const token = TokenManager.getAccessToken()
  const aiMsg = pushAiMessage()
  loading.value = true

  const response = await fetch(`${qaApiBase}/qa/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ question })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `请求失败: ${response.status}`)
  }

  if (!response.body) throw new Error('响应体为空')

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let answer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue

        const jsonStr = trimmed.slice(5).trim()
        if (jsonStr === '[DONE]') {
          loading.value = false
          return
        }

        try {
          const parsed = JSON.parse(jsonStr)
          const deltaContent = extractChunkContent(parsed)
          const finalContent = parsed.final_content || parsed?.choices?.[0]?.delta?.final_content || parsed?.choices?.[0]?.message?.final_content
          const reasoning = parsed.reasoningContent || parsed?.choices?.[0]?.delta?.reasoning_content
          if (reasoning) {
            const current = messageList.value.find(item => item.id === aiMsg.id)
            const normalizedReasoning = normalizeWrappedText(reasoning)
            updateAiMessage(aiMsg.id, {
              reasoningContent: current?.reasoningContent
                ? `${current.reasoningContent} ${normalizedReasoning}`
                : normalizedReasoning
            })
          }
          if (deltaContent !== undefined && deltaContent !== null) {
            answer += String(deltaContent)
            updateAiMessage(aiMsg.id, { content: answer, displayContent: answer })
          }
          if (finalContent) {
            answer = String(finalContent)
            updateAiMessage(aiMsg.id, { content: answer, displayContent: answer })
          }
          const refs = extractReferences(parsed)
          if (refs) {
            const rawReferences = Array.isArray(refs)
              ? refs
              : (refs?.items || refs?.list || refs?.data || [refs])
            const normalized = rawReferences.map((ref: any, index: number) => normalizeReference(ref, index))
            updateAiMessage(aiMsg.id, { references: normalized })
          }
          if (parsed.usage) {
            updateAiMessage(aiMsg.id, { usage: parsed.usage })
          }
          if (parsed.error) {
            throw new Error(parsed.error)
          }
        } catch {
          // ignore malformed chunks
        }
      }
    }

    if (buffer.trim().startsWith('data:')) {
      const jsonStr = buffer.trim().slice(5).trim()
      if (jsonStr !== '[DONE]') {
        try {
          const parsed = JSON.parse(jsonStr)
          const deltaContent = extractChunkContent(parsed)
          const finalContent = parsed.final_content || parsed?.choices?.[0]?.delta?.final_content || parsed?.choices?.[0]?.message?.final_content
          if (deltaContent !== undefined && deltaContent !== null) {
            answer += String(deltaContent)
            updateAiMessage(aiMsg.id, { content: answer, displayContent: answer })
          }
          if (finalContent) {
            answer = String(finalContent)
            updateAiMessage(aiMsg.id, { content: answer, displayContent: answer })
          }
          const refs = extractReferences(parsed)
          if (refs) {
            const rawReferences = Array.isArray(refs)
              ? refs
              : (refs?.items || refs?.list || refs?.data || [refs])
            const normalized = rawReferences.map((ref: any, index: number) => normalizeReference(ref, index))
            updateAiMessage(aiMsg.id, { references: normalized })
          }
        } catch {
          // ignore malformed chunks
        }
      }
    }
  } finally {
    reader.releaseLock()
    loading.value = false
    if (!answer) {
      updateAiMessage(aiMsg.id, { content: '暂未获取到回答，请稍后重试。' })
    }
  }
}

const handleUserQuestion = async () => {
  const question = userQValue.value.trim()
  if (!question || loading.value) return

  pushUserMessage(question)
  userQValue.value = ''

  try {
    await streamQuestion(question)
  } catch (error: any) {
    messageList.value.push({
      id: nextMessageId(),
      type: 'ai',
      content: `问答失败：${error.message || '未知错误'}`,
      time: currentTime()
    })
  }
}

const handleSuggestedQuestion = (question: string) => {
  userQValue.value = question
  handleUserQuestion()
}


const handleCopy = (content: string) => {
  navigator.clipboard.writeText(content)
}

const handleRegenerate = (messageId: number) => {
  const targetIndex = messageList.value.findIndex(m => m.id === messageId && m.type === 'ai')
  if (targetIndex === -1) return
  const prevUser = [...messageList.value.slice(0, targetIndex)].reverse().find(m => m.type === 'user')
  if (!prevUser) return
  messageList.value.splice(targetIndex, 1)
  void streamQuestion(prevUser.content)
}

const handleScroll = (e: any) => {
  if (e.target.scrollTop === 0) {
    console.log('触发刷新历史记录')
  }
}

const groupedHistory = computed(() => ({
  today: historyList.value.filter(h => h.date === 'today'),
  yesterday: historyList.value.filter(h => h.date === 'yesterday'),
  earlier: historyList.value.filter(h => h.date === 'earlier')
}))

const getHistoryByDate = (date: string) => groupedHistory.value[date as keyof typeof groupedHistory.value] || []

onMounted(() => {
  loadHistorySessions()
})
</script>

<style scoped>
.chat-container-wrapper {
  display: flex;
  align-items: stretch;
  height: 100%;
  gap: var(--spacing-base);
  padding: var(--spacing-base);
}

.sidebar {
  flex: 0 0 280px;
  width: 280px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e7edf3;
  border-radius: var(--radius-lg);
  box-shadow: 0 6px 18px rgba(25, 36, 52, 0.05);
}

.sidebar-header {
  padding: var(--spacing-lg) var(--spacing-base);
  border-bottom: 1px solid #e7edf3;
  background-color: #fbfcfd;
}

.sidebar-header .h3 {
  margin-bottom: var(--spacing-xs);
  color: #223042;
}

.sidebar-header .text-tip,
.chat-header .text-sm,
.date-label,
.history-time,
.message-time,
.action-icon,
.send-icon {
  color: #7d8a97;
}

.sidebar-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--spacing-sm);
  background-color: transparent;
  scrollbar-width: none;
}

.history-state {
  padding: var(--spacing-lg);
  color: #6f7c8b;
  font-size: var(--font-sm);
}

.history-state.empty {
  text-align: center;
  color: #7e8b98;
}

.date-group {
  margin-bottom: var(--spacing-base);
}

.date-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: var(--spacing-xs);
}

.group-delete-btn {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  flex: 0 0 auto;
  transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.group-delete-btn:hover {
  background: rgba(248, 113, 113, 0.08);
  color: #ef4444;
  transform: translateY(-1px);
}

.date-label {
  font-size: var(--font-xs);
  font-weight: 600;
  padding: var(--spacing-xs) var(--spacing-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: var(--spacing-sm);
  background-color: #ffffff;
  border: 1px solid #e4eaf1;
  border-radius: 12px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(25, 36, 52, 0.04);
}

.history-item:hover {
  transform: translateY(-1px);
  background-color: #f5f8fb;
  border-color: #d9e3ee;
  box-shadow: 0 2px 8px rgba(25, 36, 52, 0.05);
}

.history-item-main {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.history-delete-btn {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  flex: 0 0 auto;
  transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.history-delete-btn:hover {
  background: rgba(248, 113, 113, 0.08);
  color: #ef4444;
  transform: translateY(-1px);
}

.history-question {
  font-size: var(--font-sm);
  color: #243244;
  margin-bottom: var(--spacing-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

.chat-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--radius-lg);
  border: 1px solid #e7edf3;
  box-shadow: 0 6px 18px rgba(25, 36, 52, 0.05);
}

.chat-header {
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid #e7edf3;
  background-color: #fbfcfd;
}

.chat-header .h2 {
  margin-bottom: var(--spacing-xs);
  color: #223042;
}

.chat-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--spacing-xl);
  background-color: transparent;
}

.chat-body.is-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(244, 246, 248, 0.2), rgba(244, 246, 248, 0));
}

.welcome-container {
  width: 100%;
  max-width: 600px;
  text-align: center;
}

.welcome-content .h1 {
  margin-bottom: var(--spacing-sm);
  color: #223042;
}

.suggested-questions {
  margin-top: var(--spacing-xl);
  text-align: left;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.question-item {
  padding: var(--spacing-base);
  border: 1px solid #e4eaf1;
  border-radius: 12px;
  background-color: #ffffff;
  color: #4b5a6b;
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(25, 36, 52, 0.04);
}

.question-item:hover {
  transform: translateY(-1px);
  background-color: #f5f8fb;
  border-color: #d9e3ee;
  box-shadow: 0 2px 8px rgba(25, 36, 52, 0.05);
  color: #2f4259;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
}

.message-wrapper {
  display: flex;
  width: 100%;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.user-message {
  justify-content: flex-end;
}

.ai-message {
  justify-content: flex-start;
}

.user-bubble {
  width: min(680px, calc(100vw - 360px));
  max-width: 680px;
  min-width: 520px;
  padding: var(--spacing-base) var(--spacing-lg);
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg);
  background-color: white;
  box-shadow: 0 4px 12px rgba(47, 70, 104, 0.18);
}

.user-bubble p {
  margin-bottom: var(--spacing-xs);
  line-height: 1.6;
}

.ai-bubble {
  width: min(680px, calc(100vw - 360px));
  max-width: 680px;
  min-width: 520px;
  padding: var(--spacing-lg);
  border: 1px solid #e4eaf1;
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm);
  background-color: #ffffff;
  box-shadow: 0 1px 6px rgba(25, 36, 52, 0.03);
}

.search-keywords {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-base);
  padding: var(--spacing-sm) var(--spacing-base);
  border: 1px solid #dfe6ee;
  border-radius: var(--radius-base);
  background-color: #eef3f8;
  color: #516173;
  font-size: var(--font-sm);
}

.keywords {
  color: #4f6b8a;
  font-weight: 500;
}

.reasoning-content {
  margin-bottom: var(--spacing-base);
  width: 100%;
  box-sizing: border-box;
  padding: var(--spacing-base);
  border-radius: var(--radius-base);
  background: linear-gradient(180deg, #f7faff 0%, #f3f7fb 100%);
  border: 1px solid #dce7f2;
}

.reasoning-label {
  margin-bottom: var(--spacing-xs);
  font-weight: 600;
  color: #4f6b8a;
}

.reasoning-text {
  color: #516173;
  font-size: var(--font-sm);
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.answer-content {
  margin-bottom: var(--spacing-base);
  color: #2a3746;
  font-size: var(--font-base);
  line-height: 1.8;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.answer-text {
  white-space: pre-wrap;
  max-width: 100%;
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
  margin: 0 2px;
  min-height: 20px;
  cursor: pointer;
  vertical-align: baseline;
  box-shadow: none;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.inline-reference:hover {
  border-color: #c2c8cf;
  background: #eef0f2;
  color: #3f4750;
}

.references {
  margin-bottom: var(--spacing-base);
  padding: 10px 12px;
  border-radius: var(--radius-base);
  background-color: #f6f8fb;
  color: #516173;
}

.reference-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reference-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.reference-dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: #223042;
}

.reference-dialog-subtitle {
  margin-top: 4px;
  color: #7d8a97;
  font-size: var(--font-sm);
}

.reference-dialog-meta,
.reference-dialog-snippet {
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fbfcfe;
}

.reference-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 8px;
  align-items: flex-start;
}

.reference-item {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  margin: 0;
  font-size: var(--font-sm);
}

.reference-pill {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  border: 1px solid #cfd9e4;
  background: #fff;
  color: #4f6b8a;
  border-radius: 999px;
  padding: 5px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1.2;
}

.reference-pill:hover {
  background: #f4f8fc;
  border-color: #b7c8d8;
  color: #385f86;
}

.reference-meta {
  margin-top: 0;
  color: #7d8a97;
  font-size: var(--font-xs);
}

.message-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  padding-top: var(--spacing-sm);
  border-top: 1px solid #e7edf3;
}

.action-icon {
  cursor: pointer;
  transition: color 0.2s ease;
}

.action-icon:hover,
.send-icon:hover {
  color: #365473;
}

.message-time {
  color: #7d8a97;
}

.chat-footer {
  padding: var(--spacing-lg) var(--spacing-xl);
  border-top: 1px solid #e7edf3;
  background-color: #fbfcfd;
}

.input-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.chat-input-field {
  flex: 1;
}

.send-icon {
  cursor: pointer;
  transition: all 0.2s ease;
}

.send-icon:hover {
  transform: scale(1.08);
}

.chat-input-field :deep(.el-input__wrapper) {
  background-color: #ffffff;
  box-shadow: inset 0 0 0 1px #e3e9f0;
}

.chat-input-field :deep(.el-input__wrapper:hover),
.chat-input-field :deep(.el-input__wrapper.is-focus) {
  box-shadow: inset 0 0 0 1px #cdd9e4;
}

.chat-input-field :deep(.el-input__inner) {
  color: #223042;
}

.chat-input-field :deep(.el-input__inner::placeholder) {
  color: #99a6b3;
}
</style>
