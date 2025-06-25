<template>
  <el-aside width="220px" class="app-sidebar" style="height: 100vh;">
    <el-input
      v-model="searchKey"
      placeholder="搜索设备..."
      prefix-icon="Search"
      clearable
      class="search-input"
    />
    <el-button class="history-btn" style="margin-bottom: 10px;">查询历史数据</el-button>
    
    <el-radio-group v-model="deviceStatus" class="status-filter">
      <el-radio-button label="all">全部</el-radio-button>
      <el-radio-button label="online">在线</el-radio-button>
      <el-radio-button label="offline">离线</el-radio-button>
      <el-radio-button label="error">异常</el-radio-button>
    </el-radio-group>

    <el-tree
      :data="deviceTree"
      :props="defaultProps"
      :filter-node-method="filterNode"
      class="device-tree"
    />
  </el-aside>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const searchKey = ref('')
const deviceStatus = ref('all')

const deviceTree = ref([
  {
    label: '生产线设备',
    children: [
      { label: '设备A-在线' },
      { label: '设备B-离线' }
    ]
  },
  // ...more tree data
])

const defaultProps = {
  children: 'children',
  label: 'label'
}

const filterNode = (value: string, data: any) => {
  if (!value) return true
  return data.label.includes(value)
}

watch(searchKey, (val) => {
  // 实现搜索逻辑
})
</script>

<style scoped>
.app-sidebar {
  padding: 16px;
  border-right: 1px solid #334155;
  height: 100vh; /* 设置为视口高度 */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止整体出现滚动条 */
}

.search-input {
  margin-bottom: 16px;
  
}
.search-input :deep(.el-input__wrapper) {
  background-color: #1A2333;
   border: 1px solid #334155; 
}

/* 历史数据按钮 */
.history-btn {
  width: 100%;
  background-color: #4A90E2;
  color: #E5E7EB;
  border: none;
}

.history-btn:hover {
  background-color: #357ABD;
}

.status-filter {
  margin-bottom: 16px;
  width: 100%;
  border: 1px solid #334155;
  border-radius: 4px;
  padding: 2px;
  background-color: #1A2333;
}
.status-filter :deep(.el-radio-button__inner) {
  background-color: transparent;
  border: none;
  color: #94A3B8;
}

.status-filter :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #4A90E2;
  color: #FFFFFF;
  box-shadow: none;
}

.device-tree {
  flex: 1; /* 让树形控件填充剩余空间 */
  overflow-y: auto; /* 只在树形控件内部显示滚动条 */
  background-color: #1A2333;
  border-radius: 4px;
  padding: 8px;
}
.device-tree :deep(.el-tree-node__content) {
  background-color: transparent;
  color: #E5E7EB;
  height: 32px;
}

.device-tree :deep(.el-tree-node__content:hover) {
  background-color: #334155;
}

.device-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: rgba(74, 144, 226, 0.2);
  color: #4A90E2;
}

</style>