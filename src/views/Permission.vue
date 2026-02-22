<template>
  <main-layout>
    <div>
      <div class="background user">
        <h2 class="title">用户权限管理</h2>
        <!-- 权限分配表格 -->
        <DataTable :data="permissionList" :columns="columns" />
      </div>
      <!-- 权限范围配置 - 卡片式 -->
      <div class="background permission-cards">
        <h2 class="section-title">权限范围配置</h2>
        <div class="cards-grid">
          <div v-for="category in permissionConfig" :key="category.category" class="permission-card">
            <!-- 卡片头部 -->
            <div class="card-header">
              <div class="header-icon">
                <el-icon><Folder /></el-icon>
              </div>
              <span class="header-title">{{ category.category }}</span>
            </div>
            <!-- 卡片内容 -->
            <div class="card-body">
              <div v-for="item in category.items" :key="item.key" class="permission-item">
                <div class="item-info">
                  <p class="item-name">{{ item.name }}</p>
                  <p class="item-desc">{{ item.desc }}</p>
                </div>
                <div class="item-actions">
                  <label class="checkbox-label">
                    <el-checkbox v-model="permissions.user[item.key]" />
                    <span>普通用户</span>
                  </label>
                  <label class="checkbox-label">
                    <el-checkbox v-model="permissions.admin[item.key]" />
                    <span>管理员</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main-layout>
</template>
<script setup lang="ts">
import MainLayout from '../components/layout/MainLayout.vue'
import DataTable from '../components/common/DataTable/index.vue'
import type { Column } from '../components/common/DataTable/types'
import { ElSelect, ElOption } from 'element-plus'
import { Folder } from '@element-plus/icons-vue'
import { ref, h } from 'vue'
// 权限分配表格数据
// 代号说明：0-管理员，1-普通用户
const permissionData = [
  {
    id: 1,
    username: 'admin',
    role: 0,
  },
  {
    id: 2,
    username: 'user1',
    role: 1,
  },
  {
    id: 3,
    username: 'user2',
    role: 1,
  }
]
//代号映射表
const roleMap: Record<number, string> = {
  0: '管理员',
  1: '普通用户'
}
//映射处理 - 保留原始 role 值用于下拉框绑定，同时添加 roleText 用于显示
const permissionList = permissionData.map(item => {
  return {
    ...item,
    roleText: roleMap[item.role]  // 中文显示用
  }
})

// 表格列配置
const columns: Column[] = [
  { prop: 'username', label: '用户名', width: 180 },
  { prop: 'roleText', label: '角色', width: 180 },
  {
    prop: 'role',
    label: '权限变更',
    customRender: ({ row }) => h(ElSelect, {
      modelValue: String(row.role),
      size: 'small',
      style: 'width: 120px',
      onChange: (val: string) => updateUserRole({ ...row, role: Number(val) })
    }, [
      h(ElOption, { label: '普通用户', value: '1' }),
      h(ElOption, { label: '管理员', value: '0' })
    ])
  },
  {
    prop: 'actions',
    label: '操作',
    width: 180,
    isActions: true,
    actions: [
      { label: '删除', type: 'danger', onClick: (row: any) => deleteUser(row) }
    ]
  }
]
//修改权限
const updateUserRole = (row: any) => {
  console.log('修改权限', row)
}
//删除用户
const deleteUser = (row: any) => {
  console.log('删除用户', row)
}
// 权限分布配置项
const permissionConfig = [
  {
    category: '监控大屏',
    items: [
      { name: '配置告警阈值', desc: '设置设备告警参数和阈值', key: 'configAlarm' }
    ]
  },
  {
    category: '告警处理',
    items: [
      { name: '处理告警', desc: '处理设备异常告警和故障', key: 'handleAlarm' }
    ]
  },
  {
    category: '数据分析',
    items: [
      { name: '多维度查询/导出报表', desc: '查询历史数据和导出分析报表', key: 'exportReport' }
    ]
  },
  {
    category: '异常任务',
    items: [
      { name: '查看/发起异常任务、AI一键分析', desc: '管理异常任务和使用AI诊断功能', key: 'manageTask' }
    ]
  },
  {
    category: '知识库管理',
    items: [
      { name: '维护故障知识库', desc: '管理RAG系统的故障知识库文档', key: 'maintainKnowledge' }
    ]
  },
  {
    category: '智能问答',
    items: [
      { name: '自然语言提问/查看个人问答历史', desc: '使用智能问答功能和查看历史记录', key: 'useQA' }
    ]
  },
  {
    category: '个人设置',
    items: [
      { name: '修改个人信息/查看个人权限', desc: '管理个人账户信息和查看权限', key: 'manageProfile' }
    ]
  },
  {
    category: '系统管理',
    items: [
      { name: '用户管理/角色权限配置/系统参数设置', desc: '管理系统用户、权限和全局配置', key: 'systemConfig' }
    ]
  }
]
// 权限状态配置项
const permissions = ref({
  user: {
    configAlarm: false,
    handleAlarm: true,
    exportReport: true,
    manageTask: false,
    maintainKnowledge: false,
    useQA: true,
    manageProfile: true,
    systemConfig: false
  },
  admin: {
    configAlarm: true,
    handleAlarm: true,
    exportReport: true,
    manageTask: true,
    maintainKnowledge: true,
    useQA: true,
    manageProfile: true,
    systemConfig: true
  }
})
</script>
<style scoped>
/* 公共样式 */
.title {
  font-size: var(--font-base);
  font-weight: bold;
  padding-bottom: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  border-bottom: 1px var(--border-base) solid;
}

.background {
  background-color: var(--bg-main);
  border-radius: var(--radius-base);
  padding: var(--spacing-sm);
  margin: var(--spacing-sm);
}

/* 权限卡片网格 */
.permission-cards {
  margin-top: var(--spacing-base);
}

.section-title {
  font-size: var(--font-base);
  font-weight: bold;
  padding-bottom: var(--spacing-sm);
  margin-bottom: var(--spacing-base);
  border-bottom: 1px solid var(--border-base);
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: var(--spacing-base);
}

/* 权限卡片 */
.permission-card {
  background-color: var(--bg-main);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: var(--shadow-light);
}

.permission-card:hover {
  box-shadow: var(--shadow-base);
  border-color: var(--primary-light);
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-base);
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--bg-secondary) 100%);
  border-bottom: 1px solid var(--border-light);
}

.header-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* background: var(--primary); */
  color: var(--primary);
  border-radius: var(--radius-sm);
  font-size: var(--font-lg);
}

.header-title {
  font-size: var(--font-base);
  font-weight: 600;
  color: var(--text-main);
}

/* 卡片内容 */
.card-body {
  padding: var(--spacing-sm);
}

.permission-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-base);
  border-radius: var(--radius-base);
  transition: background-color 0.2s;
}

.permission-item:hover {
  background-color: var(--bg-hover);
}

.permission-item:not(:last-child) {
  border-bottom: 1px solid var(--border-light);
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--text-main);
  margin: 0 0 4px 0;
}

.item-desc {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  margin: 0;
}

.item-actions {
  display: flex;
  gap: var(--spacing-base);
  flex-shrink: 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-sm);
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
}

.checkbox-label:hover {
  color: var(--primary);
}
</style>
