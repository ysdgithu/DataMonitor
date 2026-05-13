<template>
  <main-layout>
    <div class="knowledge-page">
      <el-tabs v-model="activeTab" class="func-tabs" type="border-card">
        <el-tab-pane label="知识库管理" name="knowledge">
          <div class="knowledge-module">
            <div class="section-heading">
              <div>
                <div class="section-kicker">文档维护</div>
              </div>
              <el-button type="primary" @click="openUploadDialog">上传文档</el-button>
            </div>

            <div class="filter-section">
              <el-row :gutter="12" align="middle">
                <el-col :xs="24" :sm="12" :md="8" :lg="6">
                  <el-input
                    v-model="keywords"
                    placeholder="输入文档名称关键字"
                    clearable
                    @keyup.enter="handleSearch"
                  />
                </el-col>
                <el-col :xs="24" :sm="12" :md="8" :lg="6">
                  <el-select v-model="statusFilter" placeholder="解析状态" clearable class="full-width">
                    <el-option label="等待中" :value="0" />
                    <el-option label="解析中" :value="1" />
                    <el-option label="成功" :value="2" />
                    <el-option label="失败" :value="3" />
                  </el-select>
                </el-col>
                <el-col :xs="24" :sm="24" :md="8" :lg="12" class="filter-actions">
                  <el-button type="primary" :loading="loading" @click="handleSearch">查询</el-button>
                  <el-button @click="handleReset">重置</el-button>
                </el-col>
              </el-row>
            </div>

            <DataTable
              :columns="columns"
              :data="tableData"
              :loading="loading"
              :show-pagination="true"
              :current-page="currentPage"
              :page-size="pageSize"
              :total="total"
              @page-change="handlePageChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>

      <el-dialog v-model="uploadDialogVisible" title="上传文档" width="540px">
        <el-upload
          drag
          multiple
          :auto-upload="false"
          :file-list="uploadFileList"
          :on-change="onFileChange"
          :on-remove="onFileRemove"
          :limit="20"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">支持批量上传，单次最多20个文件</div>
          </template>
        </el-upload>
        <template #footer>
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="uploading" @click="submitUpload">开始上传</el-button>
        </template>
      </el-dialog>
    </div>
  </main-layout>
</template>

<script setup lang="ts">
import { h, onMounted, ref } from 'vue'
import MainLayout from '../components/layout/MainLayout.vue'
import DataTable from '../components/common/DataTable/index.vue'
import type { Column as DataColumn } from '../components/common/DataTable/types'
import { knowledgeApi, type KnowledgeDocumentItem } from '../utils/knowledgeApi'
import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus'
import type { UploadFile, UploadFiles, UploadUserFile } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

const activeTab = ref('knowledge')
const loading = ref(false)
const uploading = ref(false)
const uploadDialogVisible = ref(false)

const keywords = ref('')
const statusFilter = ref<number | ''>('')

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const tableData = ref<KnowledgeDocumentItem[]>([])

const uploadFileList = ref<UploadUserFile[]>([])
const selectedFiles = ref<File[]>([])

const parseStatusTextMap: Record<number, string> = {
  0: '等待中',
  1: '解析中',
  2: '成功',
  3: '失败'
}

const parseStatusTypeMap: Record<number, '' | 'info' | 'warning' | 'success' | 'danger'> = {
  0: 'info',
  1: 'warning',
  2: 'success',
  3: 'danger'
}

