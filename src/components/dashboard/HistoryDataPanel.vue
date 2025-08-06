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
            <el-select v-model="queryParams.dataType" placeholder="选择数据类型" @change="queryData()">
              <el-option label="核心指标" value="coreMetrics" />
              <el-option label="环境数据" value="environment" />
              <el-option label="设备状态" value="deviceStatus" />
              <el-option label="通信数据" value="telemetry" />
            </el-select>
          </el-col>
          
          <el-col :span="6" v-if="queryParams.dataType">
            <el-select v-model="queryParams.category" placeholder="选择具体类型" @change="queryData()">
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
        <el-tag :type="initializing ? 'info' : (connectionStatus ? 'success' : 'danger')" size="small">
          {{ initializing ? '正在连接...' : (connectionStatus ? 'API连接正常' : 'API连接失败') }}
        </el-tag>
        <span class="status-text">
          最后更新: {{ lastUpdateTime }}
        </span>
      </div>

      <!-- 数据展示 -->
      <div class="data-display" v-if="tableData.length > 0">
        <!-- 数据表格 -->
        <el-table :data="tableData" style="width: 100%; margin-top: 20px; padding: 5px 10px;" max-height="300">
          <el-table-column prop="time" label="时间" />
          <el-table-column prop="category" label="类型" />
          <el-table-column prop="value" label="数值">
            <template #default="scope">
              {{ typeof scope.row.value === 'number' ? scope.row.value.toFixed(2) : scope.row.value }}
              {{ scope.row.unit || '' }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" >
            <template #default="scope">
              <el-tag 
                :type="getStatusType(scope.row.status)" 
                size="small"
              >
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <!-- <el-table-column prop="deviceId" label="设备ID" /> -->
        </el-table>
      </div>

      <!-- 无数据提示 -->
      <!-- <div v-else-if="!loading" class="no-data">
        <el-empty description="暂无历史数据" />
      </div> -->

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
import { historyApi, TIME_RANGE_OPTIONS, DATA_TYPE_OPTIONS, type QueryParams } from '@/utils/historyApi';
// 后期考虑写个防抖处理

// 响应式数据
const loading = ref(false);
const initializing = ref(true); // 添加初始化状态
const connectionStatus = ref(false);
const lastUpdateTime = ref('');
const tableData = ref<any[]>([]);

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


// 时间范围变化
const onTimeRangeChange = async () => {
  const now = Date.now();
  queryParams.endTime = now;
  queryParams.startTime = now - (queryParams.timeRange * 60 * 60 * 1000);
  // 时间范围变化时自动查询
  if (queryParams.dataType && queryParams.category) {
    queryData();
  }
};

// 查询数据
const queryData = async () => {
  loading.value = true;
  try {
    // 更新时间范围，但不触发自动查询
    const now = Date.now();
    queryParams.endTime = now;
    queryParams.startTime = now - (queryParams.timeRange * 60 * 60 * 1000);
    
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

    // 如果能获取到数据，说明API是正常的
    connectionStatus.value = true;
    
    console.log(data[0])
    // 获取当前类型的显示标签
    const currentCategory = categoryOptions.value.find(
      option => option.value === queryParams.category
    );

    // 根据数据类型设置默认单位
    const getDefaultUnit = () => {
      switch (queryParams.category) {
        case 'cpu': return '%';
        case 'online': return '%';
        case 'memory': return 'MB';
        case 'network': return 'ms';
        case 'temperature': return '℃';
        case 'upload_frequency': return 'Hz';
        default: return '';
      }
    };

    // 表格数据项设置
    tableData.value = data.map(item => ({
      ...item,
      time: new Date(item.timestamp).toLocaleString(),
      category: currentCategory?.label || queryParams.category,
      unit: item.unit || getDefaultUnit() // 如果后端没有提供单位，使用默认单位
    }));

    await nextTick();
    
    lastUpdateTime.value = new Date().toLocaleTimeString();
    ElMessage.success(`查询到 ${data.length} 条历史数据`);
    
  } catch (error) {
    console.error('查询历史数据失败:', error);
    ElMessage.error('查询历史数据失败');
  } finally {
    loading.value = false;
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
  try {
    connectionStatus.value = await historyApi.checkConnection();
    // 如果连接正常，自动查询一次数据
    if (connectionStatus.value) {
      await queryData();
    }
  } finally {
    // 无论成功失败，都标记初始化完成
    initializing.value = false;
  }
};

// 组件挂载
onMounted(async () => {
  onTimeRangeChange();
  await checkConnection();
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
