## 逻辑闭环开发测试
### 1.异常规则-监控大屏-触发报警
**异常规则（后端数据库异常规则表存放）**

异常规则表结构

**告警规则表（alarm_rule）**

| 字段名 | 数据类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| id | bigint | PRIMARY KEY、AUTO_INCREMENT | 告警规则唯一 ID |
| rule_name | varchar(100) | NOT NULL | 规则名称 |
| device_type_id | bigint | NOT NULL、FOREIGN KEY | 关联设备类型 ID |
| param_name | varchar(50) | NOT NULL | 监控参数名称 |
| threshold_max | decimal(10,2) | DEFAULT NULL | 参数上限阈值 |
| threshold_min | decimal(10,2) | DEFAULT NULL | 参数下限阈值 |
| alarm_level | tinyint | NOT NULL | 1-一般 2-重要 3-紧急 |
| handle_suggest | text | DEFAULT NULL | 告警处置建议 |
| status | tinyint | NOT NULL、DEFAULT 1 | 0-禁用 1-启用 |
| create_user | bigint | NOT NULL、FOREIGN KEY | 创建人 ID |
| create_time | datetime | NOT NULL | 创建时间 |
| update_time | datetime | NOT NULL | 更新时间 |
| is_deleted | tinyint | NOT NULL、DEFAULT 0 | 软删除标记 |


| <font style="color:rgb(15, 17, 21);">设备</font> | <font style="color:rgb(15, 17, 21);">核心监控数据（你的“必要数据”）</font> | <font style="color:rgb(15, 17, 21);">典型异常规则（“自动化识别”示例）</font> |
| --- | --- | --- |
| <font style="color:rgb(15, 17, 21);">调配罐1001</font> | <font style="color:rgb(15, 17, 21);">温度、液位、搅拌电机电流、pH值</font> | <font style="color:rgb(15, 17, 21);">1. 温度偏离设定值±2℃持续5分钟。</font><font style="color:rgb(15, 17, 21);">   </font><font style="color:rgb(15, 17, 21);">2. 液位在“应进料”时段无变化（泵故障）。</font> |
| <font style="color:rgb(15, 17, 21);">灌装机1002</font> | <font style="color:rgb(15, 17, 21);">灌装速度（瓶/分钟）、灌装量（ml）、缺瓶检测信号</font> | <font style="color:rgb(15, 17, 21);">1. 连续10瓶灌装量误差超过±5ml。</font><font style="color:rgb(15, 17, 21);">   </font><font style="color:rgb(15, 17, 21);">2. 灌装速度低于额定值80%持续1分钟。</font> |


示例数据：

| id | rule_name（规则名称） | device_type（关联设备类型 ID） | param_name | threshold_max | threshold_min | alarm_level | handle_suggest |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 温度超限告警 | 调配罐 | temp | 70.0 | 60.0 | 2 | 1.检查加热系统 2.检查温度传感器 |
| 2 | 液位异常告警 | 调配罐 | level | 100.0 | 50.0 | 2 | 1.检查进料泵 2.检查液位传感器 |
| 3 | 电流过载告警 | 调配罐 | current | 15.0 | 10.0 | 3 | 1.立即停机 2.检查电机负载 |
| 4 | pH 值异常告警 | 调配罐 | ph | 7.5 | 6.5 | 2 | 1.检查加药系统 2.重新取样检测 |


监控大屏

实时显示调配罐1001的名称，基本状态，温度、液位、搅拌电机电流、pH值等监控数据，先用纯数字实现逻辑闭环


设备信息表表结构

| 字段名 | 数据类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| id | bigint | PRIMARY KEY、AUTO_INCREMENT | 设备唯一 ID |
| device_name | varchar(100) | NOT NULL | 设备名称 |
| device_type | varchar(50) | NOT NULL | 设备类型（调配罐/灌装机/贴标机） |
| status | tinyint | NOT NULL、DEFAULT 1 | 0-离线 1-在线 2-故障 |
| monitor_data | json | DEFAULT NULL | 实时监控数据（JSON 格式） |
| last_update | datetime | NOT NULL | 数据最后更新时间 |
| is_deleted | tinyint | NOT NULL、DEFAULT 0 | 软删除标记 |




