<template>
  <div class="factory-map-view">
    <div class="page-header">
      <h1>工厂车间地图</h1>
      <p class="page-description">
        交互式工厂车间地图，实时显示设备状态和位置信息。支持缩放、拖拽和设备详情查看。
      </p>
    </div>
    
    <div class="map-wrapper">
      <FactoryMap />
    </div>
    
    <div class="usage-guide">
      <el-card>
        <template #header>
          <h3>使用说明</h3>
        </template>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="guide-item">
              <h4>🖱️ 基本操作</h4>
              <ul>
                <li>点击设备图标查看详细信息</li>
                <li>使用鼠标滚轮进行缩放</li>
                <li>拖拽地图进行平移浏览</li>
                <li>使用右上角按钮控制视图</li>
              </ul>
            </div>
          </el-col>
          
          <el-col :span="8">
            <div class="guide-item">
              <h4>🏭 区域说明</h4>
              <ul>
                <li><span class="zone-indicator production"></span>生产区：主要生产设备</li>
                <li><span class="zone-indicator storage"></span>仓储区：存储和物流设备</li>
                <li><span class="zone-indicator office"></span>办公区：IT和办公设备</li>
                <li><span class="zone-indicator testing"></span>检测区：质量检测设备</li>
                <li><span class="zone-indicator maintenance"></span>维护区：基础设施设备</li>
              </ul>
            </div>
          </el-col>
          
          <el-col :span="8">
            <div class="guide-item">
              <h4>📊 设备状态</h4>
              <ul>
                <li><span class="status-indicator online"></span>在线：设备正常运行</li>
                <li><span class="status-indicator warning"></span>警告：需要关注的异常</li>
                <li><span class="status-indicator offline"></span>离线：设备未连接</li>
                <li><span class="status-indicator error"></span>错误：设备故障</li>
              </ul>
            </div>
          </el-col>
        </el-row>
        
        <el-divider />
        
        <div class="statistics">
          <h4>设备统计</h4>
          <el-row :gutter="16">
            <el-col :span="6">
              <el-statistic title="总设备数" :value="deviceStats.total" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="在线设备" :value="deviceStats.online" value-style="color: #4caf50" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="警告设备" :value="deviceStats.warning" value-style="color: #ff9800" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="离线设备" :value="deviceStats.offline" value-style="color: #f44336" />
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FactoryMap from '@/components/FactoryMap.vue'

// 模拟设备统计数据（实际项目中应该从组件或store获取）
const deviceStats = computed(() => {
  // 这里应该从实际的设备数据中计算，现在使用硬编码的示例数据
  return {
    total: 21,
    online: 14,
    warning: 3,
    offline: 2,
    error: 2
  }
})
</script>

<style scoped>
.factory-map-view {
  padding: 20px;
  min-height: 100vh;
  background: #f5f5f5;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  color: #333;
  margin-bottom: 10px;
  font-size: 2.5em;
  font-weight: 300;
}

.page-description {
  color: #666;
  font-size: 1.1em;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.map-wrapper {
  height: 600px;
  margin-bottom: 30px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.usage-guide {
  max-width: 1200px;
  margin: 0 auto;
}

.guide-item {
  margin-bottom: 20px;
}

.guide-item h4 {
  color: #333;
  margin-bottom: 12px;
  font-size: 1.1em;
}

.guide-item ul {
  list-style: none;
  padding: 0;
}

.guide-item li {
  padding: 6px 0;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
}

.zone-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 8px;
}

.zone-indicator.production {
  background-color: #2196f3;
}

.zone-indicator.storage {
  background-color: #4caf50;
}

.zone-indicator.office {
  background-color: #ff9800;
}

.zone-indicator.testing {
  background-color: #9c27b0;
}

.zone-indicator.maintenance {
  background-color: #607d8b;
}

.status-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-indicator.online {
  background-color: #4caf50;
}

.status-indicator.warning {
  background-color: #ff9800;
}

.status-indicator.offline {
  background-color: #f44336;
}

.status-indicator.error {
  background-color: #9e9e9e;
}

.statistics {
  margin-top: 20px;
}

.statistics h4 {
  color: #333;
  margin-bottom: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .factory-map-view {
    padding: 10px;
  }
  
  .page-header h1 {
    font-size: 2em;
  }
  
  .map-wrapper {
    height: 400px;
  }
  
  .guide-item {
    margin-bottom: 15px;
  }
}

@media (max-width: 480px) {
  .page-header h1 {
    font-size: 1.8em;
  }
  
  .map-wrapper {
    height: 300px;
  }
}
</style>
