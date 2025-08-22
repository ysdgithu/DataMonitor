<template>
  <el-header class="app-header" style=" color: #E5E7EB">
    <div class="header-left" >
      <!-- <img src="@/assets/logo.png" alt="Logo" class="logo" /> -->
      <h1 class="title" >IoT设备监控中心</h1>

      <!-- 导航菜单 -->
      <el-menu
        mode="horizontal"
        :default-active="activeIndex"
        class="header-menu"
        @select="handleSelect"
      >
        <el-menu-item index="/">
          <el-icon><Monitor /></el-icon>
          <span>监控中心</span>
        </el-menu-item>
        <el-menu-item index="/factory-map">
          <el-icon><Location /></el-icon>
          <span>工厂地图</span>
        </el-menu-item>
      </el-menu>
    </div>
    <div class="header-right">
      <!-- <el-switch
        v-model="isDark"
        class="theme-switch"
        inline-prompt
        :active-icon="Moon"
        :inactive-icon="Sunny"
        @change="toggleTheme"
      /> -->
      <el-badge :value="3" class="notification">
        <el-icon><Bell /></el-icon>
      </el-badge>
      <el-dropdown>
        <span class="user-info">
          <!-- <el-avatar :size="32" src="src\assets\玫瑰长诗-头像.jpg" />  -->
          <span >管理员</span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>个人设置</el-dropdown-item>
            <el-dropdown-item>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Moon, Sunny, Bell, Monitor, Location } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const isDark = ref(false)

// 当前激活的菜单项
const activeIndex = computed(() => route.path)

const toggleTheme = (val: boolean) => {
  // 实现主题切换逻辑
}

const handleSelect = (key: string) => {
  router.push(key)
}
</script>


<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  border-bottom: 1px solid #a4a3a3;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-menu {
  background: transparent;
  border: none;
}

.header-menu :deep(.el-menu-item) {
  color: #E5E7EB;
  border-bottom: 2px solid transparent;
  height: 60px;
  line-height: 60px;
  padding: 0 15px;
}

.header-menu :deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.1);
  color: #4A90E2;
}

.header-menu :deep(.el-menu-item.is-active) {
  color: #4A90E2;
  border-bottom-color: #4A90E2;
  background-color: rgba(74, 144, 226, 0.1);
}

.logo {
  height: 40px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.theme-switch {
  margin-right: 16px;
}

.notification {
  cursor: pointer;
}

.user-info {
  display: flex;
  color: #E5E7EB;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
</style>