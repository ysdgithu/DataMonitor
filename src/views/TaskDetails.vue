<template>
    <div class="common-layout">
    <el-container>
      <el-header style="height: auto; padding: 16px;">
        <!-- 任务名+状态+优先级 -->
        <el-row class="task-header">
            <el-space size="medium">
                <h3 class="task-title">cpu 持续超限问题</h3>
                <el-tag type="warning">进行中</el-tag>
                <el-tag type="danger">高</el-tag>
            </el-space>
        </el-row>
      </el-header>
      <el-divider style="margin: 0"/>
      <el-main style="padding: 20px;">
        <!-- 处理人+任务详情+设备+创建时间 -->
        <el-col class="info-section">
            <p class="info-item"><span class="label">处理人：</span>admin</p>
            <p class="info-item"><span class="label">任务描述：</span>cpu持续5分钟超限，其他数据无异常</p>
            <p class="info-item"><span class="label">设备：</span>DEV-001</p>
            <p class="info-item"><span class="label">创建时间：</span>2024-01-15 10:30:00</p>
        </el-col>
        <el-divider />
        <!-- ai 分析部分 -->
        <div class="ai-analysis-section">
          <el-button type="primary" class="ai-button">
            <el-icon><Connection /></el-icon>
            AI 一键分析
          </el-button>
          <!-- ai 分析结果 -->
          <el-card class="ai-result-card">
            <template #header>
              <div class="ai-result-header">
                <el-icon><ChatRound /></el-icon>
                <span>AI 分析结果</span>
              </div>
            </template>
            <div class="ai-result-content">
              cpu持续超限，可能是散热问题
            </div>
          </el-card>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { Connection, ChatRound } from '@element-plus/icons-vue'
</script>

<style scoped>
.task-header {
    display: flex;
    align-items: center;
}

.task-title {
    font-weight: bold;
    font-size: 18px;
    margin: 0;
}

.info-section {
    margin-bottom: 20px;
}

.info-item {
    margin: 8px 0;
}

.label {
    color: #94A3B8;
    display: inline-block;
    width: 80px;
}

.ai-analysis-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.ai-button {
    align-self: flex-start;
}

.ai-result-card {
    border: 1px solid rgba(74, 144, 226, 0.15);
    border-radius: 8px;
}

.ai-result-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
}

.ai-result-content {
    padding: 12px;
    background-color: rgba(74, 144, 226, 0.1);
    border-radius: 4px;
    line-height: 1.5;
}

:deep(.el-card__header) {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(74, 144, 226, 0.15);
}

:deep(.el-card__body) {
    padding: 16px;
}

:deep(.el-divider--horizontal) {
    border-color: rgba(74, 144, 226, 0.15);
}
</style>
