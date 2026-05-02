<template>
  <main-layout>
    <div class="test-page">
      <h2>分页器测试页面</h2>

      <!-- 测试数据 -->
      <el-card style="margin-bottom: 20px;">
        <div style="margin-bottom: 10px;">
          <strong>当前页：</strong>{{ currentPage }} | 
          <strong>每页条数：</strong>{{ pageSize }} | 
          <strong>总条数：</strong>{{ total }}
        </div>
        <el-button @click="currentPage = 1">跳到第1页</el-button>
        <el-button @click="currentPage = 51">跳到第51页</el-button>
        <el-button @click="total = 658">设置总数为658</el-button>
        <el-button @click="total = 100">设置总数为100</el-button>
      </el-card>

      <!-- 分页器 -->
      <el-card>
        <h3>分页器效果：</h3>
        <Pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          @page-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </el-card>

      <!-- 使用 DataTable 的示例 -->
      <el-card style="margin-top: 20px;">
        <h3>DataTable 集成示例：</h3>
        <DataTable
          :data="tableData"
          :columns="columns"
          :show-pagination="true"
          :total="total"
          :current-page="currentPage"
          :page-size="pageSize"
          @page-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </el-card>
    </div>
  </main-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MainLayout from '../components/layout/MainLayout.vue'
import Pagination from '../components/common/Pagination.vue'
import DataTable from '../components/common/DataTable/index.vue'
import type { Column } from '../components/common/DataTable/types'

// 分页数据
const currentPage = ref(51)
const pageSize = ref(10)
const total = ref(658)

// 表格数据
const tableData = ref([
  { id: 1, name: '任务A', status: '0', createTime: Date.now() },
  { id: 2, name: '任务B', status: '1', createTime: Date.now() },
  { id: 3, name: '任务C', status: '2', createTime: Date.now() },
  { id: 4, name: '任务D', status: '1', createTime: Date.now() },
  { id: 5, name: '任务E', status: '0', createTime: Date.now() },
])

// 表格列配置
const columns: Column[] = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '任务名称' },
  {
    prop: 'status',
    label: '状态',
    width: 120,
    isStatus: true,
    statusCategory: 'status'
  },
  {
    prop: 'createTime',
    label: '创建时间',
    width: 180,
    isTime: true
  },
  {
    prop: 'actions',
    label: '操作',
    width: 200,
    isActions: true,
    actions: [
      { label: '查看', type: 'primary', onClick: (row) => console.log('查看', row) },
      { label: '删除', type: 'danger', onClick: (row) => console.log('删除', row) }
    ]
  }
]

// 事件处理
const handlePageChange = (page: number) => {
  console.log('切换到第', page, '页')
  currentPage.value = page
}

const handleSizeChange = (size: number) => {
  console.log('每页显示', size, '条')
  pageSize.value = size
}
</script>

<style scoped>
.test-page {
  padding: 20px;
}

h2 {
  margin-bottom: 20px;
  color: var(--text-main);
}

h3 {
  margin-bottom: 16px;
  color: var(--text-secondary);
  font-size: 16px;
}
</style>

