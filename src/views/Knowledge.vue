<template>
  <main-layout>
    <div class="background">
      <h2 class="title">知识库管理</h2>
      <el-row justify="space-between"><search-input :placeholder="'搜索文件'" style="width: 30%;"/>
      <el-button type="primary">上传文件</el-button>
    </el-row>
      <el-divider></el-divider>
      <el-table :data="documentList">
        <el-table-column prop="name" label="文档名称" width="180" />
        <el-table-column prop="uploadTime" label="上传时间" width="180" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-switch v-model="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <!-- 可以查看，重新上传，删除 -->
          <template #default>
            <el-button size="small" type="primary">更新</el-button>
            <el-button size="small" type="danger">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- 开始 -->
      <!-- 样式测试区 -->
      <div class="test" style="padding: 20px; background: #f5f5f5;">
        <h2 style="margin-bottom: 20px;">样式测试</h2>

        <!-- 1. 颜色 -->
        <div style="margin-bottom: 20px;">
          <h3>颜色</h3>
          <div style="display: flex; gap: 10px;">
            <div style="width: 60px; height: 40px; background: var(--border-base);"></div>
            <div style="width: 60px; height: 40px; background: var(--border-light);"></div>
            <div style="width: 60px; height: 40px; background: var(--border-dark);"></div>
            <div style="width: 60px; height: 40px; background: var(--warning);"></div>
            <div style="width: 60px; height: 40px; background: var(--error);"></div>
          </div>
        </div>

        <!-- 2. 标题 -->
        <div style="margin-bottom: 20px;">
          <h3>标题</h3>
          <div class="title-h1">一级标题</div>
          <div class="title-h2">二级标题</div>
        </div>

        <!-- 3. 消息 -->
        <div style="margin-bottom: 20px;">
          <h3>消息</h3>
          <div class="message-user">用户消息</div>
          <div class="message-ai">AI 回答</div>
        </div>

        <!-- 4. 标签 -->
        <div style="margin-bottom: 20px;">
          <h3>标签</h3>
          <span class="tag tag-primary">标签1</span>
          <span class="tag tag-success">标签2</span>
        </div>

        <!-- 5. 按钮 -->
        <div style="margin-bottom: 20px;">
          <h3>按钮</h3>
          <button class="btn-text">复制</button>
          <button class="btn-text">重新生成</button>
        </div>
      </div>
      <!-- 结束 -->
    </div>
  </main-layout>
</template>

<script setup lang="ts">
import MainLayout from '../components/layout/MainLayout.vue'
import { ref } from 'vue'
//维护文档表格列表
const documentList = [
  {
    name: '设备手册',
    uploadTime: '2021-01-01',
    status: true
  },
  {
    name: '设备手册',
    uploadTime: '2021-01-01',
    status: true
  },
  {
    name: '设备手册',
    uploadTime: '2021-01-01',
    status: true
  }
]

</script>

<style>

</style>
