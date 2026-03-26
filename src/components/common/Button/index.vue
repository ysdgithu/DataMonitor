<template>
  <button
    :class="[
      'common-button',
      `common-button--${type}`,
      `common-button--${size}`,
      {
        'is-disabled': disabled,
        'is-loading': loading,
        'is-plain': plain,
        'is-round': round,
        'is-circle': circle
      }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <i v-if="loading" class="loading-icon"></i>
    <i v-if="icon && !loading" :class="icon"></i>
    <span v-if="$slots.default && !circle">
      <slot></slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

interface Props {
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
  size?: 'large' | 'default' | 'small'
  disabled?: boolean
  loading?: boolean
  plain?: boolean
  round?: boolean
  circle?: boolean
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  size: 'default',
  disabled: false,
  loading: false,
  plain: false,
  round: false,
  circle: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
.common-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.3s;
  outline: none;
  white-space: nowrap;
}

/* 类型样式 */
.common-button--default {
  background: #fff;
  border-color: #dcdfe6;
  color: #606266;
}
.common-button--default:hover { background: #ecf5ff; border-color: #409eff; color: #409eff; }

.common-button--primary { background: #409eff; border-color: #409eff; color: #fff; }
.common-button--primary:hover { background: #66b1ff; border-color: #66b1ff; }

.common-button--success { background: #67c23a; border-color: #67c23a; color: #fff; }
.common-button--success:hover { background: #85ce61; border-color: #85ce61; }

.common-button--warning { background: #e6a23c; border-color: #e6a23c; color: #fff; }
.common-button--warning:hover { background: #ebb563; border-color: #ebb563; }

.common-button--danger { background: #f56c6c; border-color: #f56c6c; color: #fff; }
.common-button--danger:hover { background: #f78989; border-color: #f78989; }

.common-button--info { background: #909399; border-color: #909399; color: #fff; }
.common-button--info:hover { background: #a6a9ad; border-color: #a6a9ad; }

/* 尺寸样式 */
.common-button--large { padding: 12px 20px; font-size: 16px; }
.common-button--small { padding: 6px 12px; font-size: 12px; }

/* 状态样式 */
.common-button.is-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.common-button.is-plain {
  background: #fff;
}
.common-button--primary.is-plain { color: #409eff; border-color: #b3d8ff; }
.common-button--success.is-plain { color: #67c23a; border-color: #c2e7b0; }
.common-button--warning.is-plain { color: #e6a23c; border-color: #f5dab1; }
.common-button--danger.is-plain { color: #f56c6c; border-color: #fbc4c4; }

.common-button.is-round { border-radius: 20px; }
.common-button.is-circle { border-radius: 50%; padding: 8px; }

/* 加载动画 */
.loading-icon {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: rotate 0.8s linear infinite;
}

@keyframes rotate {
  to { transform: rotate(360deg); }
}
</style>

