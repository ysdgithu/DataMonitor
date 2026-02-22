/**
 * 公用组件库统一导出
 * 使用方式：
 * 1. 按需导入：import { CommonButton, CommonCard } from '@/components/common'
 * 2. 全局注册：在 main.ts 中注册
 */

import CommonLoading from './Loading/index.vue'
import CommonEmpty from './Empty/index.vue'
import SearchInput from './searchInput.vue'
import StatusTag from './statusTag.vue'
import DataTable from './DataTable/index.vue'
import VirtualTable from './VirtualTable/index.vue'
import Pagination from './Pagination.vue'

// 导出所有组件
export {
  CommonLoading,
  CommonEmpty,
  SearchInput,
  StatusTag,
  DataTable,
  Pagination,
  VirtualTable
}

// 默认导出（用于全局注册）
export default {
  CommonLoading,
  CommonEmpty,
  SearchInput,
  StatusTag,
  DataTable,
  Pagination,
  VirtualTable
}

