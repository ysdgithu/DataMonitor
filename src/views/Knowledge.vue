<template>
  <main-layout>
    <div class="background">
      <h2 class="title">知识库管理</h2>
      <el-row justify="space-between"><search-input :placeholder="'搜索文件'" style="width: 30%;" />
        <el-button type="primary">上传文件</el-button>
      </el-row>
      <el-divider></el-divider>
      <el-table :data="documentList">
        <el-table-column prop="name" label="文档名称" width="180" />
        <el-table-column prop="uploadTime" label="上传时间" width="180" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-switch v-model="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <!-- 可以查看，重新上传，删除 -->
          <template #default>
            <el-button size="small" type="primary">更新</el-button>
            <el-button size="small" type="danger">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- 开始 -->
      <!-- 样式测试区 -->
      <div class="test" style="padding: 20px; height: 500px;">
        <h2 style="margin-bottom: 20px;">样式测试</h2>

        <!-- 1. 颜色 -->
        <div style="margin-bottom: 20px;">
          <h3>颜色</h3>
          <div style="display: flex; gap: 10px;">
            <div style="width: 60px; height: 40px; background: var(--border-base);"></div>
            <div style="width: 60px; height: 40px; background: var(--border-light);"></div>
            <div style="width: 60px; height: 40px; background: var(--border-dark);"></div>
            <div style="width: 60px; height: 40px; background: var(--warning);"></div>
            <div style="width: 60px; height: 40px; background: var(--error);"></div>
          </div>
        </div>

        <!-- 2. 标题 -->
        <div style="margin-bottom: 20px;">
          <h3>标题</h3>
          <div class="title-h1">一级标题</div>
          <div class="title-h2">二级标题</div>
        </div>

        <!-- 表格测试 -->
        <!-- <DataTable :data="taskList" :columns="columns" :loading="loading" :show-pagination="true" :total="total"
          :current-page="page" :page-size="size" @page-change="page = $event" @size-change="size = $event" /> -->
        <VirtualTable
          :data="taskList" :columns="columns" :loading="loading" :height="400" ></VirtualTable>
          <!-- 4. 标签 -->
        <div style="margin-bottom: 20px;">
          <h3>标签</h3>
          <span class="tag tag-primary">标签1</span>
          <span class="tag tag-success">标签2</span>
        </div>

        <!-- 5. 按钮 -->
        <div style="margin-bottom: 20px;">
          <h3>按钮</h3>
          <button class="btn-text">复制</button>
          <button class="btn-text">重新生成</button>
        </div>
      </div>
      <!-- 结束 -->
    </div>
  </main-layout>
</template>

<script setup lang="ts">
import MainLayout from '../components/layout/MainLayout.vue'
import DataTable from '../components/common/DataTable/index.vue'
import VirtualTable from '../components/common/VirtualTable/index.vue'
import type { Column } from '../components/common/DataTable/types'
import { ref } from 'vue'

// 任务数据类型
interface Task {
  id: number
  name: string
  device_id: string
  status: number
  priority: number
  create_time: number
  update_time: number
}

//维护文档表格列表
const documentList = [
  {
    name: '设备手册',
    uploadTime: '2021-01-01',
    status: true
  },
  {
    name: '设备手册',
    uploadTime: '2021-01-01',
    status: true
  },
  {
    name: '设备手册',
    uploadTime: '2021-01-01',
    status: true
  }
]

const loading = ref(false)
const page = ref(1)
const size = ref(10)
const total = ref(100) // 设置总条数为100，用于测试分页器

// 生成测试数据
const taskList = ref([
  {
    id: 1,
    name: '任务1',
    device_id: '001',
    status: 0,
    priority: 0,
    create_time: 1705294200000,
    update_time: 1705308000000
  },
  {
    id: 2,
    name: '任务2',
    device_id: '002',
    status: 1,
    priority: 1,
    create_time: 1705294200000,
    update_time: 1705308000000
  },
  {
    id: 3,
    name: '任务3',
    device_id: '003',
    status: 2,
    priority: 2,
    create_time: 1705294200000,
    update_time: 1705308000000
  },
  {
    id: 4,
    name: '任务4',
    device_id: '004',
    status: 3,
    priority: 0,
    create_time: 1705294200000,
    update_time: 1705308000000
  },
  {
    id: 5,
    name: '任务5',
    device_id: '005',
    status: 4,
    priority: 1,
    create_time: 1705294200000,
    update_time: 1705308000000
  },
])


const columns = [
  { key: 'id', title: '任务ID', dataKey: 'id', width: 100 },
  { key: 'name', title: '任务名称', dataKey: 'name', width: 180 },
  { key: 'device_id', title: '设备ID', dataKey: 'device_id', width: 120 },
  { key: 'status', title: '状态', dataKey: 'status', width: 120 },
  { key: 'priority', title: '优先级', dataKey: 'priority', width: 100 , isStatus : true , statusCategory: 'priority' },
  { key: 'create_time', title: '创建时间', dataKey: 'create_time', width: 180 , isTime: true },
  {
    key: 'actions',
    title: '操作',
    dataKey: 'actions', width: 200,
    isActions: true,
    actions: [
      { label: '查看', type: 'primary', onClick: (row) => viewDetail(row) },
    ]
  }
]


// 操作函数
const viewDetail = (row: Task) => {
  console.log('查看详情:', row)
}

const pauseTask = (row: Task) => {
  console.log('暂停任务:', row)
}

const startTask = (row: Task) => {
  console.log('启动任务:', row)
}

const deleteTask = (row: Task) => {
  console.log('删除任务:', row)
}
</script>

<style></style>
