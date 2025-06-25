<template>
  <el-header class="app-header" style=" color: #E5E7EB">
    <div class="header-left" >
      <!-- <img src="@/assets/logo.png" alt="Logo" class="logo" /> -->
      <h1 class="title" >IoT设备监控中心</h1>
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
import { ref } from 'vue'
import { Moon, Sunny, Bell } from '@element-plus/icons-vue'
const isDark = ref(false)
const toggleTheme = (val: boolean) => {
  // 实现主题切换逻辑
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
  gap: 12px;
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