<template>
  <div class="history-data-panel">
    <el-card class="panel-card">
      <template #header>
        <div class="card-header">
          <span>历史数据查询</span>
          <el-button 
            type="primary" 
            size="small" 
            @click="refreshData"
            :loading="loading"
          >
            刷新数据
          </el-button>
        </div>
      </template>

      <!-- 查询条件 -->
      <div class="query-controls">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-select v-model="queryParams.dataType" placeholder="选择数据类型" @change="onDataTypeChange">
              <el-option label="核心指标" value="coreMetrics" />
              <el-option label="环境数据" value="environment" />
              <el-option label="设备状态" value="deviceStatus" />
              <el-option label="通信数据" value="telemetry" />
            </el-select>
          </el-col>
          
          <el-col :span="6" v-if="queryParams.dataType">
            <el-select v-model="queryParams.category" placeholder="选择具体类型">
              <el-option 
                v-for="option in categoryOptions" 
                :key="option.value"
                :label="option.label" 
                :value="option.value" 
              />
            </el-select>
          </el-col>

          <el-col :span="6">
            <el-select v-model="queryParams.timeRange" placeholder="选择时间范围" @change="onTimeRangeChange">
              <el-option 
                v-for="option in timeRangeOptions" 
                :key="option.value"
                :label="option.label" 
                :value="option.value" 
              />
            </el-select>
          </el-col>

          <el-col :span="6">
            <el-button type="primary" @click="queryData" :loading="loading">
              查询
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 连接状态 -->
      <div class="connection-status">
        <el-tag :type="connectionStatus ? 'success' : 'danger'" size="small">
          {{ connectionStatus ? 'API连接正常' : 'API连接失败' }}
        </el-tag>
        <span class="status-text">
          最后更新: {{ lastUpdateTime }}
        </span>
      </div>

      <!-- 数据展示 -->
      <div class="data-display" v-if="chartData.length > 0">
        <div class="chart-container">
          <div ref="chartRef" style="width: 100%; height: 400px;"></div>
        </div>
        
        <!-- 数据表格 -->
        <el-table :data="tableData" style="width: 100%; margin-top: 20px;" max-height="300">
          <el-table-column prop="time" label="时间" width="180" />
          <el-table-column prop="value" label="数值" width="120">
            <template #default="scope">
              {{ typeof scope.row.value === 'number' ? scope.row.value.toFixed(2) : scope.row.value }}
              {{ scope.row.unit || '' }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag 
                :type="getStatusType(scope.row.status)" 
                size="small"
              >
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="deviceId" label="设备ID" />
        </el-table>
      </div>

      <!-- 无数据提示 -->
      <div v-else-if="!loading" class="no-data">
        <el-empty description="暂无历史数据" />
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-loading-directive />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import { historyApi, TIME_RANGE_OPTIONS, DATA_TYPE_OPTIONS, type QueryParams } from '@/utils/historyApi';

// 响应式数据
const loading = ref(false);
const connectionStatus = ref(false);
const lastUpdateTime = ref('');
const chartData = ref<any[]>([]);
const tableData = ref<any[]>([]);
const chartRef = ref<HTMLElement>();
let chartInstance: echarts.ECharts | null = null;

// 查询参数
const queryParams = reactive({
  dataType: 'coreMetrics',
  category: 'cpu',
  timeRange: 24,
  startTime: 0,
  endTime: 0
});

// 时间范围选项
const timeRangeOptions = TIME_RANGE_OPTIONS;

// 类型选项
const categoryOptions = computed(() => {
  return DATA_TYPE_OPTIONS[queryParams.dataType as keyof typeof DATA_TYPE_OPTIONS] || [];
});

// 初始化图表
const initChart = () => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value);
  }
};

