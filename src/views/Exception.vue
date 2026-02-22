<template>
  <main-layout>
    <!-- 筛选区 -->
    <div class="filter-section background">
      <h3 class="title">异常规则管理</h3>
      <div style="display: flex; justify-content: space-between;">
        <ul class="filter-list">
          <li v-for="item in deviceOptions" :key="item.value" class="filter-item">
            <el-icon>
              <Filter />
            </el-icon>
            <p>{{ item.label }}</p>
          </li>
        </ul>
        <el-button type="primary">新增</el-button>
      </div>
      <search-input :placeholder="'搜索规则名称'" />
    </div>
    <!-- 规则总表 -->
    <div class="background exception-table">
      <DataTable :data="exceptionList" :columns="columns" />
    </div>

  </main-layout>
</template>

<script setup lang="ts">
import MainLayout from '../components/layout/MainLayout.vue'
import DataTable from '../components/common/DataTable/index.vue'
import type { Column } from '../components/common/DataTable/types'
import { Filter, MilkTea, Search } from '@element-plus/icons-vue'
import { ref, h } from 'vue'
// 规则总表数据
const exceptionList = ref<ExceptionRule[]>([
  {
    name: '温度偏离规则',
    device: 'mixer', //调配罐
    condition: '温度偏离设定值±2℃持续5分钟',
    parameter: 'temperature',
    conditionType: 'duration',
    conditionValue: '±2℃',
    duration: '5分钟',
    triggerCondition: '> 设定值+2℃ 或 < 设定值-2℃'
  },
  {
    name: '液位异常规则',
    device: 'mixer', //调配罐
    condition: '液位在"应进料"时段无变化（泵故障）',
    parameter: 'level',
    conditionType: 'duration',
    conditionValue: '无变化',
    duration: '应进料时段',
    triggerCondition: '液位变化率 = 0'
  },
  {
    name: '灌装精度规则',
    device: 'filler', //灌装机
    condition: '连续10瓶灌装量误差超过±5ml',
    parameter: 'fill_accuracy',
    conditionType: 'count',
    conditionValue: '±5ml',
    count: '10瓶',
    triggerCondition: '灌装量误差 > 5ml 或 < -5ml'
  },
  {
    name: '灌装速度规则',
    device: 'filler', //灌装机
    condition: '灌装速度低于额定值80%持续1分钟',
    parameter: 'fill_speed',
    conditionType: 'duration',
    conditionValue: '80%',
    duration: '1分钟',
    triggerCondition: '实际速度 < 额定速度 × 80%'
  },
  {
    name: '旋盖扭矩规则',
    device: 'capper', //封盖机
    condition: '旋盖扭矩低于下限（漏液风险）或高于上限（损坏瓶口）',
    parameter: 'torque',
    conditionType: 'threshold',
    conditionValue: '下限/上限',
    triggerCondition: '扭矩 < 1.5N·m 或 > 2.2N·m'
  },
  {
    name: '缺盖报警规则',
    device: 'capper', //封盖机
    condition: '单位时间缺盖报警次数超标',
    parameter: 'cap_missing',
    conditionType: 'count',
    conditionValue: '超标',
    count: '单位时间内',
    triggerCondition: '缺盖报警次数 > 5次/分钟'
  },
  {
    name: '贴标位置规则',
    device: 'labeler', //贴标机
    condition: '贴标位置偏移连续报警',
    parameter: 'error_rate',
    conditionType: 'count',
    conditionValue: '偏移',
    count: '连续',
    triggerCondition: '贴偏率 > 2%'
  },
  {
    name: '标签余量规则',
    device: 'labeler', //贴标机
    condition: '标签余量低于10%',
    parameter: 'label_remain',
    conditionType: 'threshold',
    conditionValue: '10%',
    triggerCondition: '标签余量 < 10%'
  },
  {
    name: '抓取失败规则',
    device: 'packer', //包装机
    condition: '抓取失败次数在10分钟内超过3次',
    parameter: 'grab_success',
    conditionType: 'count',
    conditionValue: '3次',
    duration: '10分钟',
    triggerCondition: '抓取失败率 > 5%'
  },
  {
    name: '栈板库存规则',
    device: 'packer', //包装机
    condition: '栈板库存低于安全库存',
    parameter: 'pallet_remain',
    conditionType: 'threshold',
    conditionValue: '安全库存',
    triggerCondition: '栈板余量 < 安全库存阈值'
  }
]);
// 异常规则类型定义
interface ExceptionRule {
  name: string
  device: string
  condition: string
  parameter: string
  conditionType?: string
  conditionValue?: string
  duration?: string
  count?: string
  triggerCondition: string
}

// 表格列配置
const columns: Column[] = [
  {
    prop: 'name',
    label: '规则名称',
    width: 180,
    customRender: ({ row }: any) => h('div', [
      h('p', { style: 'font-weight: 600;' }, row.name),
      h('p', { style: 'color: var(--text-tertiary); font-size: 12px;' }, row.device)
    ])
  },
  {
    prop: 'condition',
    label: '规则条件',
    customRender: ({ row }: any) => h('div', [
      h('p', row.condition),
      h('p', { style: 'color: var(--text-tertiary); font-size: 12px;' }, `监控参数：${row.parameter} | 触发条件：${row.triggerCondition}`)
    ])
  },
  {
    prop: 'actions',
    label: '操作',
    width: 200,
    isActions: true,
    actions: [
      { label: '编辑', type: 'primary', onClick: (row: ExceptionRule) => console.log('编辑', row) },
      { label: '删除', type: 'danger', onClick: (row: ExceptionRule) => console.log('删除', row) }
    ]
  }
]

// 设备配置项
const deviceOptions = [
  { label: '全部设备', value: 'mixer', icon: 'MilkTea' },
  { label: '调配罐', value: 'mixer', icon: 'MilkTea' },
  { label: '灌装机', value: 'filler', icon: 'MilkTea' },
  { label: '封盖机', value: 'capper', icon: 'MilkTea' },
  { label: '贴标机', value: 'labeler', icon: 'MilkTea' },
  { label: '包装机', value: 'packer', icon: 'MilkTea' }
]
</script>

<style scoped>
.filter-section {
  height: 150px;

}

.filter-list {
  display: flex;
  margin-bottom: var(--spacing-sm);
  padding: 0px;
}

.filter-item {
  display: flex;
  gap: var(--spacing-xs);
  height: 40px;
  margin-right: var(--spacing-xs);
  padding: var(--spacing-sm);
  border: 1px solid var(--border-light);
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-base);
}
</style>
