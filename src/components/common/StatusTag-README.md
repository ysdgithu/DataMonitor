# StatusTag 组件使用说明

## 📝 组件特性

StatusTag 是一个智能状态标签组件，内置了常用的状态、优先级和设备状态映射逻辑，父组件只需传入原始值即可自动转换。

## 🎯 使用方式

### 1. 任务状态标签

**原始值映射：**
- `'0'` → 进行中（primary 蓝色）
- `'1'` → 已完成（success 绿色）
- `'2'` → 失败（danger 红色）
- `'4'` → 待执行（info 灰色）

**使用示例：**
```vue
<template>
  <!-- 只需传入原始状态值 -->
  <StatusTag category="status" :value="row.status" size="small" />
</template>
```

### 2. 优先级标签

**原始值映射：**
- `'0'` → 低（info 灰色）
- `'1'` → 中（warning 橙色）
- `'2'` → 高（danger 红色）

**使用示例：**
```vue
<template>
  <!-- 只需传入原始优先级值 -->
  <StatusTag category="priority" :value="row.priority" size="small" />
</template>
```

### 3. 设备状态标签

**原始值映射：**
- `'online'` → 在线（success 绿色）
- `'offline'` → 离线（danger 红色）
- `'warning'` → 警告（warning 橙色）
- `'error'` → 错误（info 灰色）

**使用示例：**
```vue
<template>
  <!-- 只需传入原始设备状态值 -->
  <StatusTag category="device" :value="device.status" />
</template>
```

### 4. 自定义标签

如果需要自定义类型和文本，可以使用 `custom` 模式：

```vue
<template>
  <StatusTag 
    category="custom" 
    type="success" 
    text="在线" 
    size="default" 
  />
</template>
```

## 📋 API 说明

### Props

| 参数 | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| value | 原始值（用于 status/priority/device 模式） | string \| number | - | - |
| category | 分类模式 | string | status / priority / device / custom | custom |
| type | 自定义类型（仅 custom 模式） | string | success / warning / danger / info / primary | info |
| text | 自定义文本（仅 custom 模式） | string | - | - |
| size | 尺寸 | string | small / default / large | default |

## ✅ 已替换页面

### DiagnosisView.vue
- ✅ 任务状态标签
- ✅ 优先级标签
- ✅ 删除了 6 个映射函数（54 行代码）

### FactoryMap.vue
- ✅ 设备状态标签
- ✅ 删除了 2 个映射函数（19 行代码）

## 💡 优势

1. **简化父组件** - 不需要在每个页面写映射函数
2. **统一管理** - 所有映射逻辑集中在组件内部
3. **易于维护** - 修改映射规则只需改一处
4. **类型安全** - TypeScript 类型提示完整
5. **灵活扩展** - 支持自定义模式

## 🎨 扩展映射

如果需要添加新的映射类型，可以在 `statusTag.vue` 中修改映射配置：

```typescript
// 设备状态映射
const deviceMap: Record<string, { type: StatusTagType; text: string }> = {
  'online': { type: 'success', text: '在线' },
  'offline': { type: 'danger', text: '离线' },
  'warning': { type: 'warning', text: '警告' },
  'error': { type: 'info', text: '错误' },
  // 添加新的状态...
}
```

## 📊 代码对比

**替换前（复杂）：**
```vue
<el-tag :type="getStatusType(row.status)" size="small">
  {{ getStatusText(row.status) }}
</el-tag>

<script>
// 需要定义多个映射函数
const getStatusType = (status) => { /* 映射逻辑 */ }
const getStatusText = (status) => { /* 映射逻辑 */ }
</script>
```

**替换后（简洁）：**
```vue
<StatusTag category="status" :value="row.status" size="small" />

<!-- 不需要任何映射函数！ -->
```

