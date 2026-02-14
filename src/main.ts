import './assets/main.css'
import './assets/base.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import commonComponents from './components/common'

// 打印环境变量配置（开发环境）
if (import.meta.env.DEV) {
  console.log('=== 环境配置信息 ===')
  console.log('模式:', import.meta.env.MODE)
  console.log('开发环境:', import.meta.env.DEV)
  console.log('生产环境:', import.meta.env.PROD)
  console.log('WebSocket URL:', import.meta.env.VITE_WS_URL)
  console.log('API URL:', import.meta.env.VITE_API_URL)
  console.log('==================')
}

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)

// 初始化认证状态
const authStore = useAuthStore()
authStore.initializeAuth()

app.use(router)
app.use(ElementPlus)
// 全局注册所有公用组件
Object.entries(commonComponents).forEach(([name, component]) => {
  app.component(name, component)
})
app.mount('#app')
