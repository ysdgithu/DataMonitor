<template>
  <el-tag :type="computedType" :size="size" effect="plain">
    {{ computedText }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * StatusTag 组件 - 智能状态标签
 * 支持传入原始值，自动映射为对应的类型和文本
 */

export type StatusTagType = 'success' | 'warning' | 'danger' | 'info' | 'primary' | ''
export type StatusTagSize = 'small' | 'default' | 'large'
export type StatusCategory = 'status' | 'priority' | 'device' | 'historyData' | 'custom'

interface Props {
  /** 原始值（如 '0', '1', '2', '4' 等） */
  value?: string | number
  /** 分类：status(任务状态) | priority(优先级) | device(设备状态) | historyData(历史数据状态) | custom(自定义) */
  category?: StatusCategory
  /** 自定义类型（当 category='custom' 时使用） */
  type?: StatusTagType
  /** 自定义文本（当 category='custom' 时使用） */
  text?: string
  /** 尺寸 */
  size?: StatusTagSize
}

const props = withDefaults(defineProps<Props>(), {
  category: 'custom',
  type: 'info',
  size: 'default'
})

// 任务状态映射配置
const statusMap: Record<string, { type: StatusTagType; text: string }> = {
  '0': { type: 'primary', text: '进行中' },
  '1': { type: 'success', text: '已完成' },
  '2': { type: 'danger', text: '失败' },
  '4': { type: 'info', text: '待执行' }
}

// 优先级映射配置
const priorityMap: Record<string, { type: StatusTagType; text: string }> = {
  '0': { type: 'info', text: '低' },
  '1': { type: 'warning', text: '中' },
  '2': { type: 'danger', text: '高' }
}
// 历史数据状态配置
const historyDataMap: Record<string, { type: StatusTagType; text: string }> = {
  '0': { type: 'success', text: '正常' },
  '1': { type: 'warning', text: '过高' },
  '2': { type: 'primary', text: '过低' },
}
// 设备状态映射配置
const deviceMap: Record<string, { type: StatusTagType; text: string }> = {
  'online': { type: 'success', text: '在线' },
  'offline': { type: 'danger', text: '离线' },
  'warning': { type: 'warning', text: '警告' },
  'error': { type: 'info', text: '错误' }
}

// 计算标签类型
const computedType = computed(() => {
  if (props.category === 'custom') {
    return props.type || 'info'
  }

  const key = String(props.value)

  if (props.category === 'status') {
    return statusMap[key]?.type || 'info'
  }

  if (props.category === 'priority') {
    return priorityMap[key]?.type || 'info'
  }

  if (props.category === 'device') {
    return deviceMap[key]?.type || 'info'
  }

  if (props.category === 'historyData') {
    return historyDataMap[key]?.type || 'info'
  }

  return 'info'
})

// 计算标签文本
const computedText = computed(() => {
  if (props.category === 'custom') {
    return props.text || ''
  }

  const key = String(props.value)

  if (props.category === 'status') {
    return statusMap[key]?.text || key
  }

  if (props.category === 'priority') {
    return priorityMap[key]?.text || key
  }

  if (props.category === 'device') {
    return deviceMap[key]?.text || key
  }
  if (props.category === 'historyData') {
    return historyDataMap[key]?.text || key
  }

  return key
})
</script>

<style scoped></style>
