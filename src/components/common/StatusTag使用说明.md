# StatusTag 组件使用说明

## ✅ 已完成的替换示例

### DiagnosisView.vue

**替换前：**
```vue
<el-tag :type="getStatusType(row.status)" size="small">
  {{ getStatusText(row.status) }}
</el-tag>
```

**替换后：**
```vue
<StatusTag :type="getStatusType(row.status)" size="small" :icon="getStatusIcon(row.status)">
  {{ getStatusText(row.status) }}
</StatusTag>
```

**状态映射函数已更新：**
```typescript
// 状态类型映射（适配 StatusTag）
const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    4: 'info',      // 待执行 -> info（蓝色）
    0: 'primary',   // 进行中 -> primary（主色）
    1: 'success',   // 已完成 -> success（绿色）
    2: 'danger'     // 失败 -> danger（红色）
  }
  return map[status] || 'info'
}

// 状态图标映射（新增）
const getStatusIcon = (status: string) => {
  const map: Record<string, any> = {
    4: Document,      // 待执行 - 文档图标
    0: Loading,       // 进行中 - 加载图标
    1: CircleCheck,   // 已完成 - 对勾图标
    2: CircleClose    // 失败 - 叉号图标
  }
  return map[status] || undefined
}
```

## 🎨 视觉效果

- ✨ **渐变背景**：每种类型都有独特的渐变色
- 🌟 **发光效果**：hover 时有阴影和发光
- 🎯 **图标支持**：可选的图标显示
- 📏 **三种尺寸**：small、default、large

## 📝 待替换的文件

以下文件中还有 `el-tag` 需要替换：

1. **FactoryMap.vue** - 设备状态标签
2. **其他使用 el-tag 的页面**

## 🚀 替换步骤

1. 将 `<el-tag>` 改为 `<StatusTag>`
2. 确保 type 属性值为：success、warning、danger、info、primary
3. （可选）添加 icon 属性显示图标
4. 保持 size 属性不变（small、default、large）

## 💡 提示

- StatusTag 已全局注册，无需导入即可使用
- 支持默认插槽和 text 属性两种方式传入文本
- 图标需要从 `@element-plus/icons-vue` 导入