```javascript
// 调配罐 1001
{
    "temp": {"value": 65.5, "unit": "℃", "status": "normal"},
    "level": {"value": 85.0, "unit": "L", "status": "normal"},
    "current": {"value": 12.3, "unit": "A", "status": "normal"},
    "ph": {"value": 7.2, "unit": "", "status": "normal"}
}
```



GET /api/dashboard - 监控大屏数据

| 参数名 | 数据类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| device_id | number | 是 | 设备id |


```javascript
{
    "code": 200,
    "msg": "操作成功",
    "data": {
        "devices": [
            {
                "id": 1001,
                "device_name": "1 号调配罐",
                "device_type": "调配罐",
                "status": 1,
                "monitor_data": {
                    "temp": {"value": 65.5, "unit": "℃", "status": "normal"},
                    "level": {"value": 85.0, "unit": "L", "status": "normal"},
                    "current": {"value": 12.3, "unit": "A", "status": "normal"},
                    "ph": {"value": 7.2, "unit": "", "status": "normal"}
                }
            }
    }
}
```

触发报警

异常检测引擎：数据生成时进入引擎，引擎添加检测标记后入库

弹窗提示+数据变色



说明：以调配罐1001为例，指代唯一设备调配罐1001。

测试：大屏页添加测试按钮，点击后后端开始生成异常数据，进行异常检测，前端需要出现弹窗和数据变色。测试按钮的相关前后端代码注意标记，之后需要删除



### 2.触发异常任务-任务详情-ai一键分析-人工确认-完成
触发异常任务：后端检测到异常后，将自动新建异常任务（异常任务管理模块表格显示）

任务详情：异常任务管理模块表格显示任务信息

表格显示样例：

| 任务ID | 任务名称 | 设备名称 | 设备ID | 任务状态 | 优先级 | 创建时间 | 更新时间 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1号调配罐温度持续升高 | 1 号调配罐 | 1001 | 进行中 | 高 | 2024-02-14 16:40:00 | 2024-02-14 18:20:00 |


任务详情：

```arkts
处理人：王工
任务描述：1号调配罐温度5分钟内持续上升，现在温度90摄氏度
设备：1 号调配罐（1001）
创建时间：2024-02-14 16:40:00

AI 分析结果：
……

---底层逻辑（默认/网络波动）---
处理人：未指定
任务描述：{设备名称}{监控参数}{持续时长}内持续{异常趋势}，现在{监控参数}{当前数值}{参数单位}
设备：{1 号调配罐}（{1001}）
创建时间：{2024-02-14 16:40:00}

AI 分析结果：
{}
```

告警规则表id匹配模板，每个规则一条

直接定义一个数组作为映射，使用时根据变量查完成拼接（后端完成）

模板 1（参数持续异常）：{设备名称}{参数名}{时长} 内持续 {趋势}，当前 {参数名}{数值}{单位}



ai一键分析：点击ai一键分析按钮在详情页给出结果（任务创立时收集一次）

人工确认：异常任务管理模块提供人工修改等各项手动修改项



### 3.数据分析复盘
模块：历史数据管理模块+智能问答模块

历史数据管理模块作为宏观复盘分析，结合智能问答（两者在同一页面左右分布）

智能问答：基本保持原先布局，历史对话不需要了。以单次分析为主，不需要agent的能力，但保留推荐问题。

```arkts
Q1：过去3天内{温度}上升原因？
Q2：过去7天内{温度}上升原因？

// 依旧后端拼接好，先使用模板
```

引用数据：比如用户现在在看的是过去3天内调配罐1号的所有数据，添加一个引用按钮将现在进行分析的数据引用至智能问答中

实际还是后端去查，前端只传数据范围。



