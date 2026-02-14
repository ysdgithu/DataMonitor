<template>
  <el-header class="app-header" style="color: #303133;">
    <div class="header-left">
      <div class="title-h1">IoT设备监控中心</div>
    </div>
    <div class="header-right">
      <el-badge :value="3" class="notification">
        <el-icon>
          <Bell />
        </el-icon>
      </el-badge>
      <el-dropdown>
        <span class="user-info">
          <!-- <el-avatar :size="32" src="src\assets\玫瑰长诗-头像.jpg" />  -->
          <span>管理员</span>
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

const logout = () => {
  router.push('/login')
  authStore.logout()
}

</script>


<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--spacing-base);
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
}

.header-menu {
  background: transparent;
  border: none;
}

.header-menu :deep(.el-menu-item) {
  color: var(--text-secondary);
  border-bottom: 2px solid transparent;
  height: 60px;
  line-height: 60px;
  padding: 0 var(--spacing-sm);
}

.header-menu :deep(.el-menu-item:hover) {
  background-color: var(--primary-light);
  color: var(--primary);
}

.header-menu :deep(.el-menu-item.is-active) {
  color: var(--primary);
  border-bottom-color: var(--primary);
  background-color: var(--primary-light);
}

.logo {
  height: 40px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
}

.theme-switch {
  margin-right: var(--spacing-base);
}

.notification {
  cursor: pointer;
}

.user-info {
  display: flex;
  color: var(--text-secondary);
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
}
</style>
