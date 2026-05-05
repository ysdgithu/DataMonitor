<template>
  <el-container class="layout-container">
    <app-sidebar />
    <el-container class="content-shell">
      <app-header class="top-header" />
      <div class="header-divider"></div>
      <div class="breadcrumb-bar">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.label" :to="item.path">
            {{ item.label }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <el-main class="main-content">
        <slot></slot>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'

const route = useRoute()

const breadcrumbMap: Record<string, { label: string; path: string }> = {
  '/': { label: '监控大屏', path: '/' },
  '/history': { label: '历史数据', path: '/history' },
  '/diagnosis': { label: '诊断任务', path: '/diagnosis' },
  '/chatqa': { label: '智能问答', path: '/chatqa' },
  '/permission': { label: '权限管理', path: '/permission' },
  '/exception': { label: '异常规则', path: '/exception' },
  '/knowledge': { label: '知识库管理', path: '/knowledge' }
}

const breadcrumbs = computed(() => {
  const current = breadcrumbMap[route.path] || { label: '页面', path: '' }
  return [{ label: '首页', path: '/' }, current].filter((item, index, arr) => item.path || index === arr.length - 1)
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100%;
  background: transparent;
  position: relative;
  z-index: 1;
}

.content-shell {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: transparent;
}

.top-header {
  flex: none;
}

.header-divider {
  margin: 0 24px;
  height: 1px;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0), rgba(148, 163, 184, 0.28), rgba(148, 163, 184, 0));
}

.breadcrumb-bar {
  padding: 10px 24px 0;
  background: transparent;
}

.main-content {
  padding: 12px 24px 24px;
  background-color: transparent;
  overflow-y: auto;
  position: relative;
}

.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: rgba(148, 163, 184, 0.12);
  border-radius: 999px;
}

.main-content::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.38);
  border-radius: 999px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: rgba(79, 124, 255, 0.5);
}
</style>
