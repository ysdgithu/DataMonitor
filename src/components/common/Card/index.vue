<template>
  <div :class="['common-card', { 'is-shadow': shadow, 'is-hoverable': hoverable }]">
    <div v-if="$slots.header || title" class="common-card__header">
      <slot name="header">
        <div class="common-card__title">{{ title }}</div>
      </slot>
      <div v-if="$slots.extra" class="common-card__extra">
        <slot name="extra"></slot>
      </div>
    </div>
    <div class="common-card__body" :style="bodyStyle">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="common-card__footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
import type { CSSProperties } from 'vue'

interface Props {
  title?: string
  shadow?: boolean
  hoverable?: boolean
  bodyStyle?: CSSProperties
}

withDefaults(defineProps<Props>(), {
  shadow: true,
  hoverable: false
})
</script>

<style scoped>
.common-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  overflow: hidden;
  transition: all 0.3s;
}

.common-card.is-shadow {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.common-card.is-hoverable:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.common-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

.common-card__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.common-card__extra {
  color: #909399;
}

.common-card__body {
  padding: 20px;
}

.common-card__footer {
  padding: 12px 20px;
  border-top: 1px solid #ebeef5;
  background: #fafafa;
}
</style>

