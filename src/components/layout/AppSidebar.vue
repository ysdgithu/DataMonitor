<template>
  <aside class="app-sidebar">
    <div class="sidebar-brand">
      <div class="brand-mark">DM</div>
      <div>
        <div class="brand-title">IoT 监控中心</div>
        <div class="brand-subtitle">实时态势与告警</div>
      </div>
    </div>

    <el-menu :default-active="activeMenu" class="sidebar-menu" @select="handleMenuSelect">
      <el-menu-item v-for="item in menuItems.filter(i => !i.children)" :key="item.index" :index="item.route">
        <el-icon>
          <component :is="item.icon" />
        </el-icon>
        <span>{{ item.label }}</span>
      </el-menu-item>
      <el-sub-menu v-for="item in menuItems.filter(i => i.children)" :key="item.index"
        :index="item.route || String(item.index)">
        <template #title>
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.label }}</span>
        </template>
        <el-menu-item class="child-menu" v-for="child in item.children" :key="child.route" :index="child.route">
          {{ child.label }}
        </el-menu-item>
      </el-sub-menu>
    </el-menu>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
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
  width: 260px;
  height: 100vh;
  padding: 18px 12px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow: hidden;
  background: transparent;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  border-radius: 18px;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #4f7cff, #67d39d);
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.brand-title {
  color: #172033;
  font-size: 15px;
  font-weight: 700;
}

.brand-subtitle {
  margin-top: 4px;
  color: #6f7d92;
  font-size: 12px;
}

.sidebar-menu {
  flex: 1;
  background-color: transparent;
  border: none;
  overflow: auto;
}

.sidebar-menu :deep(.el-menu-item),
.sidebar-menu :deep(.el-sub-menu__title) {
  height: 46px;
  line-height: 46px;
  margin-bottom: 8px;
  border-radius: 14px;
  color: #516079;
  background: transparent;
  border: 0;
  transition: color 0.2s ease, opacity 0.2s ease;
}

.sidebar-menu :deep(.el-menu-item:hover),
.sidebar-menu :deep(.el-sub-menu__title:hover) {
  background: transparent;
  color: #2f4368;
  opacity: 0.9;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: transparent;
  color: #1f3356;
  font-weight: 600;
  box-shadow: none;
}

.sidebar-menu :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  background: transparent;
  color: #1f3356;
}

.sidebar-menu :deep(.el-sub-menu .el-menu) {
  background: transparent;
}

.sidebar-menu :deep(.el-sub-menu .el-menu-item) {
  margin-left: 10px;
  font-size: 13px;
}

.sidebar-menu :deep(.el-icon) {
  color: inherit;
}
</style>
