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
  background-color: #F5F7FA;
  overflow-y: auto;
}

/* 滚动条美化 */
.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: #F0F2F5;
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb {
  background: #C0C4CC;
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: #909399;
}
</style>

