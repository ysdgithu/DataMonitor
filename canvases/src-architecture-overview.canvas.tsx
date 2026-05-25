import { Card, CardBody, CardHeader, Divider, Grid, H1, H2, Pill, Stack, Table, Text } from 'cursor/canvas';

const rootModules = [
  {
    layer: '入口层',
    file: 'src/main.ts',
    purpose: '应用启动、挂载 Vue / Pinia / Element Plus、注册全局组件、初始化认证状态。',
    wraps: 'App.vue → router → 全局样式',
  },
  {
    layer: '顶层壳',
    file: 'src/App.vue',
    purpose: '只保留 <RouterView />，是路由出口。',
    wraps: '所有页面组件',
  },
  {
    layer: '路由层',
    file: 'src/router/index.ts',
    purpose: '定义登录、首页、历史数据、智能问答、权限、异常规则、知识库、诊断、设备管理等路由，并做鉴权/角色控制。',
    wraps: '页面视图 + 全局导航守卫',
  },
  {
    layer: '状态层',
    file: 'src/stores/*',
    purpose: 'Pinia 状态：auth、realtime、alarm、deviceData、History/Telemetry/Environment/CoreMetric 等业务数据。',
    wraps: '页面、布局、图表、告警、设备管理',
  },
  {
    layer: '通用能力层',
    file: 'src/utils/*',
    purpose: 'API 请求、WebSocket、worker、图表配置、指标/告警格式化、令牌管理、性能监控、音频通知等。',
    wraps: '页面与组件的底层能力',
  },
  {
    layer: '全局样式层',
    file: 'src/assets/*',
    purpose: 'main.css、base.css、element-override.css、element-light-theme.css 等样式覆盖。',
    wraps: '整个应用 UI 视觉',
  },
];

const layoutNodes = [
  {
    file: 'src/views/HomeView.vue',
    role: '首页路由页面',
    wraps: 'MainLayout → DashboardMain_new',
    note: 'HomeView 只是把主布局包起来，再把 dashboard 主体塞进 slot。',
  },
  {
    file: 'src/components/layout/MainLayout.vue',
    role: '主布局壳',
    wraps: 'AppSidebar + AppHeader + 面包屑 + <slot />',
    note: '所有需要侧边栏和顶部栏的页面都应通过它承载。',
  },
  {
    file: 'src/components/layout/AppSidebar.vue',
    role: '左侧导航',
    wraps: 'el-menu + 角色过滤 + 路由跳转',
    note: '根据用户角色控制菜单可见性，并对受限路由做二次拦截。',
  },
  {
    file: 'src/components/layout/AppHeader.vue',
    role: '顶部栏',
    wraps: '未在当前读取中展开，但由 MainLayout 引用',
    note: '通常放置用户信息、退出登录、通知等。',
  },
];

const views = [
  ['src/views/LoginView.vue', '登录页', '无主布局时通常直接渲染。'],
  ['src/views/RegisterView.vue', '注册页', '与登录页同级，路由无需登录。'],
  ['src/views/DiagnosisView.vue', '诊断任务管理', '与任务、设备、规则相关的诊断流程页面。'],
  ['src/views/HistoryData.vue', '历史数据总览', '历史趋势、回放、查询入口。'],
  ['src/views/ChatQA.vue', '智能问答', '面向知识库/诊断的问答页面。'],
  ['src/views/Permission.vue', '权限管理', '管理员页面。'],
  ['src/views/Exception.vue', '异常规则', '异常规则配置与管理。'],
  ['src/views/Knowledge.vue', '知识库管理', '管理员页面，知识库维护。'],
  ['src/views/DeviceManagement.vue', '设备管理', '设备清单、状态、配置管理。'],
  ['src/views/TaskDetails.vue', '任务详情', '任务详情页，通常作为诊断任务的二级页面。'],
  ['src/views/PaginationTest.vue', '分页测试页', '更像验证/示例页面，候选冗余。'],
];

