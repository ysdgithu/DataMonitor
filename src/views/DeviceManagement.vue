<template>
  <main-layout>
    <div class="device-page">
      <el-tabs v-model="activeTab" class="func-tabs" type="border-card">
        <el-tab-pane label="设备管理" name="device">
          <div class="device-module">
            <div class="section-heading">
              <div>
                <div class="section-kicker">设备维护</div>
              </div>
              <el-button type="primary" @click="openCreateDialog">新增设备</el-button>
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

      <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑设备' : '新增设备'" width="520px">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
          <el-form-item label="设备编号" prop="device_code">
            <el-input v-model="form.device_code" placeholder="仅支持100x且大于1003，如1004" maxlength="4" />
          </el-form-item>
          <el-form-item label="设备名称" prop="device_name">
            <el-input v-model="form.device_name" placeholder="请输入设备名称" maxlength="100" />
          </el-form-item>
          <el-form-item label="设备类型" prop="device_type">
            <el-select v-model="form.device_type" placeholder="请选择设备类型" class="full-width">
              <el-option label="灌装机" value="灌装机" />
              <el-option label="调配罐" value="调配罐" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
        </template>
      </el-dialog>
    </div>
  </main-layout>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref, computed } from 'vue'
import MainLayout from '../components/layout/MainLayout.vue'
import DataTable from '../components/common/DataTable/index.vue'
import type { Column as DataColumn } from '../components/common/DataTable/types'
import { deviceApi, type DeviceItem } from '../utils/deviceApi'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, ElButton } from 'element-plus'

const activeTab = ref('device')
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)

const allData = ref<DeviceItem[]>([])
const currentPage = ref(1)
const pageSize = ref(10)

const total = computed(() => allData.value.length)
const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return allData.value.slice(start, start + pageSize.value)
})

const formRef = ref<FormInstance>()
const form = reactive({
  device_code: '',
  device_name: '',
  device_type: '' as '灌装机' | '调配罐' | ''
})

const rules: FormRules = {
  device_code: [
    { required: true, message: '请输入设备编号', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (!/^100\d$/.test(String(value))) return callback(new Error('设备编号格式必须为100x'))
        if (Number(value) <= 1003) return callback(new Error('设备编号必须大于1003'))
        callback()
      },
      trigger: 'blur'
    }
  ],
  device_name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  device_type: [{ required: true, message: '请选择设备类型', trigger: 'change' }]
}

const columns: DataColumn[] = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'device_code', label: '设备编号', width: 140 },
  { prop: 'device_name', label: '设备名称', width: 220 },
  { prop: 'device_type', label: '设备类型', width: 140 },
  { prop: 'create_time', label: '创建时间', width: 240 },
  { prop: 'update_time', label: '更新时间', width: 240 },
  {
    prop: 'actions',
    label: '操作',
    customRender: ({ row }) => h('div', { class: 'table-actions' }, [
      h(ElButton, { link: true, type: 'primary', onClick: () => openEditDialog(row) }, () => '编辑'),
      h(ElButton, { link: true, type: 'danger', onClick: () => handleDelete(row) }, () => '删除')
    ])
  }
]

const fetchList = async () => {
  loading.value = true
  try {
    const res = await deviceApi.getList()
    if (res.success) {
      allData.value = res.data || []
      if ((currentPage.value - 1) * pageSize.value >= allData.value.length && currentPage.value > 1) {
        currentPage.value--
      }
    } else {
      ElMessage.error(res.message || '获取设备列表失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取设备列表失败')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.device_code = ''
  form.device_name = ''
  form.device_type = ''
  editingId.value = null
}

const openCreateDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row: DeviceItem) => {
  isEdit.value = true
  editingId.value = row.id
  form.device_code = row.device_code
  form.device_name = row.device_name
  form.device_type = row.device_type
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async valid => {
    if (!valid) return
    submitLoading.value = true
    try {
      if (isEdit.value && editingId.value) {
        const res = await deviceApi.update(editingId.value, {
          device_code: form.device_code,
          device_name: form.device_name,
          device_type: form.device_type as '灌装机' | '调配罐'
        })
        if (!res.success) throw new Error(res.message || '更新失败')
        ElMessage.success('设备更新成功')
      } else {
        const res = await deviceApi.create({
          device_code: form.device_code,
          device_name: form.device_name,
          device_type: form.device_type as '灌装机' | '调配罐'
        })
        if (!res.success) throw new Error(res.message || '新增失败')
        ElMessage.success('设备新增成功')
      }
      dialogVisible.value = false
      await fetchList()
    } catch (error: any) {
      ElMessage.error(error.message || '提交失败')
    } finally {
      submitLoading.value = false
    }
  })
}

const handleDelete = async (row: DeviceItem) => {
  try {
    await ElMessageBox.confirm(`确认删除设备【${row.device_name}】吗？`, '提示', { type: 'warning' })
    const res = await deviceApi.remove(row.id)
    if (!res.success) throw new Error(res.message || '删除失败')
    ElMessage.success('删除成功')
    await fetchList()
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error(error.message || '删除失败')
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
}

onMounted(fetchList)
</script>

<style scoped>
.device-page {
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
.device-page :deep(.el-tabs--border-card),
.device-page :deep(.el-tabs--border-card > .el-tabs__content),
.device-page :deep(.el-tabs--border-card > .el-tabs__header),
.device-page :deep(.el-tabs--border-card > .el-tabs__body) {
  background: transparent;
  border: 0;
  box-shadow: none;
}

.device-module {
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

.full-width { width: 100%; }

:deep(.el-dialog__body) {
  padding-top: 10px;
}
</style>
