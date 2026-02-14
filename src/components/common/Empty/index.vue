<template>
  <div class="common-empty">
    <div class="empty-icon">
      <slot name="icon">
        <svg viewBox="0 0 64 64" width="64" height="64">
          <path
            d="M32 8C18.745 8 8 18.745 8 32s10.745 24 24 24 24-10.745 24-24S45.255 8 32 8zm0 44c-11.028 0-20-8.972-20-20s8.972-20 20-20 20 8.972 20 20-8.972 20-20 20z"
            fill="#dcdfe6"
          />
          <path
            d="M32 24c-1.105 0-2 .895-2 2v12c0 1.105.895 2 2 2s2-.895 2-2V26c0-1.105-.895-2-2-2zm0 20c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2z"
            fill="#909399"
          />
        </svg>
      </slot>
    </div>
    <div class="empty-description">
      <slot>{{ description }}</slot>
    </div>
    <div v-if="$slots.action" class="empty-action">
      <slot name="action"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

interface Props {
  description?: string
}

withDefaults(defineProps<Props>(), {
  description: '暂无数据'
})
</script>

<style scoped>
.common-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-description {
  font-size: 14px;
  color: #909399;
  margin-bottom: 16px;
}

.empty-action {
  margin-top: 8px;
}
</style>

