<template>
  <main-layout>
    <div>
      <div class="background user">
        <h2 class="title">用户权限管理</h2>
        <!-- 权限分配表格 -->
        <el-table :data="permissionList" style="width: 100%">
          <el-table-column prop="username" label="用户名" width="180" />
          <el-table-column prop="role" label="角色" width="180" />
          <el-table-column label="权限变更">
            <template #default="scope">
              <el-select v-model="scope.row.role" size="small" style="width: 120px;"
                @change="updateUserRole(scope.row)">
                <el-option label="普通用户" value="1" />
                <el-option label="管理员" value="0" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="role" label="操作" width="180">
            <template #default="scope">
              <el-button size="small" type="danger" @click="deleteUser(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="background permission">
        <h2 class="title">权限范围配置</h2>
        <!-- 权限范围配置列表 -->
        <table class="permission-table">
          <thead>
            <tr>
              <th>权限</th>
              <th>普通用户</th>
              <th>管理员</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="category in permissionConfig" :key="category.category">
              <!-- 分类标题行 -->
              <tr class="category-title">
                <td class="title" style="border: 0px;">{{ category.category }}</td>
                <td></td>
                <td></td>
              </tr>
              <!-- 该分类下的权限项 -->
              <tr v-for="item in category.items" :key="item.key" class="category-item">
                <td>
                  <p>{{ item.name }}</p>
                  <p>{{ item.desc }}</p>
                </td>
                <td></td>
                <td>
                  <el-checkbox v-model="permissions.user[item.key]" />
                  <el-checkbox v-model="permissions.admin[item.key]" />
                </td>
              </tr>
            </template>
          </tbody>

        </table>
      </div>
    </div>
  </main-layout>
</template>
<script setup lang="ts">
import MainLayout from '../components/layout/MainLayout.vue'
import { ref } from 'vue'
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
const roleMap = {
  0: '管理员',
  1: '普通用户'
}
//映射处理
const permissionList = permissionData.map(item => {
  return {
    ...item,
    role: roleMap[item.role]
  }
})
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

/* 权限分配表格样式 */
.permission-table {
  width: 100%;
}

.checkbox-cell {
  text-align: center;
}

.category-item p:first-child {
  color: var(--text-secondary);
}

.category-item p:last-child {
  color: var(--text-disabled);
}

.table-title {
  font-weight: bold;
  font-size: var(--font-sm);
}
</style>
