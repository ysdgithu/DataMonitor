<template>
  <el-container class="layout-container">
    <app-sidebar style="background-color: #F5F7FA; color: #303133;" />
    <el-container>
      <el-header style="background-color: #FFFFFF; border-bottom: 1px solid #EBEEF5;">
        <app-header />
      </el-header>
      <el-main class="main-content">
        <slot></slot>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
</script>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100%;
}

.main-content {
  padding: 0;
  background-color: var(--bg-secondary);
  overflow-y: auto;
}

/* 滚动条美化 */
.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: var(--bg-hover);
  border-radius: var(--radius-sm);
}

.main-content::-webkit-scrollbar-thumb {
  background: var(--border-dark);
  border-radius: var(--radius-sm);
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}
</style>
