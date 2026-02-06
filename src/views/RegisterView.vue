<template>
  <div class="register-container">
    <div class="register-box">
      <div class="register-header">
        <h1>创建账号</h1>
        <p>加入 DataMonitor 实时监控平台</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        @submit.prevent="handleRegister"
        class="register-form"
      >
        <!-- 用户名输入框 -->
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名（3-50字符）"
            prefix-icon="User"
            clearable
          />
        </el-form-item>

        <!-- 邮箱输入框 -->
        <el-form-item prop="email">
          <el-input
            v-model="form.email"
            type="email"
            placeholder="请输入邮箱地址（可选）"
            prefix-icon="Message"
            clearable
          />
        </el-form-item>

        <!-- 密码输入框 -->
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码（至少8字符，包含大小写和数字）"
            prefix-icon="Lock"
            show-password
            clearable
            @input="validatePasswordStrength"
          />
          <!-- 密码强度提示 -->
          <div v-if="form.password" class="password-strength">
            <div class="strength-bar">
              <div
                class="strength-fill"
                :class="`strength-${passwordStrength}`"
                :style="{ width: strengthPercentage + '%' }"
              />
            </div>
            <span class="strength-text" :class="`strength-${passwordStrength}`">
              {{ strengthText }}
            </span>
          </div>
        </el-form-item>

        <!-- 确认密码输入框 -->
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleRegister"
          />
        </el-form-item>

        <!-- 注册按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            class="register-button"
            :loading="authStore.loading"
            @click="handleRegister"
          >
            {{ authStore.loading ? '注册中...' : '注册' }}
          </el-button>
        </el-form-item>

        <!-- 错误提示 -->
        <el-alert
          v-if="authStore.error"
          :title="authStore.error"
          type="error"
          :closable="true"
          @close="authStore.clearError"
          class="register-error"
        />
      </el-form>

      <!-- 登录链接 -->
      <div class="register-footer">
        <span>已有账号？</span>
        <el-link type="primary" @click="goToLogin">立即登录</el-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import type { RegisterRequest } from '../utils/auth.types'
import { PasswordStrength } from '../utils/auth.types'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()

// 表单数据
const form = reactive<RegisterRequest & { confirmPassword: string }>({
  username: '',
  password: '',
  confirmPassword: '',
  email: ''
})

// 密码强度
const passwordStrength = ref<PasswordStrength>(PasswordStrength.WEAK)

// 密码强度计算
const strengthPercentage = computed(() => {
  const strengthMap = { [PasswordStrength.WEAK]: 33, [PasswordStrength.MEDIUM]: 66, [PasswordStrength.STRONG]: 100 }
  return strengthMap[passwordStrength.value]
})

const strengthText = computed(() => {
  const textMap = { [PasswordStrength.WEAK]: '弱', [PasswordStrength.MEDIUM]: '中', [PasswordStrength.STRONG]: '强' }
  return `密码强度: ${textMap[passwordStrength.value]}`
})

/**
 * 验证密码强度
 */
function validatePasswordStrength() {
  const password = form.password
  let strength: PasswordStrength = PasswordStrength.WEAK

  if (password.length >= 8) {
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)

    if (hasUpperCase && hasLowerCase && hasNumber) {
      strength = PasswordStrength.STRONG
    } else if ((hasUpperCase || hasLowerCase) && hasNumber) {
      strength = PasswordStrength.MEDIUM
    }
  }

  passwordStrength.value = strength
}

/**
 * 自定义验证器：确认密码
 */
const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

/**
 * 自定义验证器：密码强度
 */
const validatePasswordStrengthRule = (rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else if (value.length < 8) {
    // callback(new Error('密码长度至少 8 个字符'))
  } else if (!/[A-Z]/.test(value)) {
    callback(new Error('密码必须包含大写字母'))
  } else if (!/[a-z]/.test(value)) {
    callback(new Error('密码必须包含小写字母'))
  } else if (!/[0-9]/.test(value)) {
    callback(new Error('密码必须包含数字'))
  } else {
    callback()
  }
}

/**
 * 自定义验证器：用户名
 */
const validateUsernameRule = (rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请输入用户名'))
  } else if (value.length < 3 || value.length > 50) {
    callback(new Error('用户名长度在 3 到 50 个字符之间'))
  } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    callback(new Error('用户名只能包含字母、数字和下划线'))
  } else {
    callback()
  }
}

// 表单验证规则
const rules = {
  username: [{ validator: validateUsernameRule, trigger: 'blur' }],
  email: [
    {
      type: 'email',
      message: '请输入正确的邮箱地址',
      trigger: 'blur'
    }
  ],
  password: [{ validator: validatePasswordStrengthRule, trigger: 'blur' }],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }]
}

/**
 * 处理注册
 */
async function handleRegister() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    // 调用注册接口
    await authStore.register(form)

    ElMessage.success('注册成功，正在跳转...')

    // 跳转到主页
    setTimeout(() => {
      router.push({ name: 'home' })
    }, 1000)
  } catch (error) {
    // 错误已在 store 中处理
    console.error('Register error:', error)
  }
}

/**
 * 跳转到登录页面
 */
function goToLogin() {
  router.push({ name: 'login' })
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.register-box {
  width: 100%;
  max-width: 450px;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.register-header p {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: #999;
}

.register-form {
  margin-bottom: 20px;
}

.register-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

/* 全局已使用浅色主题，无需额外覆盖 */

.password-strength {
  margin-top: 8px;
  font-size: 12px;
}

.strength-bar {
  height: 4px;
  background-color: #e4e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
}

.strength-fill.strength-weak {
  background-color: #f56c6c;
}

.strength-fill.strength-medium {
  background-color: #e6a23c;
}

.strength-fill.strength-strong {
  background-color: #67c23a;
}

.strength-text {
  display: inline-block;
}

.strength-text.strength-weak {
  color: #f56c6c;
}

.strength-text.strength-medium {
  color: #e6a23c;
}

.strength-text.strength-strong {
  color: #67c23a;
}

.register-button {
  width: 100%;
  height: 40px;
  font-size: 16px;
  font-weight: 500;
}

.register-error {
  margin-bottom: 20px;
}

.register-footer {
  text-align: center;
  font-size: 14px;
  color: #666;
}

.register-footer :deep(.el-link) {
  margin-left: 5px;
}

/* 响应式设计 */
@media (max-width: 600px) {
  .register-box {
    margin: 20px;
    padding: 30px 20px;
  }

  .register-header h1 {
    font-size: 24px;
  }
}
</style>

