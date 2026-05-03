<template>
  <div class="history-data-panel">
    <el-card class="panel-card">
      <template #header>
        <div class="card-header">
          <span>历史数据查询</span>
          <el-button type="primary" size="small" @click="refreshData" :loading="loading">
            刷新数据
          </el-button>
        </div>
      </template>

      <!-- 查询条件 -->
      <div class="query-controls">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-select v-model="queryParams.deviceType" placeholder="选择设备类型" clearable @change="queryData()">
              <el-option v-for="option in deviceOptions" :key="option.value" :label="option.label"
                :value="option.value" />
            </el-select>
          </el-col>

          <el-col :span="6">
            <el-select v-model="timeRange" placeholder="选择时间范围" @change="onTimeRangeChange">
              <el-option v-for="option in timeRangeOptions" :key="option.value" :label="option.label"
                :value="option.value" />
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
          <el-table-column prop="time" label="时间" width="180" />
          <el-table-column prop="deviceId" label="设备ID" width="100" />
          <el-table-column prop="deviceType" label="设备类型" width="120" />
          <el-table-column prop="metrics" label="指标数据" min-width="300" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="100" />
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
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { historyApi, TIME_RANGE_OPTIONS } from '@/utils/historyApi';

// 响应式数据
const loading = ref(false);
const initializing = ref(true);
const connectionStatus = ref(false);
const lastUpdateTime = ref('');
const timeRange = ref(24);
const tableData = ref<any[]>([]);
const deviceOptions = ref<Array<{ label: string; value: string }>>([]);

// 查询参数
const queryParams = reactive({
  deviceType: '',
  startTime: 0,
  endTime: 0
});

// 时间范围选项
const timeRangeOptions = TIME_RANGE_OPTIONS;

// 时间范围变化
const onTimeRangeChange = async () => {
  const now = Date.now();
  queryParams.endTime = now;
  queryParams.startTime = now - (timeRange.value * 60 * 60 * 1000);
};

// 查询数据
const queryData = async () => {
  loading.value = true;
  try {
    const now = Date.now();
    queryParams.endTime = now;
    queryParams.startTime = now - (timeRange.value * 60 * 60 * 1000);

    const res = await historyApi.getDeviceHistory({
      deviceType: queryParams.deviceType || undefined,
      startTime: queryParams.startTime,
      endTime: queryParams.endTime,
      limit: 100
    });

    connectionStatus.value = true;

    if (res.success && res.data) {
      // 预处理：把指标对象平铺为可展示的字符串
      const excludedKeys = new Set(['id', 'device_id', 'data_type', 'timestamp', 'data_status', 'payload', 'created_at', 'line']);
      tableData.value = res.data.map((item: any) => {
        const metrics: string[] = [];
        Object.keys(item).forEach(key => {
          if (!excludedKeys.has(key) && item[key]?.value !== undefined) {
            metrics.push(`${key}: ${item[key].value}${item[key].unit || ''}`);
          }
        });
        return {
          time: new Date(item.timestamp).toLocaleString('zh-CN'),
          deviceId: item.device_id,
          deviceType: item.data_type,
          metrics: metrics.join(' | '),
          status: item.data_status
        };
      });
      ElMessage.success(`查询到 ${res.data.length} 条历史数据`);
    } else {
      tableData.value = [];
    }

    await nextTick();
    lastUpdateTime.value = new Date().toLocaleTimeString();
  } catch (error) {
    console.error('查询历史数据失败:', error);
    ElMessage.error('查询历史数据失败');
  } finally {
    loading.value = false;
    initializing.value = false;
  }
};

// 刷新数据
const refreshData = () => {
  queryData();
};

// 检查连接状态
const checkConnection = async () => {
  try {
    connectionStatus.value = await historyApi.checkConnection();
    if (connectionStatus.value) {
      await queryData();
    }
  } finally {
    initializing.value = false;
  }
};

// 加载设备列表
const loadDevices = async () => {
  try {
    const devices = await historyApi.getDeviceList();
    deviceOptions.value = devices.map(d => ({
      label: `${d.deviceId}-${d.deviceType}`,
      value: d.deviceType
    }));
  } catch (error) {
    console.error('加载设备列表失败:', error);
  }
};

// 组件挂载
onMounted(async () => {
  await loadDevices();
  onTimeRangeChange();
  await checkConnection();
});
</script>

<style scoped>
.history-data-panel {
  width: 100%;
}

.panel-card {
  margin-bottom: var(--spacing-base);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.query-controls {
  margin-bottom: var(--spacing-base);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-base);
  padding: var(--spacing-sm);
  background-color: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.status-text {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
}

.data-display {
  margin-top: var(--spacing-base);
}

.chart-container {
  margin-bottom: var(--spacing-base);
}

.no-data {
  text-align: center;
  padding: var(--spacing-xl) 0;
}

.loading-container {
  text-align: center;
  padding: var(--spacing-xl) 0;
}
</style>
