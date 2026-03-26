<template>
  <span
    :class="[
      'common-tag',
      `common-tag--${type}`,
      `common-tag--${size}`,
      { 'is-closable': closable, 'is-plain': plain }
    ]"
  >
    <slot></slot>
    <i v-if="closable" class="tag-close" @click="handleClose">✕</i>
  </span>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

interface Props {
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'large' | 'default' | 'small'
  closable?: boolean
  plain?: boolean
}

withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'default',
  closable: false,
  plain: false
})

const emit = defineEmits<{
  close: []
}>()

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.common-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  border: 1px solid transparent;
  white-space: nowrap;
}

/* 类型样式 */
.common-tag--primary {
  background: #ecf5ff;
  border-color: #d9ecff;
  color: #409eff;
}

.common-tag--success {
  background: #f0f9ff;
  border-color: #c2e7b0;
  color: #67c23a;
}

.common-tag--warning {
  background: #fdf6ec;
  border-color: #f5dab1;
  color: #e6a23c;
}

.common-tag--danger {
  background: #fef0f0;
  border-color: #fbc4c4;
  color: #f56c6c;
}

.common-tag--info {
  background: #f4f4f5;
  border-color: #e9e9eb;
  color: #909399;
}

/* 尺寸样式 */
.common-tag--large {
  padding: 6px 12px;
  font-size: 14px;
}

.common-tag--small {
  padding: 2px 6px;
  font-size: 11px;
}

/* Plain 样式 */
.common-tag.is-plain {
  background: #fff;
}

/* 关闭按钮 */
.tag-close {
  cursor: pointer;
  font-size: 12px;
  opacity: 0.7;
  transition: opacity 0.3s;
  font-style: normal;
}

.tag-close:hover {
  opacity: 1;
}
</style>

