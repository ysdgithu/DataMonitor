<template>
  <main-layout>
    <div class="exception-page">
      <div class="page-header">
        <div>
          <h2 class="page-title">告警规则管理</h2>
          <p class="page-desc">管理员可在此页面修改阈值、持续时间和告警等级，当前仅支持编辑已有规则。</p>
        </div>
        <el-button type="primary" :loading="loading" @click="loadRules">刷新规则</el-button>
      </div>

      <el-card class="rule-card" shadow="never">
        <el-table :data="filteredRules" v-loading="loading" border stripe>
          <el-table-column prop="rule_name" label="规则名称" min-width="160" />
          <el-table-column prop="device_type" label="设备类型" width="140" />
          <el-table-column prop="params" label="监控参数" min-width="180" />
          <el-table-column label="阈值范围" min-width="170">
            <template #default="{ row }">
              {{ formatThreshold(row.threshold_min, row.threshold_max) }}
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="持续时间(s)" width="120" />
          <el-table-column prop="count" label="连续次数" width="100" />
          <el-table-column label="告警等级" width="100">
            <template #default="{ row }">
              {{ formatLevel(row.alarm_level) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEditDialog(row)">修改</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-dialog v-model="dialogVisible" title="修改告警规则" width="720px">
        <el-form ref="formRef" :model="form" :rules="formRules" label-width="120px">
          <el-form-item label="规则名称" prop="rule_name">
            <el-input v-model="form.rule_name" placeholder="请输入规则名称" />
          </el-form-item>
          <el-form-item label="设备类型" prop="device_type">
            <el-select v-model="form.device_type" style="width: 100%">
              <el-option label="调配罐" value="调配罐" />
              <el-option label="灌装机" value="灌装机" />
              <el-option label="封盖机" value="封盖机" />
              <el-option label="贴标机" value="贴标机" />
              <el-option label="洗瓶机" value="洗瓶机" />
            </el-select>
          </el-form-item>
          <el-form-item label="监控参数" prop="params">
            <el-input v-model="form.params" placeholder="多个参数用英文逗号分隔" />
          </el-form-item>
          <el-form-item label="阈值下限">
            <el-input-number v-model="form.threshold_min" :precision="2" :step="0.1" style="width: 100%" />
          </el-form-item>
          <el-form-item label="阈值上限">
            <el-input-number v-model="form.threshold_max" :precision="2" :step="0.1" style="width: 100%" />
          </el-form-item>
          <el-form-item label="持续时间(秒)">
            <el-input-number v-model="form.duration" :min="0" :step="1" style="width: 100%" />
          </el-form-item>
          <el-form-item label="连续触发次数">
            <el-input-number v-model="form.count" :min="0" :step="1" style="width: 100%" />
          </el-form-item>
          <el-form-item label="告警等级" prop="alarm_level">
            <el-radio-group v-model="form.alarm_level">
              <el-radio :value="1">一般</el-radio>
              <el-radio :value="2">重要</el-radio>
              <el-radio :value="3">紧急</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="处置建议">
            <el-input v-model="form.handle_suggest" type="textarea" :rows="4" placeholder="请输入处置建议" />
          </el-form-item>
          <el-form-item label="状态">
            <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
        </template>
      </el-dialog>
    </div>
  </main-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import MainLayout from '../components/layout/MainLayout.vue'
import { getAlarmRules, updateAlarmRule, type AlarmRule } from '../utils/alarmRuleApi'

const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const rules = ref<AlarmRule[]>([])
const currentRuleId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  rule_name: '',
  device_type: '',
  params: '',
  threshold_min: null as number | null,
  threshold_max: null as number | null,
  duration: 0,
  count: 0,
  alarm_level: 1,
  handle_suggest: '',
  status: 1
})

const formRules: FormRules = {
  rule_name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  device_type: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  params: [{ required: true, message: '请输入监控参数', trigger: 'blur' }],
  alarm_level: [{ required: true, message: '请选择告警等级', trigger: 'change' }]
}

const filteredRules = computed(() => rules.value)

const formatThreshold = (min: number | null, max: number | null) => {
  if (min === null && max === null) return '-'
  if (min === null) return `≤ ${max}`
  if (max === null) return `≥ ${min}`
  return `${min} ~ ${max}`
}

const formatLevel = (level: number) => {
  const map: Record<number, string> = {
    1: '一般',
    2: '重要',
    3: '紧急'
  }
  return map[level] || String(level)
}

const loadRules = async () => {
  loading.value = true
  try {
    const res: any = await getAlarmRules()
    if (res?.success) {
      rules.value = res.data || []
    } else {
      ElMessage.error(res?.message || '获取告警规则失败')
    }
  } catch (error: any) {
    console.error('获取告警规则失败:', error)
    ElMessage.error(error.message || '获取告警规则失败')
  } finally {
    loading.value = false
  }
}

const openEditDialog = (row: AlarmRule) => {
  currentRuleId.value = row.id
  form.rule_name = row.rule_name
  form.device_type = row.device_type
  form.params = row.params
  form.threshold_min = row.threshold_min
  form.threshold_max = row.threshold_max
  form.duration = row.duration || 0
  form.count = row.count || 0
  form.alarm_level = row.alarm_level
  form.handle_suggest = row.handle_suggest || ''
  form.status = row.status
  dialogVisible.value = true
}

const submit = async () => {
  if (!formRef.value || currentRuleId.value === null) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      const payload = {
        ...form,
        handle_suggest: form.handle_suggest || null
      }
      const res: any = await updateAlarmRule(currentRuleId.value as number, payload)
      if (res?.success) {
        ElMessage.success('规则更新成功')
        dialogVisible.value = false
        await loadRules()
      } else {
        ElMessage.error(res?.message || '规则更新失败')
      }
    } catch (error: any) {
      console.error('更新规则失败:', error)
      ElMessage.error(error.message || '规则更新失败')
    } finally {
      saving.value = false
    }
  })
}

onMounted(() => {
  loadRules()
})
</script>

<style scoped>
.exception-page {
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

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #182235;
}

.page-desc {
  margin: 8px 0 0;
  color: #5d6b82;
  font-size: 14px;
  line-height: 1.6;
}

.rule-card {
  border: 0;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(31, 45, 61, 0.08);
}
</style>