const dashboardAndWidgets = [
  ['src/components/dashboard/DashboardMain_new.vue', '首页主仪表盘（新版本）', 'HomeView 当前使用。'],
  ['src/components/dashboard/DashboardMain.vue', '首页主仪表盘（旧版本）', '可能是历史遗留，可和新版本对比后决定去留。'],
  ['src/components/dashboard/DeviceCard.vue', '设备卡片', '仪表盘中的单设备概览卡片。'],
  ['src/components/dashboard/HistoryDataPanel.vue', '历史数据面板', '历史趋势/筛选展示的复用区块。'],
  ['src/components/FactoryMap.vue', '工厂地图/设备分布图', '可视化地图类组件。'],
  ['src/components/charts/BaseChart.vue', '图表基座', '统一封装 ECharts/图表渲染。'],
  ['src/components/BaseComponents.vue', '基础组件集合', '可能是组合注册或演示入口，需进一步确认。'],
];

const commonComponents = [
  ['src/components/common/index.ts', '公用组件统一导出', 'main.ts 会全局注册这里导出的组件。'],
  ['src/components/common/Button/index.vue', '按钮组件', '通用按钮封装。'],
  ['src/components/common/Card/index.vue', '卡片组件', '通用卡片封装。'],
  ['src/components/common/Loading/index.vue', '加载中组件', '加载态。'],
  ['src/components/common/Empty/index.vue', '空状态组件', '无数据提示。'],
  ['src/components/common/Modal/index.vue', '弹窗组件', '通用模态框。'],
  ['src/components/common/Tag/index.vue', '标签组件', '通用标签。'],
  ['src/components/common/Pagination.vue', '分页组件', '列表分页控制。'],
  ['src/components/common/searchInput.vue', '搜索输入框', '筛选条件输入。'],
  ['src/components/common/statusTag.vue', '状态标签（小写文件名）', '与 StatusTag 目录版存在命名重复风险。'],
  ['src/components/common/StatusTag/types.ts', '状态标签类型', '目录版 StatusTag 的类型定义。'],
  ['src/components/common/DataTable/index.vue', '表格组件', '列表展示封装。'],
  ['src/components/common/VirtualTable/index.vue', '虚拟表格组件', '大数据量表格性能优化。'],
];

const utils = [
  ['src/utils/request.ts', 'HTTP 请求封装', 'API 请求基础层。'],
  ['src/utils/auth.types.ts', '认证类型定义', 'auth 领域类型。'],
  ['src/utils/tokenManager.ts', 'token 管理', '本地令牌读写。'],
  ['src/utils/useWebSocket.ts', 'WebSocket 封装', '实时数据连接。'],
  ['src/utils/worker.ts', 'Web Worker 辅助', '后台任务/计算。'],
  ['src/utils/useDataWorker.ts', '数据 worker 封装', '数据处理并行化。'],
  ['src/utils/chartOptions.ts', '图表配置', '统一图表样式与配置。'],
  ['src/utils/diagnosticApi.ts', '诊断 API', '诊断业务接口。'],
  ['src/utils/historyApi.ts', '历史数据 API', '历史查询接口。'],
  ['src/utils/deviceApi.ts', '设备 API', '设备管理接口。'],
  ['src/utils/alarmRuleApi.ts', '告警规则 API', '规则配置接口。'],
  ['src/utils/knowledgeApi.ts', '知识库 API', '知识库接口。'],
  ['src/utils/alarmFormatter.ts', '告警格式化', '告警展示/转换。'],
  ['src/utils/metrics.ts', '指标工具', '核心指标计算或转换。'],
  ['src/utils/performanceMonitor.ts', '性能监控', '应用性能采集。'],
  ['src/utils/audioNotification.ts', '音频通知', '告警声音提醒。'],
  ['src/utils/type.ts', '通用类型', '较泛的类型定义容器。'],
];

