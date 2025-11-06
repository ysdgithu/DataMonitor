<template>
  <el-aside width="220px" class="app-sidebar" style="height: 100vh;">
    <!-- 导航菜单 -->
    <el-menu
      :default-active="activeMenu"
      class="sidebar-menu"
      @select="handleMenuSelect"
    >
      <el-menu-item index="dashboard">
        <el-icon><Monitor /></el-icon>
        <span>监控大屏</span>
      </el-menu-item>
      <el-menu-item index="diagnosis">
        <el-icon><DocumentChecked /></el-icon>
        <span>诊断任务</span>
      </el-menu-item>
    </el-menu>

    <!-- 分隔线 -->
    <!-- <el-divider class="menu-divider" /> -->

    
  </el-aside>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Monitor, DocumentChecked } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const searchKey = ref('')
const deviceStatus = ref('all')

// 根据当前路由确定激活的菜单项
const activeMenu = computed(() => {
  if (route.path === '/diagnosis') {
    return 'diagnosis'
  }
  return 'dashboard'
})



const handleMenuSelect = (index: string) => {
  if (index === 'dashboard') {
    router.push('/')
  } else if (index === 'diagnosis') {
    router.push('/diagnosis')
  }
}

watch(searchKey, (val) => {
  // 实现搜索逻辑
})
</script>

<style scoped>
.app-sidebar {
  padding: 16px;
  border-right: 1px solid #ccc;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 侧边栏菜单样式 */
.sidebar-menu {
  background-color: transparent;
  border: none;
  margin-bottom: 8px;
}

.sidebar-menu :deep(.el-menu-item) {
  color: #606266;
  background-color: transparent;
  border-radius: 6px;
  margin-bottom: 4px;
  transition: all 0.3s;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: rgba(74, 144, 226, 0.1);
  color: #4A90E2;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: rgba(74, 144, 226, 0.15);
  color: #4A90E2;
  font-weight: 600;
}

.sidebar-menu :deep(.el-icon) {
  color: inherit;
}

/* 分隔线 */
.menu-divider {
  margin: 12px 0;
  border-color: #EBEEF5;
}

/* 设备筛选区域 */
.device-filter-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-input {
  margin-bottom: 16px;
}

/* 历史数据按钮 */
.history-btn {
  width: 100%;
  background-color: #4A90E2;
  color: #FFFFFF;
  border: none;
}

.history-btn:hover {
  background-color: #357ABD;
}


</style>