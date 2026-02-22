/**
 * DataTable 组件类型定义 - 简化版
 * 专为 DataMonitor 项目设计，只保留实际需要的功能
 */

import type { StatusCategory } from '../statusTag.vue'

import type { VNode } from 'vue'

/**
 * 列配置 - 简化版
 */
export interface Column {
  prop: string           // 字段名
  label: string          // 列标题
  width?: number         // 列宽度（可选）

  // 特殊列类型（可选，不填就是普通文本列）
  isStatus?: boolean     // 是否是状态列（自动使用 StatusTag）
  statusCategory?: StatusCategory  // 状态类型（配合 isStatus 使用）

  isTime?: boolean       // 是否是时间列（自动格式化）

  isActions?: boolean    // 是否是操作列
  actions?: Action[]     // 操作按钮列表

  // 自定义渲染
  customRender?: (params: { row: any, value: any }) => VNode | string | null  // 自定义渲染函数
}

/**
 * 操作按钮 - 简化版
 */
export interface Action {
  label: string                           // 按钮文字
  type?: 'primary' | 'success' | 'warning' | 'danger'  // 按钮类型
  onClick: (row: any) => void            // 点击事件
  show?: (row: any) => boolean           // 是否显示（可选）
}

/**
 * 表格 Props - 简化版
 */
export interface Props {
  data: any[]            // 表格数据
  columns: Column[]      // 列配置
  loading?: boolean      // 加载状态

  // 分页相关（可选）
  showPagination?: boolean   // 是否显示分页
  total?: number             // 总条数
  currentPage?: number       // 当前页
  pageSize?: number          // 每页条数
}

