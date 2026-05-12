import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DiagnosisView from '../views/DiagnosisView.vue'
import HistoryDataView from '../views/HistoryData.vue';
import ChatQAView from '../views/ChatQA.vue';
import PermissionView from '../views/Permission.vue';
import ExceptionView from '../views/Exception.vue';
import KnowledgeView from '../views/Knowledge.vue';
import DeviceManagementView from '../views/DeviceManagement.vue';
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: LoginView, meta: { requiresAuth: false, title: '登录 - DataMonitor' } },
  { path: '/register', name: 'register', component: RegisterView, meta: { requiresAuth: false, title: '注册 - DataMonitor' } },
  { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true, title: 'DataMonitor - 实时数据监控平台' } },
  { path: '/history', name: 'history', component: HistoryDataView, meta: { requiresAuth: true, title: '历史数据总览' } },
  { path: '/chatqa', name: 'chatqa', component: ChatQAView, meta: { requiresAuth: true, title: '智能问答' } },
  { path: '/permission', name: 'permission', component: PermissionView, meta: { requiresAuth: true, title: '权限管理', roles: ['admin'] } },
  { path: '/exception', name: 'exception', component: ExceptionView, meta: { requiresAuth: true, title: '异常规则', roles: ['admin', 'user'] } },
  { path: '/knowledge', name: 'knowledge', component: KnowledgeView, meta: { requiresAuth: true, title: '知识库管理', roles: ['admin'] } },
  { path: '/diagnosis', name: 'diagnosis', component: DiagnosisView, meta: { requiresAuth: true, title: '诊断任务管理 - DataMonitor' } },
  { path: '/devices', name: 'devices', component: DeviceManagementView, meta: { requiresAuth: true, title: '设备管理 - DataMonitor', roles: ['admin', 'user'] } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes })

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated && !authStore.user) authStore.initializeAuth()

  const requiresAuth = to.meta.requiresAuth as boolean | undefined
  const allowedRoles = to.meta.roles as Array<'admin' | 'user'> | undefined
  const currentRole = authStore.user?.role

  if (requiresAuth) {
    if (!authStore.isAuthenticated) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
    if (allowedRoles && currentRole && !allowedRoles.includes(currentRole)) {
      ElMessage.warning('无权限访问该页面，已返回首页')
      next({ name: 'home' })
      return
    }
    next()
    return
  }

  if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
    next({ name: 'home' })
  } else {
    next()
  }
})

router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  if (title) document.title = title
})

export default router