export default function SrcArchitectureOverview() {
  return (
    <Stack gap={18}>
      <H1>src 前端架构梳理</H1>
      <Text tone="secondary">
        下面按“文件 → 套了什么 → 作用”整理当前前端结构，便于你后续筛选冗余文件、重复实现和历史遗留文档。
      </Text>

      <Grid columns={4} gap={12}>
        <Card>
          <CardBody>
            <Text weight="semibold">入口</Text>
            <Text tone="secondary">main.ts · App.vue · router</Text>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Text weight="semibold">布局</Text>
            <Text tone="secondary">MainLayout · AppSidebar · AppHeader</Text>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Text weight="semibold">页面</Text>
            <Text tone="secondary">views/* 路由页面</Text>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Text weight="semibold">通用层</Text>
            <Text tone="secondary">components/common · utils · stores</Text>
          </CardBody>
        </Card>
      </Grid>

      <Divider />

      <H2>1) 顶层与路由入口</H2>
      <Table
        headers={["文件", "分层/位置", "作用", "包裹/依赖"]}
        rows={rootModules.map((item) => [item.file, item.layer, item.purpose, item.wraps])}
      />
      <Text tone="secondary" size="small">
        结论：`src/App.vue` 现在几乎只负责路由出口，真正的页面装配发生在 router、layout 和 views 层。
      </Text>

      <Divider />

      <H2>2) 页面装配链路</H2>
      <Table
        headers={["文件", "角色", "外层包裹", "说明"]}
        rows={layoutNodes.map((item) => [item.file, item.role, item.wraps, item.note])}
      />

      <Card>
        <CardHeader title="首页链路示例" />
        <CardBody>
          <Stack gap={10}>
            <Text><Pill tone="accent">Route /</Pill> → <Text weight="semibold">HomeView.vue</Text></Text>
            <Text>HomeView 只做两件事：引入 `MainLayout`，并把 `DashboardMain_new` 放进 layout 的 slot。</Text>
            <Text>最终结构是：`App.vue` → `router` → `HomeView.vue` → `MainLayout.vue` → `AppSidebar/AppHeader` → `DashboardMain_new.vue`。</Text>
          </Stack>
        </CardBody>
      </Card>

      <Divider />

      <H2>3) 路由页面清单</H2>
      <Table
        headers={["文件", "页面名称", "定位"]}
        rows={views}
      />
      <Text tone="secondary" size="small">
        你后面可以优先检查：示例页、测试页、旧版页、重复命名页，以及只被单一路由引用的页面是否还能继续复用。
      </Text>

      <Divider />

      <H2>4) 仪表盘与业务组件</H2>
      <Table
        headers={["文件", "作用", "现状/备注"]}
        rows={dashboardAndWidgets.map((item) => [item[0], item[1], item[2]])}
      />
      <Text tone="secondary" size="small">
        这里最值得做冗余排查的是 `DashboardMain.vue` / `DashboardMain_new.vue`、`statusTag.vue` / `StatusTag/*` 这类“新旧并存”或“命名重复”的文件。
      </Text>

      <Divider />

      <H2>5) 公共组件层</H2>
      <Table
        headers={["文件", "作用", "备注"]}
        rows={commonComponents.map((item) => [item[0], item[1], item[2]])}
      />
      <Text tone="secondary" size="small">
        `src/components/common/index.ts` 是总入口，`main.ts` 会把这里的组件全局注册；因此删除某个组件前，要先确认是否在全局注册或被页面直接引用。
      </Text>

      <Divider />

      <H2>6) 工具与数据层</H2>
      <Table
        headers={["文件", "职责", "备注"]}
        rows={utils.map((item) => [item[0], item[1], item[2]])}
      />
      <Text tone="secondary" size="small">
        这一层是最容易“越迭代越多”的地方：API、worker、格式化、图表配置、通知、监控工具经常会出现旧版与新版并存。
      </Text>

      <Divider />

      <Card>
        <CardHeader title="初步可疑重复点" />
        <CardBody>
          <Stack gap={8}>
            <Text>1. `DashboardMain.vue` 与 `DashboardMain_new.vue`：新旧首页主体并存。</Text>
            <Text>2. `components/common/statusTag.vue` 与 `components/common/StatusTag/*`：大小写/目录版重复。</Text>
            <Text>3. `src/views/PaginationTest.vue`：测试页，通常优先确认是否还能删除。</Text>
            <Text>4. `src/README.md`、`components/common/**/README.md`、`*使用说明.md`：文档类文件需确认是否仍与当前实现一致。</Text>
          </Stack>
        </CardBody>
      </Card>

      <Text tone="secondary" size="small">
        如果你愿意，我下一步可以继续帮你做“冗余文件候选清单”，按“可删 / 待确认 / 保留”三类直接标出来。
      </Text>
    </Stack>
  );
}
