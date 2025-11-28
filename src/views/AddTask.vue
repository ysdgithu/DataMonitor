<template>
    <div class="common-layout">
      <!-- 任务标题：输入框
      设备id:选择框
      优先级：选择框
      负责人：输入框（理论上是选择框）
      详情：输入框（期望是文本加图片）
      附件：上传
      | 参数名 | 类型 | 必填 | 说明 |
      |--------|------|------|------|
      | name | string | 是 | 任务标题 |
      | deviceId | string | 是 | 设备ID |
      | priority | number | 是 | 优先级 (0-低, 1-中, 2-高) |
      | assignee | string | 是 | 任务负责人 |
      | detail | string | 否 | 任务详情 |
      | status | number | 否 | 任务状态，默认4(待执行) | -->
      <el-form :model="form" label-width="auto" style="max-width: 600px">
    <el-form-item label="任务名称">
      <el-input v-model="form.name" />
    </el-form-item>
    <el-form-item label="设备选择">
      <el-select v-model="form.deviceId" placeholder="设备列表">
        <el-option label="核心指标传感器" value="000" />
        <el-option label="环境传感器" value="001" />
        <el-option label="通信量传感器" value="002" />
      </el-select>
    </el-form-item>
    <el-form-item label="优先级">
      <el-radio-group v-model="form.priority">
      <el-radio :label="0">低</el-radio>
      <el-radio :label="1">中</el-radio>
      <el-radio :label="2">高</el-radio>
  </el-radio-group>
    </el-form-item>
    <el-form-item label="任务负责人">
      <el-input v-model="form.assignee" />
    </el-form-item>
    <el-form-item label="任务详情">
      <el-input v-model="form.detail" type="textarea" />
    </el-form-item>
    <el-form-item>
      <el-row style="align-items: end;">
        <el-button type="primary" @click="onSubmit">新增</el-button>
        <el-button @click="onCancel">取消</el-button>
      </el-row>
    </el-form-item>
  </el-form>
  </div>
</template>
<script script setup lang="ts">
import { reactive } from 'vue'
import { DiagnosticApi, type DiagnosisTask, type QueryParams } from '../utils/diagnosticApi'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['close'])
// 初始化api
const api=new DiagnosticApi()
const form= reactive({
     name: '',
     deviceId: '',
     priority: 0,
     assignee: '',
     detail: '',
     status: 4
})

const onSubmit = async () => {
  const res=await api.createDiagnosisTask(form)
  if(res.success){
    ElMessage.success('新增成功')
  }else{
    ElMessage.error('新增失败')
  }
  emit('close')
  
}
const onCancel = () => {
  emit('close') // 通知父组件关闭弹窗
}
</script>
<style scoped>
</style>