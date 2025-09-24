# DataMonitor 前端项目

<div align="center">

**基于 Vue 3 + TypeScript 的现代化数据监控前端**

[![Vue 3](https://img.shields.io/badge/Vue-3.5.13-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.9.7-409EFF?style=flat-square)](https://element-plus.org/)

[🏠 返回主项目](../README.md) | [📚 后端文档](../websocket-server/README.md)

## 项目概述

DataMonitor 前端是基于 Vue 3 生态系统构建的现代化单页应用，专为实时数据监控和可视化设计。

## 技术栈

**核心**: Vue 3 + TypeScript + Vite + Element Plus + ECharts + Pinia + Vue Router + Axios

## 项目结构

```
src/
├── components/          # Vue组件
│   ├── charts/         # 图表组件
│   ├── dashboard/      # 仪表板组件
│   └── layout/         # 布局组件
├── stores/             # Pinia状态管理
├── utils/              # 工具函数
├── views/              # 页面组件
├── router/             # 路由配置
├── App.vue             # 根组件
└── main.ts             # 应用入口
```

## 核心功能

- **实时数据监控**: WebSocket连接管理、数据流处理
- **数据可视化**: ECharts图表、地理分布图
- **历史数据查询**: 条件筛选、时间范围选择
- **响应式设计**: 适配不同屏幕尺寸

## 主要组件

### 布局组件
- **AppHeader.vue**: 应用头部，Logo和主题切换
- **AppSidebar.vue**: 侧边栏导航菜单

### 仪表板组件
- **DashboardMain.vue**: 主仪表板，实时数据展示
- **HistoryDataPanel.vue**: 历史数据查询面板

### 图表组件
- **BaseChart.vue**: 基础图表组件，封装ECharts
- **FactoryMap.vue**: 设备地理分布地图

## 开发指南

### 构建部署
```bash
npm run build    # 生产构建
npm run preview  # 预览构建结果
```

---

<div align="center">
[🏠 返回主项目](../README.md) | [🔧 后端文档](../websocket-server/README.md)