// 更新图表
const updateChart = () => {
  if (!chartInstance || chartData.value.length === 0) return;

  const option = {
    title: {
      text: `${getCategoryLabel()} 历史趋势`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0];
        return `
          时间: ${data.name}<br/>
          数值: ${data.value}${chartData.value[0]?.unit || ''}<br/>
          状态: ${getStatusText(chartData.value[data.dataIndex]?.status)}
        `;
      }
    },
    xAxis: {
      type: 'category',
      data: chartData.value.map(item => item.time)
    },
    yAxis: {
      type: 'value',
      name: getCategoryLabel()
    },
    series: [{
      data: chartData.value.map(item => item.value),
      type: 'line',
      smooth: true,
      itemStyle: {
        color: (params: any) => {
          const status = chartData.value[params.dataIndex]?.status;
          return status === 'error' ? '#F56C6C' : 
                 status === 'warning' ? '#E6A23C' : '#67C23A';
        }
      }
    }]
  };

  chartInstance.setOption(option);
};

// 获取类型标签
const getCategoryLabel = () => {
  const options = categoryOptions.value;
  const option = options.find(opt => opt.value === queryParams.category);
  return option?.label || '';
};

// 获取状态类型
const getStatusType = (status: string) => {
  switch (status) {
    case 'error': return 'danger';
    case 'warning': return 'warning';
    case 'normal': return 'success';
    default: return 'info';
  }
};

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'error': return '错误';
    case 'warning': return '警告';
    case 'normal': return '正常';
    default: return '未知';
  }
};

// 数据类型变化
const onDataTypeChange = () => {
  const options = categoryOptions.value;
  if (options.length > 0) {
    queryParams.category = options[0].value;
  }
};

// 时间范围变化
const onTimeRangeChange = () => {
  const now = Date.now();
  queryParams.endTime = now;
  queryParams.startTime = now - (queryParams.timeRange * 60 * 60 * 1000);
};

// 查询数据
const queryData = async () => {
  loading.value = true;
  try {
    onTimeRangeChange();
    
    let data: any[] = [];
    
    switch (queryParams.dataType) {
      case 'coreMetrics':
        data = await historyApi.getCoreMetricsTrend(queryParams.category, queryParams.timeRange);
        break;
      case 'environment':
        data = await historyApi.getEnvironmentTrend(queryParams.category, queryParams.timeRange);
        break;
      case 'telemetry':
        data = await historyApi.getTelemetryTrend(queryParams.category, queryParams.timeRange);
        break;
      default:
        ElMessage.warning('暂不支持该数据类型的历史查询');
        return;
    }

    chartData.value = data;
    tableData.value = data.map(item => ({
      ...item,
      time: new Date(item.timestamp).toLocaleString(),
      deviceId: getDeviceId()
    }));

    await nextTick();
    updateChart();
    
    lastUpdateTime.value = new Date().toLocaleTimeString();
    ElMessage.success(`查询到 ${data.length} 条历史数据`);
    
  } catch (error) {
    console.error('查询历史数据失败:', error);
    ElMessage.error('查询历史数据失败');
  } finally {
    loading.value = false;
  }
};

// 获取设备ID
const getDeviceId = () => {
  switch (queryParams.dataType) {
    case 'coreMetrics': return '000';
    case 'environment': return '001';
    case 'telemetry': return '002';
    default: return 'unknown';
  }
};

// 刷新数据
const refreshData = () => {
  if (queryParams.dataType && queryParams.category) {
    queryData();
  }
};

// 检查连接状态
const checkConnection = async () => {
  connectionStatus.value = await historyApi.checkConnection();
};

// 组件挂载
onMounted(async () => {
  await checkConnection();
  initChart();
  onTimeRangeChange();
  
  // 如果连接正常，自动查询一次数据
  if (connectionStatus.value) {
    await queryData();
  }
});
</script>

<style scoped>
.history-data-panel {
  width: 100%;
}

.panel-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.query-controls {
  margin-bottom: 20px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.status-text {
  font-size: 12px;
  color: #909399;
}

.data-display {
  margin-top: 20px;
}

.chart-container {
  margin-bottom: 20px;
}

.no-data {
  text-align: center;
  padding: 40px 0;
}

.loading-container {
  text-align: center;
  padding: 40px 0;
}
</style>
