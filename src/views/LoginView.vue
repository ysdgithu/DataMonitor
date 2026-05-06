<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1>DataMonitor</h1>
        <p>实时数据监控平台</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin" class="login-form">
        <!-- 用户名输入框 -->
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" prefix-icon="User" clearable
            @keyup.enter="handleLogin" />
        </el-form-item>

        <!-- 密码输入框 -->
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password
            clearable @keyup.enter="handleLogin" />
        </el-form-item>

        <!-- 记住我和忘记密码 -->
        <div class="login-options">
          <el-checkbox v-model="form.rememberMe">记住我</el-checkbox>
          <el-link type="primary" href="#">忘记密码？</el-link>
        </div>

        <!-- 登录按钮 -->
        <el-form-item>
          <el-button type="primary" class="login-button" :loading="authStore.loading" @click="handleLogin">
            {{ authStore.loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>

        <!-- 错误提示 -->
        <el-alert v-if="authStore.error" :title="authStore.error" type="error" :closable="true"
          @close="authStore.clearError" class="login-error" />
      </el-form>

      <!-- 注册链接 -->
      <div class="login-footer">
        <span>还没有账号？</span>
        <el-link type="primary" @click="goToRegister">立即注册</el-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import type { LoginRequest } from '../utils/auth.types'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()

// 表单数据
const form = reactive<LoginRequest>({
  username: '',
  password: '',
  rememberMe: false
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    // { min: 8, message: '密码长度至少 8 个字符', trigger: 'blur' }
  ]
}

/**
 * 处理登录
 */
async function handleLogin() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    // 调用登录接口
    await authStore.login(form)

    ElMessage.success('登录成功')

    // 跳转到主页
    router.push({ name: 'home' })
  } catch (error) {
    // 错误已在 store 中处理
    console.error('Login error:', error)
  }
}

/**
 * 跳转到注册页面
 */
function goToRegister() {
  router.push({ name: 'register' })
}

/**
 * 页面挂载时检查是否已登录
 */
onMounted(() => {
  // 如果已登录，直接跳转到主页
  if (authStore.isAuthenticated) {
    router.push({ name: 'home' })
  }
})
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 24px;
  background:
    radial-gradient(circle at top, rgba(79, 124, 255, 0.08), transparent 34%),
    linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.login-box {
  width: 100%;
  max-width: 420px;
  padding: 28px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  box-shadow: 0 18px 48px rgba(31, 45, 61, 0.08);
  backdrop-filter: none;
}

.login-header {
  text-align: left;
  margin-bottom: 22px;
}

.login-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: #182235;
}

.login-header p {
  margin: 8px 0 0 0;
  font-size: 13px;
  color: #6f7d92;
  line-height: 1.6;
}

.login-form {
  margin-bottom: 16px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.login-form :deep(.el-input__wrapper) {
  min-height: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.12);
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: inset 0 0 0 1px rgba(79, 124, 255, 0.28), 0 0 0 3px rgba(79, 124, 255, 0.08);
}

.login-form :deep(.el-input__inner) {
  color: #1b2740;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 2px 0 16px;
  font-size: 13px;
}

.login-options :deep(.el-checkbox__label),
.login-options :deep(.el-link) {
  color: #516079;
}

.login-button {
  width: 100%;
  height: 44px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 14px;
  background: rgba(79, 124, 255, 0.12);
  border-color: rgba(79, 124, 255, 0.22);
  color: #1f3356;
  box-shadow: none;
}

.login-button:hover,
.login-button:focus {
  background: rgba(79, 124, 255, 0.16);
  border-color: rgba(79, 124, 255, 0.28);
  color: #1f3356;
}

.login-error {
  margin-bottom: 14px;
}

.login-footer {
  text-align: center;
  font-size: 13px;
  color: #6f7d92;
  margin-top: 16px;
}

.login-footer :deep(.el-link) {
  margin-left: 6px;
}

@media (max-width: 600px) {
  .login-container {
    padding: 16px;
    align-items: flex-start;
  }

  .login-box {
    margin-top: 24px;
    padding: 22px 18px;
    border-radius: 18px;
  }

  .login-header h1 {
    font-size: 24px;
  }

  .login-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
