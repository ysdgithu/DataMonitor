<template>
  <el-aside width="220px" class="app-sidebar" style="height: 100vh;">
    <!-- 导航菜单 -->
    <el-menu
      :default-active="activeMenu"
      class="sidebar-menu"
      @select="handleMenuSelect"
    >
    <el-menu-item
      v-for="item in menuItems.filter(i => !i.children)"
      :key="item.index"
      :index="item.route"
    >
    <el-icon><component :is="item.icon" /></el-icon>
    <span>{{ item.label }}</span>
    </el-menu-item>
    <!-- 有子菜单的项 -->
<el-sub-menu
  v-for="item in menuItems.filter(i => i.children)"
  :key="item.index"
  :index="item.route || String(item.index)"
>
  <template #title>
    <el-icon><component :is="item.icon" /></el-icon>
    <span>{{ item.label }}</span>
  </template>
  <el-menu-item class="child-menu"
    v-for="child in item.children"
    :key="child.route"
    :index="child.route"
  >
    {{ child.label }}
  </el-menu-item>
</el-sub-menu>
    </el-menu>


  </el-aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter} from 'vue-router'
import { Odometer, DataAnalysis, Document, ChatLineRound, User } from '@element-plus/icons-vue'

const router = useRouter()

const menuItems = [
  {
    index: 0,
    label: '监控大屏',
    icon: Odometer,
    route: '/'
  },
  {
    index: 1,
    label: '历史数据',
    icon: DataAnalysis,
    route: '/history'
  },
  {
    index: 2,
    label: '诊断任务',
    icon: Document,
    route: '/diagnosis'
  },
  {
    index: 3,
    label: '智能问答',
    icon: ChatLineRound,
    route: '/chatqa'
  },
  {
    index: 4,
    label: '用户管理',
    icon: User,
    route: null,
    children: [
      { label: '权限管理', route: '/permission' },
      { label: '异常规则', route: '/exception' },
      { label: '知识库管理', route: '/knowledge' }
    ]
  },
]
//路由跳转
const handleMenuSelect = (route: string) => {
  router.push(route)
}
//根据当前路由确定激活的菜单项
const activeMenu = computed(() => router.currentRoute.value.path)


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
/* 遗留问题：这里子菜单样式背景色搞不定 */
.sidebar-menu {
  background-color: transparent;
  border: none;
  margin-bottom: 8px;
}

.sidebar-menu :deep(.el-menu-item .el-sub-menu ) {
  color: #606266;
  background-color: transparent;
  border-radius: 6px;
  margin-bottom: 4px;
  transition: all 0.3s;
}

.sidebar-menu :deep(.el-menu-item:hover .el-sub-menu) {
  background-color: rgba(74, 144, 226, 0.1);
  color: #4A90E2;
}

.sidebar-menu :deep(.el-menu-item.is-active .el-sub-menu.is-active) {
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
