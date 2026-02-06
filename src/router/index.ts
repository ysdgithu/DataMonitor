import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DiagnosisView from '../views/DiagnosisView.vue'
import HistoryDataView from '../views/HistoryData.vue';
import ChatQAView from '../views/ChatQA.vue';
import PermissionView from '../views/Permission.vue';
import { useAuthStore } from '../stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      requiresAuth: false,
      title: '登录 - DataMonitor'
    }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: {
      requiresAuth: false,
      title: '注册 - DataMonitor'
    }
  },
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      requiresAuth: true,
      title: 'DataMonitor - 实时数据监控平台'
    }
  },
   {
    path: '/history',
    name: 'history',
    component: HistoryDataView,
    meta: {
      requiresAuth: true,
      title: '历史数据总览'
    }
  },
   {
    path: '/chatqa',
    name: 'chatqa',
    component: ChatQAView,
    meta: {
      requiresAuth: true,
      title: '智能问答'
    }
  },
   {
    path: '/permission',
    name: 'permission',
    component: PermissionView,
    meta: {
      requiresAuth: true,
      title: '权限管理'
    }
  },
  {
    path: '/diagnosis',
    name: 'diagnosis',
    component: DiagnosisView,
    meta: {
      requiresAuth: true,
      title: '诊断任务管理 - DataMonitor'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

/**
 * 路由守卫：检查认证状态
 */
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // 初始化认证状态（从 localStorage 恢复）
  if (!authStore.isAuthenticated && !authStore.user) {
    authStore.initializeAuth()
  }

  const requiresAuth = to.meta.requiresAuth as boolean | undefined

  // 如果路由需要认证
  if (requiresAuth) {
    if (authStore.isAuthenticated) {
      // 已登录，允许访问
      next()
    } else {
      // 未登录，重定向到登录页
      next({ name: 'login', query: { redirect: to.fullPath } })
    }
  } else {
    // 路由不需要认证
    if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
      // 已登录用户访问登录/注册页，重定向到主页
      next({ name: 'home' })
    } else {
      // 允许访问
      next()
    }
  }
})

/**
 * 路由后置钩子：更新页面标题
 */
router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  if (title) {
    document.title = title
  }
})

export default router
