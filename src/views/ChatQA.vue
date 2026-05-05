<template>
  <main-layout>
    <div class="chat-container-wrapper">
      <!-- 左侧历史记录 -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h3 class="h3">问答历史记录</h3>
          <p class="text-tip">最近与智能助手的对话记录</p>
        </div>

        <div class="sidebar-content" @scroll="handleScroll">
          <template v-for="date in ['today', 'yesterday', 'earlier']" :key="date">
            <div class="date-group">
              <p class="date-label">{{ date === 'today' ? '今天' : date === 'yesterday' ? '昨天' : '更早' }}</p>
              <ul class="history-list">
                <li v-for="item in getHistoryByDate(date)" :key="item.id" class="history-item">
                  <p class="history-question">{{ item.question }}</p>
                  <p class="history-time">{{ item.time }}</p>
                </li>
              </ul>
            </div>
          </template>
        </div>
      </aside>

      <!-- 右侧主内容区 -->
      <div class="chat-main">
        <!-- 顶部标题 -->
        <header class="chat-header">
          <h2 class="h2">智能运维问答助手</h2>
          <p class="text-sm">基于RAG技术的工业设备智能诊断与问答系统</p>
        </header>

        <!-- 聊天内容区 -->
        <div class="chat-body" :class="{ 'is-empty': viweState }">
          <!-- 初始状态 - 欢迎页 -->
          <div v-if="viweState" class="welcome-container">
            <div class="welcome-content">
              <h1 class="h1">有什么我能帮你的吗？</h1>
              <p class="text-tip" style="margin-top: var(--spacing-sm);">我可以帮您解答设备运维、故障诊断等问题</p>

              <div class="suggested-questions">
                <p class="text-sm" style="margin-bottom: var(--spacing-base); color: var(--text-secondary);">猜你想了解：</p>
                <ul class="question-list">
                  <li v-for="(question, index) in suggestedQuestions" :key="index" class="question-item"
                    @click="handleSuggestedQuestion(question)">
                    {{ question }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- 对话状态 - 消息列表 -->
          <div v-else class="message-list">
            <template v-for="msg in messageList" :key="msg.id">
              <!-- 用户消息 -->
              <div v-if="msg.type === 'user'" class="message-wrapper user-message">
                <div class="message-bubble user-bubble">
                  <p>{{ msg.content }}</p>
                </div>
              </div>

              <!-- AI 消息 -->
              <div v-else class="message-wrapper ai-message">
                <div class="message-bubble ai-bubble">
                  <!-- 搜索关键词 -->
                  <div v-if="msg.searchKeywords" class="search-keywords">
                    <el-icon :size="14" style="margin-right: var(--spacing-xs);">
                      <Search />
                    </el-icon>
                    <span class="text-sm">搜索：</span>
                    <span class="keywords">{{ msg.searchKeywords.join(' · ') }}</span>
                  </div>

                  <!-- AI 回答内容 -->
                  <div class="answer-content">
                    <p style="white-space: pre-wrap;">{{ msg.content }}</p>
                  </div>

                  <!-- 参考来源 -->
                  <div v-if="msg.references && msg.references.length > 0" class="references">
                    <p class="text-sm" style="margin-bottom: var(--spacing-xs); color: var(--text-secondary);">参考来源：</p>
                    <ul class="reference-list">
                      <li v-for="(ref, idx) in msg.references" :key="idx" class="reference-item">
                        <a :href="ref.url">{{ ref.name }}</a>
                      </li>
                    </ul>
                  </div>

                  <!-- 操作按钮 -->
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

        <!-- 底部输入框 -->
        <footer class="chat-footer">
          <div class="input-container">
            <el-input v-model="userQValue" placeholder="请输入您的问题，按 Enter 发送" class="chat-input-field"
              @keyup.enter="handleUserQuestion" clearable>
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
  </main-layout>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import MainLayout from '../components/layout/MainLayout.vue'
import { Position, Search, Refresh, CopyDocument } from '@element-plus/icons-vue'
import { TokenManager } from '../utils/tokenManager'

// 初始态对话态切换
const viweState = ref(true)
const loading = ref(false)
const sessionId = ref<string>('')

// 历史记录数据 - 先保留本地占位，后续再接历史会话接口
const historyList = ref([
  { id: 1, question: '3号生产线温度异常如何处理？', time: '14:23', date: 'today' },
  { id: 2, question: '压缩机振动频率超标原因分析', time: '11:45', date: 'today' },
  { id: 3, question: '如何查看设备维护记录？', time: '09:18', date: 'today' },
  { id: 4, question: '电机轴承温度正常范围是多少？', time: '16:30', date: 'yesterday' },
  { id: 5, question: '生产线停机应急预案流程', time: '14:22', date: 'yesterday' },
  { id: 6, question: '设备故障代码E102含义', time: '10:15', date: 'yesterday' },
  { id: 7, question: '如何导出本月设备运行报表？', time: '15:40', date: 'earlier' },
  { id: 8, question: '冷却系统压力下降处理方法', time: '09:30', date: 'earlier' }
])

// 推荐问题列表 - 常见运维问题
const suggestedQuestions = ref([
  '设备温度超过80℃如何处理？',
  '如何查看设备实时运行状态？',
  '生产线异常停机的常见原因有哪些？',
  '设备维护保养周期是多久？'
])

// 对话消息列表
interface Message {
  id: number
  type: 'user' | 'ai'
  content: string
  time: string
  searchKeywords?: string[]
  references?: { name: string, url: string }[]
}

const messageList = ref<Message[]>([])

const userQValue = ref('')

const qaApiBase = import.meta.env.VITE_API_URL || 'http://localhost:3002/api'

const currentTime = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

const pushUserMessage = (content: string) => {
  const userMsg: Message = {
    id: Date.now(),
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
    id: Date.now() + 1,
    type: 'ai',
    content: '正在为您分析，请稍候...',
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
    body: JSON.stringify({
      question,
      sessionId: sessionId.value || undefined
    })
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
          if (parsed.sessionId) {
            sessionId.value = parsed.sessionId
          }
          if (parsed.content !== undefined) {
            answer += parsed.content
            updateAiMessage(aiMsg.id, { content: answer })
          }
          if (parsed.error) {
            throw new Error(parsed.error)
          }
        } catch (_) {
          // 忽略非 JSON 行
        }
      }
    }

    if (buffer.trim().startsWith('data:')) {
      const jsonStr = buffer.trim().slice(5).trim()
      if (jsonStr !== '[DONE]') {
        try {
          const parsed = JSON.parse(jsonStr)
          if (parsed.sessionId) sessionId.value = parsed.sessionId
          if (parsed.content !== undefined) {
            answer += parsed.content
            updateAiMessage(aiMsg.id, { content: answer })
          }
        } catch (_) {
          // ignore
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

// 处理用户提问
const handleUserQuestion = async () => {
  const question = userQValue.value.trim()
  if (!question || loading.value) return

  pushUserMessage(question)
  userQValue.value = ''

  try {
    await streamQuestion(question)
  } catch (error: any) {
    messageList.value.push({
      id: Date.now() + 2,
      type: 'ai',
      content: `问答失败：${error.message || '未知错误'}`,
      time: currentTime()
    })
  }
}

// 点击推荐问题
const handleSuggestedQuestion = (question: string) => {
  userQValue.value = question
  handleUserQuestion()
}

// 复制回答
const handleCopy = (content: string) => {
  navigator.clipboard.writeText(content)
}

// 重新生成回答
const handleRegenerate = (messageId: number) => {
  const targetIndex = messageList.value.findIndex(m => m.id === messageId && m.type === 'ai')
  if (targetIndex === -1) return
  const prevUser = [...messageList.value.slice(0, targetIndex)].reverse().find(m => m.type === 'user')
  if (!prevUser) return
  messageList.value.splice(targetIndex, 1)
  void streamQuestion(prevUser.content)
}

// 下拉刷新历史记录
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

const getHistoryByDate = (date: string) => {
  return groupedHistory.value[date as keyof typeof groupedHistory.value] || []
}
</script>
<style scoped>
/* ========== 整体布局 ========== */
.chat-container-wrapper {
  display: flex;
  height: 100%;
  gap: var(--spacing-base);
  background-color: var(--bg-secondary);
  padding: var(--spacing-base);
}

/* ========== 左侧边栏 ========== */
.sidebar {
  width: 280px;
  background-color: var(--bg-main);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: var(--spacing-lg) var(--spacing-base);
  border-bottom: 1px solid var(--border-light);
  background-color: var(--bg-main);
}

.sidebar-header .h3 {
  margin-bottom: var(--spacing-xs);
  color: var(--text-main);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm);
  scrollbar-width: none;
}

/* 日期分组 */
.date-group {
  margin-bottom: var(--spacing-base);
}

.date-label {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  font-weight: 600;
  padding: var(--spacing-xs) var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 历史记录列表 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.history-item {
  padding: var(--spacing-sm);
  background-color: var(--bg-main);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-item:hover {
  background-color: var(--bg-hover);
  border-color: var(--primary-light);
  box-shadow: var(--shadow-light);
}

.history-question {
  font-size: var(--font-sm);
  color: var(--text-main);
  margin-bottom: var(--spacing-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

.history-time {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
}

/* ========== 右侧主内容区 ========== */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-main);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-light);
  overflow: hidden;
}

/* 顶部标题 */
.chat-header {
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--border-light);
  background-color: var(--bg-main);
}

.chat-header .h2 {
  margin-bottom: var(--spacing-xs);
  color: var(--text-main);
}

/* 聊天内容区 */
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-xl);
  background-color: var(--bg-secondary);
}

