<template>
  <div :class="['common-loading', { 'is-fullscreen': fullscreen }]">
    <div class="loading-spinner" :style="{ width: size, height: size }">
      <div class="spinner-circle"></div>
    </div>
    <div v-if="text" class="loading-text">{{ text }}</div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

interface Props {
  text?: string
  size?: string
  fullscreen?: boolean
}

withDefaults(defineProps<Props>(), {
  size: '40px',
  fullscreen: false
})
</script>

<style scoped>
.common-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.common-loading.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  z-index: 3000;
}

.loading-spinner {
  position: relative;
}

.spinner-circle {
  width: 100%;
  height: 100%;
  border: 3px solid #f0f0f0;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  font-size: 14px;
  color: #606266;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

