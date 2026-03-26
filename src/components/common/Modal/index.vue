<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="common-modal-overlay" @click="handleOverlayClick">
        <Transition name="modal-slide">
          <div v-if="modelValue" class="common-modal" :style="{ width }" @click.stop>
            <div class="common-modal__header">
              <slot name="header">
                <div class="common-modal__title">{{ title }}</div>
              </slot>
              <button v-if="showClose" class="common-modal__close" @click="handleClose">
                ✕
              </button>
            </div>
            <div class="common-modal__body">
              <slot></slot>
            </div>
            <div v-if="$slots.footer || showFooter" class="common-modal__footer">
              <slot name="footer">
                <button class="modal-btn modal-btn--cancel" @click="handleClose">取消</button>
                <button class="modal-btn modal-btn--confirm" @click="handleConfirm">确定</button>
              </slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

interface Props {
  modelValue: boolean
  title?: string
  width?: string
  showClose?: boolean
  showFooter?: boolean
  closeOnClickOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '提示',
  width: '500px',
  showClose: true,
  showFooter: true,
  closeOnClickOverlay: true
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  close: []
}>()

const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

const handleConfirm = () => {
  emit('confirm')
}

const handleOverlayClick = () => {
  if (props.closeOnClickOverlay) {
    handleClose()
  }
}
</script>

<style scoped>
.common-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.common-modal {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.common-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.common-modal__title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.common-modal__close {
  background: none;
  border: none;
  font-size: 20px;
  color: #909399;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s;
}

.common-modal__close:hover {
  background: #f5f7fa;
  color: #606266;
}

.common-modal__body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.common-modal__footer {
  padding: 12px 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal-btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.modal-btn--cancel {
  background: #fff;
  color: #606266;
}

.modal-btn--cancel:hover {
  color: #409eff;
  border-color: #409eff;
}

.modal-btn--confirm {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.modal-btn--confirm:hover {
  background: #66b1ff;
}

/* 动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-slide-enter-active,
.modal-slide-leave-active {
  transition: all 0.3s;
}

.modal-slide-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}

.modal-slide-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>