.chat-body.is-empty {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* ========== 欢迎页 ========== */
.welcome-container {
  width: 100%;
  max-width: 600px;
  text-align: center;
}

.welcome-content .h1 {
  color: var(--text-main);
  margin-bottom: var(--spacing-sm);
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
  background-color: var(--bg-main);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-base);
  color: var(--text-secondary);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.question-item:hover {
  background-color: var(--primary-light);
  border-color: var(--primary);
  color: var(--primary);
  box-shadow: var(--shadow-light);
}

/* ========== 消息列表 ========== */
.message-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.message-wrapper {
  display: flex;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 用户消息 */
.user-message {
  justify-content: flex-end;
}

.user-bubble {
  max-width: 70%;
  padding: var(--spacing-base) var(--spacing-lg);
  background-color: var(--primary);
  color: var(--text-white);
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg);
  box-shadow: var(--shadow-light);
}

.user-bubble p {
  margin-bottom: var(--spacing-xs);
  line-height: 1.6;
}

/* AI 消息 */
.ai-message {
  justify-content: flex-start;
}

.ai-bubble {
  max-width: 80%;
  padding: var(--spacing-lg);
  background-color: var(--bg-main);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm);
  box-shadow: var(--shadow-base);
}

/* 搜索关键词 */
.search-keywords {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-base);
  background-color: var(--bg-hover);
  border-radius: var(--radius-base);
  margin-bottom: var(--spacing-base);
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.keywords {
  color: var(--primary);
  font-weight: 500;
}

/* 回答内容 */
.answer-content {
  margin-bottom: var(--spacing-base);
  line-height: 1.8;
  color: var(--text-main);
  font-size: var(--font-base);
}

/* 参考来源 */
.references {
  padding: var(--spacing-base);
  background-color: var(--bg-secondary);
  border-radius: var(--radius-base);
  margin-bottom: var(--spacing-base);
}

.reference-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.reference-item {
  font-size: var(--font-sm);
}

.reference-item a {
  color: var(--primary);
  text-decoration: none;
  transition: color 0.2s ease;
}

.reference-item a:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}

/* 消息操作按钮 */
.message-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-light);
}

.action-icon {
  color: var(--text-tertiary);
  cursor: pointer;
  transition: color 0.2s ease;
}

.action-icon:hover {
  color: var(--primary);
}


/* ========== 底部输入框 ========== */
.chat-footer {
  padding: var(--spacing-lg) var(--spacing-xl);
  border-top: 1px solid var(--border-light);
  background-color: var(--bg-main);
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
  color: var(--primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.send-icon:hover {
  color: var(--primary-hover);
  transform: scale(1.1);
}
</style>
