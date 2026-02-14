<template>
  <el-header class="app-header" style="color: #303133;">
    <div class="header-left" >
      <div class="title-h1" >IoT设备监控中心</div>
    </div>
    <div class="header-right">
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
            <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
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
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const route = useRoute()
const router = useRouter()
// 当前激活的菜单项
const activeIndex = computed(() => route.path)

const logout =()=>{
  router.push('/login')
  authStore.logout()
}

</script>


<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
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
  color: #606266;
  border-bottom: 2px solid transparent;
  height: 60px;
  line-height: 60px;
  padding: 0 15px;
}

.header-menu :deep(.el-menu-item:hover) {
  background-color: rgba(74, 144, 226, 0.05);
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
  color: #606266;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
</style>
