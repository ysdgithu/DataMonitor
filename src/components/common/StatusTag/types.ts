import { Component } from 'vue'

/**
 * StatusTag 组件的类型定义
 */
export type StatusTagType = 'success' | 'warning' | 'danger' | 'info' | 'primary'

export type StatusTagSize = 'small' | 'default' | 'large'

export interface StatusTagProps {
  /** 标签类型 */
  type?: StatusTagType
  /** 标签文本 */
  text?: string
  /** 标签尺寸 */
  size?: StatusTagSize
  /** 图标组件 */
  icon?: Component
}