const formatDateTime = (value: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${year}/${month}/${day} ${hour}:${minute}:${second}`
}

const columns: DataColumn[] = [
  { prop: 'id', label: 'ID', width: 90 },
  { prop: 'doc_name', label: '文档名称', width: 260 },
  { prop: 'upload_user_id', label: '上传人ID', width: 120 },
  {
    prop: 'upload_time',
    label: '上传时间',
    width: 200,
    customRender: ({ row }) => formatDateTime(row.upload_time)
  },
  {
    prop: 'parse_status',
    label: '解析状态',
    width: 120,
    customRender: ({ row }) => h(
      ElTag,
      { type: parseStatusTypeMap[row.parse_status] || 'info' },
      () => parseStatusTextMap[row.parse_status] || '未知'
    )
  },
  {
    prop: 'actions',
    label: '操作',
    customRender: ({ row }) => h('div', { class: 'table-actions' }, [
      h(
        ElButton,
        {
          link: true,
          type: 'primary',
          disabled: row.parse_status === 1,
          onClick: () => handleProcess(row)
        },
        () => (row.parse_status === 1 ? '处理中' : '点击处理')
      ),
      h(
        ElButton,
        {
          link: true,
          type: 'danger',
          onClick: () => handleDelete(row)
        },
        () => '删除'
      )
    ])
  }
]

const fetchList = async () => {
  loading.value = true
  try {
    const res = await knowledgeApi.getList({
      page: currentPage.value,
      page_size: pageSize.value,
      keywords: keywords.value || undefined,
      parse_status: statusFilter.value === '' ? undefined : statusFilter.value
    })

    if (!res.success) {
      throw new Error(res.message || '获取文档列表失败')
    }

    tableData.value = res.data || []
    total.value = res.total || 0
  } catch (error: any) {
    ElMessage.error(error.message || '获取文档列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  currentPage.value = 1
  await fetchList()
}

const handleReset = async () => {
  keywords.value = ''
  statusFilter.value = ''
  currentPage.value = 1
  await fetchList()
}

const handlePageChange = async (page: number) => {
  currentPage.value = page
  await fetchList()
}

const openUploadDialog = () => {
  uploadFileList.value = []
  selectedFiles.value = []
  uploadDialogVisible.value = true
}

const onFileChange = (_file: UploadFile, files: UploadFiles) => {
  uploadFileList.value = files.map(item => ({
    name: item.name,
    url: item.url,
    status: item.status
  }))

  selectedFiles.value = files
    .map(item => item.raw)
    .filter((f): f is File => !!f)
}

const onFileRemove = (_file: UploadFile, files: UploadFiles) => {
  uploadFileList.value = files.map(item => ({
    name: item.name,
    url: item.url,
    status: item.status
  }))

  selectedFiles.value = files
    .map(item => item.raw)
    .filter((f): f is File => !!f)
}

const submitUpload = async () => {
  if (selectedFiles.value.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }

  uploading.value = true
  try {
    const res = await knowledgeApi.upload(selectedFiles.value)
    if (!res.success) {
      throw new Error(res.message || '上传失败')
    }

    ElMessage.success('上传成功')
    uploadDialogVisible.value = false
    await fetchList()
  } catch (error: any) {
    ElMessage.error(error.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

const handleProcess = async (row: KnowledgeDocumentItem) => {
  try {
    const res = await knowledgeApi.process(row.id)
    if (!res.success) {
      throw new Error(res.message || '触发解析失败')
    }

    ElMessage.success('已触发解析')
    await fetchList()
  } catch (error: any) {
    ElMessage.error(error.message || '触发解析失败')
  }
}

const handleDelete = async (row: KnowledgeDocumentItem) => {
  try {
    await ElMessageBox.confirm(`确认删除文档「${row.doc_name}」吗？此操作不可恢复。`, '删除文档', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })

    const res = await knowledgeApi.delete(row.id)
    if (!res.success) {
      throw new Error(res.message || '删除失败')
    }

    ElMessage.success('删除成功')
    await fetchList()
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

onMounted(fetchList)
</script>

<style scoped>
.knowledge-page {
  padding: 0;
  margin: 0;
  min-height: calc(100vh - 100px);
}

.func-tabs :deep(.el-tabs__header) {
  background: transparent;
  border-bottom: 0;
  margin-top: 10px;
}

.func-tabs :deep(.el-tabs__nav-wrap::after) { display: none; }
.func-tabs :deep(.el-tabs__nav),
.func-tabs :deep(.el-tabs__nav-wrap),
.func-tabs :deep(.el-tabs__content),
.func-tabs :deep(.el-tab-pane),
.knowledge-page :deep(.el-tabs--border-card),
.knowledge-page :deep(.el-tabs--border-card > .el-tabs__content),
.knowledge-page :deep(.el-tabs--border-card > .el-tabs__header),
.knowledge-page :deep(.el-tabs--border-card > .el-tabs__body) {
  background: transparent;
  border: 0;
  box-shadow: none;
}

.knowledge-module {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-kicker {
  color: #6b7a90;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.filter-section {
  padding: 6px 0;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-start;
}

.full-width {
  width: 100%;
}
</style>
