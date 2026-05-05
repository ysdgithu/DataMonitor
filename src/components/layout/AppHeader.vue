<template>
  <div class="app-header">
    <div class="header-inner">
      <div class="header-left">
        <div class="header-title-group">
          <div class="header-kicker">工业态势总览</div>
          <div class="title-h1">IoT设备监控中心</div>
        </div>
      </div>
      <div class="header-right">
        <el-badge :value="3" class="notification">
          <el-icon>
            <Bell />
          </el-icon>
        </el-badge>
        <el-dropdown>
          <span class="user-info">
            <span class="user-avatar">管</span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Bell } from '@element-plus/icons-vue'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const logout = () => {
  router.push('/login')
  authStore.logout()
}
</script>


<style scoped>
.app-header {
  background: transparent;
  padding: 16px 24px 12px;
}

.header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 64px;
  padding: 0 2px 0 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  backdrop-filter: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-kicker {
  color: #6b7a90;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.title-h1 {
  font-size: 18px;
  font-weight: 700;
  color: #182235;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.notification {
  cursor: pointer;
}

.notification :deep(.el-badge__content) {
  border: 0;
  box-shadow: 0 8px 18px rgba(79, 124, 255, 0.18);
}

.user-info {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: #334155;
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #4f7cff, #67d39d);
  color: #fff;
  font-weight: 700;
  font-size: 13px;
}
</style>
