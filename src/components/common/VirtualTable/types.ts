/**
 * VirtualTable 组件类型定义
 */

import type { StatusCategory } from '../statusTag.vue'

/**
 * 列配置
 */
export interface Column {
  key: string            // 唯一标识
  title: string          // 列标题
  dataKey: string        // 数据字段名
  width: number          // 列宽度（必填）

  // 特殊列类型（可选）
  isStatus?: boolean     // 是否是状态列
  statusCategory?: StatusCategory

  isTime?: boolean       // 是否是时间列

  isActions?: boolean    // 是否是操作列
  actions?: Action[]     // 操作按钮列表
}

/**
 * 操作按钮
 */
export interface Action {
  label: string
  type?: 'primary' | 'success' | 'warning' | 'danger'
  onClick: (rowData: any) => void
  show?: (rowData: any) => boolean  // 控制按钮是否显示
}

/**
 * 表格 Props - 简化版
 */
export interface Props {
  data: any[]            // 表格数据
  columns: Column[]      // 列配置
  width?: number         // 表格宽度（可选，默认自适应）
  height?: number        // 表格高度（可选，默认自适应）
  loading?: boolean      // 加载状态
}

