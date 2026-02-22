<template>
  <main-layout>
    <div class="history-main">
      <h3 class="title">历史数据总览</h3>
      <!-- 筛选区 -->
      <div class="selection">
        <!-- 第一行 -->
        <el-row :gutter="20" style="margin-bottom: 15px;">
          <el-col :span="8">
            <div class="input-row"><span class="small-title">设备名称/ID</span><el-input v-model="input"
                style="width: 240px; margin-left: 8px;" placeholder="请输入设备名称/id" /></div>
          </el-col>
          <el-col :span="8">
            <div class="input-row">
              <span class="small-title">设备类型</span>
              <el-select placeholder="请选择设备类型" style="width: 240px; margin-left: 8px;" clearable>
                <el-option label="全部设备" value="" />
                <el-option label="调配罐" value="mixer" />
                <el-option label="灌装机" value="filler" />
                <el-option label="封盖机" value="capper" />
                <el-option label="贴标机" value="labeler" />
                <el-option label="包装码垛机" value="packer" />
              </el-select>
            </div>
          </el-col>
          <!-- 查询按钮 -->
          <el-col :span="6">
            <el-button type="primary">
              <el-icon style="margin-right: 5px;">
                <Search />
              </el-icon>
              查询
            </el-button>
          </el-col>
        </el-row>
        <!-- 第二行 -->
        <el-row :gutter="20">
          <el-col :span="10">
            <div class="input-row">
              <span class="small-title">时间范围</span>
              <el-date-picker type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期"
                size="default" />
            </div>
          </el-col>
          <el-col :span="8">
            <div class="input-row">
              <span class="small-title">数据类型</span>
              <el-select placeholder="请选择数据类型" style="width: 240px; margin-left: 8px;" clearable>
                <el-option label="全部数据" value="" />
                <el-option label="运行状态" value="status" />
                <el-option label="性能参数" value="performance" />
                <el-option label="能耗数据" value="energy" />
                <el-option label="产量数据" value="production" />
              </el-select>
            </div>
          </el-col>
          <!-- 重置按钮 -->
          <el-col :span="6">
            <el-button>
              <el-icon style="margin-right: 5px;">
                <Refresh />
              </el-icon>
              重置
            </el-button>
          </el-col>
        </el-row>
      </div>
      <el-row class="btn-area" justify="space-between">
        <div>
          <el-button type="primary">新增</el-button>
          <el-button>批量导入</el-button>
        </div>
        <el-button>
          <el-icon style="margin-right: 5px;">
            <Download />
          </el-icon>
          下载
        </el-button>
      </el-row>
      <!-- 范围提示 -->
      <el-row class="tips">
        数据范围：<span style="font-weight: bold;">2025-09-10 10:00:00 ~ 2025-09-10 10:30:00 </span>
      </el-row>
      <VirtualTable :columns="columns" :data="tableData" :height="400" class="task-table" />
      <el-row justify="end">
        <span class="font">共100条</span>
        <el-pagination v-model:current-page="currentPage" :page-size="100" layout="prev, pager, next" :total="1000"
          @current-change="handleCurrentChange" />
      </el-row>
    </div>
  </main-layout>
</template>
<script setup lang="ts">
import MainLayout from '../components/layout/MainLayout.vue'
import VirtualTable from '../components/common/VirtualTable/index.vue'
import { Download, Refresh, Search } from '@element-plus/icons-vue'
import { ref } from 'vue'
const tableData = [
  {
    date: '23:42:04',
    name: '调配罐',
    type: '温度',
    value: '30',
    status: '0',
  },
  {
    date: '23:42:04',
    name: '调配罐',
    type: '液位',
    value: '50%',
    status: '1',
  },

]
const columns = [
  { key: 'date', title: '时间', dataKey: 'date', width: 180 },
  { key: 'name', title: '设备名称', dataKey: 'name', width: 180 },
  { key: 'type', title: '监控参数', dataKey: 'type', width: 180 },
  { key: 'value', title: '监控参数数值', dataKey: 'value', width: 180 },
  {
    key: 'status', 
    title: '数据状态', 
    dataKey: 'status', 
    width: 180,
    isStatus: true,
    statusCategory: 'historyData'
  },
  {
    key: 'actions',
    title: '操作',
    dataKey: 'actions',
    width: 200,
    isActions: true,
    actions: [
      { label: '删除', type: 'primary', onClick: (row: any) => console.log('删除', row) }
    ]
  }
]
const currentPage = ref(1)
const input = ref('')
//处理分页
const handleCurrentChange = () => {

}

</script>
<style scoped>
.history-main {
  padding: var(--spacing-base);
  margin: var(--spacing-base);
  background-color: var(--bg-main);
  min-height: 100vh;
}

.title {
  font-size: var(--font-base);
  font-weight: bold;
  margin-bottom: var(--spacing-base);
}

.selection {
  margin-bottom: var(--spacing-base);
}

.font {
  font-size: var(--font-base);
  color: var(--text-secondary);
}

.input-row {
  display: flex;
  align-items: center;
}

.small-title {
  font-size: var(--font-sm);
  font-weight: bold;
  color: var(--text-secondary);
  margin-right: var(--spacing-sm);
}

.tips {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin: var(--spacing-base) 0;
}

.task-table :deep(.el-table__header th) {
  background-color: var(--bg-secondary);
  font-weight: bold;
  border-bottom: 1px solid var(--border-light);
}
</style>
