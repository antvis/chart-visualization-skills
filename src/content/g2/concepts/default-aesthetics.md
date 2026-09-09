---
id: "g2-design-default-aesthetics"
title: "G2 默认美观策略：按语义与密度生成图表"
description: |
  为 G2 v5 图表提供克制、可读的默认视觉策略。按颜色语义、数据密度、
  已知业务信息和图表类型决定颜色、标签、标题、tooltip 与布局，避免将装饰性配置当作通用规则。
library: "g2"
version: "5.x"
category: "concepts"
tags:
  - "default aesthetics"
  - "默认美观"
  - "design"
  - "视觉基线"
  - "颜色"
  - "图例"
  - "标签"
  - "tooltip"
  - "title"
  - "布局"
  - "autoFit"
  - "theme"
related:
  - "g2-core-chart-init"
  - "g2-theme-builtin"
  - "g2-comp-axis-config"
  - "g2-comp-legend-config"
  - "g2-comp-label-config"
  - "g2-comp-title"
  - "g2-comp-tooltip-config"
  - "g2-mark-interval-basic"
  - "g2-mark-interval-grouped"
  - "g2-mark-interval-stacked"
  - "g2-mark-interval-normalized"
  - "g2-mark-line-multi"
  - "g2-mark-area-stacked"
  - "g2-mark-area-basic"
  - "g2-mark-line-basic"
  - "g2-mark-point-scatter"
  - "g2-mark-point-bubble"
  - "g2-mark-arc-pie"
  - "g2-mark-arc-donut"
  - "g2-mark-rose"
use_cases:
  - "用户只提出图表类型和数据，希望默认结果清晰好看"
  - "为生成代码选择颜色、标签、标题和 tooltip"
  - "为多系列、构成、分布和占比图选择默认布局"
  - "判断何时不应添加装饰或冗余组件"
anti_patterns:
  - "将同一分类字段同时映射到 x 和 color，生成彩虹柱与重复图例"
  - "在未知单位、来源或指标语义时编造标题和 tooltip 文案"
  - "为密集图表默认添加全部数据标签"
---

## 目标

默认图表优先保证信息层级、对比效率和可读性。圆角、线宽和留白由本 skill 的约定值提供（见下表，需显式写入 `style`，会覆写引擎默认）；颜色、标题、tooltip 和标签必须由数据语义与空间决定，不能机械叠加。

> 两种“默认”。引擎默认（`theme/create.ts`）是 `line.lineWidth: 1`、`area.fillOpacity: 0.85`、矩形 **无圆角**；下表的 `radius: 4` / `lineWidth: 2` / `fillOpacity: 0.5~0.6` 是本 skill 的约定值，用来让生成示例更好看，不是省略即生效。

## 决策矩阵

| 条件 | 默认做法 | 避免 |
|---|---|---|
| 常规嵌入式图 | `autoFit: true`、`theme: 'classic'`、`padding: 'auto'`；`classic` 是显式视觉基线（引擎默认推断为 `light`）；浅/深主题共用同一套 `category10` 色板，稳定主色在两者下都可用 | 同时指定 `width` 与 `autoFit` |
| 深色容器 | `theme: 'classicDark'` | 保留浅色主题的文本颜色 |
| 单指标分类比较 | 稳定单色（`style.fill` 用 hex 是合法的）、`style.radius: 4`（覆写引擎无圆角）、不显示颜色图例 | `x` 与 `color` 同时映射类别 |
| 颜色表达系列/状态/分组 | `encode.color` 指向该独立字段，让图例解释颜色 | 把 hex 字符串存进数据再作为 `encode.color` 的类别字段编码 |
| 未指定图形填充色 | 使用与背景有对比的稳定主色（如 `#5B8FF9`） | 用白色或近白色填充浅色画布；白色仅适合深色图形内标签或分隔线 |
| 单系列趋势 | `style.lineWidth: 2`（覆写引擎 `1`）；面积图 `style.fillOpacity: 0.5~0.6`（覆写引擎 `0.85`） | 默认渐变、阴影、每点标签 |
| 标签少且需要精确读取 | 添加 labels；inside 标签加 `contrastReverse` | 在密集图中强加常驻标签 |
| 标签可能碰撞 | `overlapHide` / `overlapDodgeY` / `overflowHide` | 只靠大幅 `dx` / `dy` 硬推开 |
| 已知字段名、单位、来源 | 添加语义化轴标题、tooltip 与报告标题 | 写 `x`、`y`、`field` 或编造单位 |
| 未知业务语义 | 复用原字段名或省略附加文本 | 猜测货币、百分比、来源或副标题 |
| 气泡图 | 保持 Point 默认 sqrt size 映射，按数据范围设 `size.range` | 无理由隐藏有助理解的 size legend |
| 饼图 / 环形图 | 3–6 类时外置标签；类别更多时使用 legend 或改柱状图 | 同时默认显示外置标签和重复 legend |
| 玫瑰图 | 扇区多且窄时可保留 `encode.color` + 图例辅助定位；扇区少按单色处理 | 一刀切“玫瑰图必上或必不上颜色” |

## 生成顺序：从语义到样式

不要从颜色、圆角或动画开始拼配置。一次默认生码按以下顺序决策，前一步未成立时不进入后一步：

1. **识别任务。** 区分比较、趋势、构成、分布、关系、层级和流程；无法由数据或需求确认时，选择信息负担更低的基础图，而不是猜测业务含义。
2. **选择编码。** `x` / `y` 承担主要比较；只有颜色、大小或形状表达了独立维度时才映射它们。不要为了“更丰富”复制已有位置编码。
3. **确定布局。** 常规嵌入式图使用自适应宽度和明确高度；需要正方形、固定比例或布局算法稳定性的图（雷达、树图、桑基、词云等）可保留固定尺寸。
4. **添加组件。** 轴、图例、标签、tooltip、标题都必须承担明确的阅读任务；组件之间的信息重复时，保留最直接的一个。
5. **应用 mark 基线。** 再显式设置圆角、线宽、透明度等小幅样式覆写；渐变、阴影和动画只在需求明确时使用。

### 通用容器骨架

普通嵌入式图从此骨架开始。`height` 应按图表复杂度调整：单一比较/趋势通常 `320–400`，多图例、长标签或多系列需要更多空间。

```javascript
const chart = new Chart({
  container: 'container',
  autoFit: true,
  height: 360,
  theme: 'classic',
});

chart.options({
  // type、data、encode、style 和组件配置
  padding: 'auto',
});
```

不要在 `autoFit: true` 时再传 `width`。固定宽高只用于容器本身不可自适应、导出画布或图形布局依赖纵横比的场景；固定尺寸时移除 `autoFit`。

## 组件取舍

### 颜色与图例

| 数据结构 | 颜色与图例默认值 | 说明 |
|---|---|---|
| 单一指标 × 分类 | 单色 `style.fill` / `stroke`，不显示颜色图例 | 类别已经由 `x` 或 `y` 位置表达 |
| 多系列趋势、分组比较、状态 | `encode.color` 指向系列/状态，并保留对应图例 | 图例解释颜色的业务语义 |
| 连续数值着色 | 使用连续 color scale 与连续图例 | 常见于 cell/heatmap；色带需要表达范围 |
| 小类别占比 | 外置标签或图例二选一 | 不默认重复显示类别名称 |
| 金融涨跌、风险等级等约定语义 | 显式设置 `scale.color.domain` 与 `range` | 不依赖主题色猜测领域语义 |

图例的位置跟随可读空间：少量系列通常放底部横向；名称很长或系列较多时可用侧边纵向、`cols`、`maxRows` 和 `itemWidth` 控制密度。连续色带放右侧时配置足够的 `length`，不能让色带短到刻度失去意义。详细属性见 `g2-comp-legend-config`。

### 标题、轴与 tooltip

- **标题：** 只在用户给出报告语境、指标或时间范围时添加；标题不是字段名的重复。
- **轴标题：** 已知字段含义和单位时，写成“指标 / 单位”；未知时直接保留字段名或省略。
- **tooltip：** G2 默认启用。字段名、单位或格式明确时配置 `title`、`items` 与 `valueFormatter`；未知时不编造货币、百分比或业务术语。
- **坐标轴：** 直角坐标图通常保留；饼/环、漏斗等不靠坐标读数的图关闭。不要为装饰而增加显眼网格线。

### 标签密度

| 场景 | 默认策略 |
|---|---|
| 少量柱/点且需要精确读数 | 使用 label；inside label 加 `contrastReverse` |
| 多系列折线、密集散点、分组/堆叠柱 | 默认不显示每个 mark 的 label，使用 tooltip |
| 标签可能相互覆盖 | 视图形选择 `overlapHide`、`overlapDodgeY` 或 `overflowHide` |
| 饼/环的少量类别 | 用外置标签 + connector，关闭重复 legend |
| 小空间层级图 | 隐藏放不下的标签，不能通过大幅 `dx` / `dy` 强推位置 |

## 图表家族配方

以下配方是生成时可组合的默认结构，不取代各 mark 文档中的数据变换、坐标系和领域约束。

### 1. 单指标分类比较：柱/条图

分类仅负责定位，数值负责比较，因此使用稳定单色与圆角。类别过多时优先转置为条形图、排序或筛选，而不是缩小全部文字。

## 默认柱状图

单指标分类比较中，颜色不承担额外信息，因此使用一个稳定主色并隐藏颜色图例。

```javascript
const chart = new Chart({
  container: 'container',
  autoFit: true,
  height: 360,
  theme: 'classic',
});

chart.options({
  type: 'interval',
  data,
  encode: { x: 'category', y: 'sales' },
  style: { fill: '#5B8FF9', radius: 4 },
  padding: 'auto',
  axis: { x: { title: '类别' }, y: { title: '销量 / 件' } },
  tooltip: {
    title: 'category',
    items: [{ channel: 'y', name: '销量', valueFormatter: (v) => `${v} 件` }],
  },
});

chart.render();
```

若 `category` 只是字段名、单位未知，则不要照抄上面的轴标题和 formatter；应保留真实字段名或省略这些文本。

### 2. 多系列趋势：折线图

颜色表达独立系列，图例说明系列；线条是主视觉，默认不逐点标注。单系列趋势可直接用稳定 `stroke`，不必添加图例。

```javascript
chart.options({
  type: 'line',
  data,
  encode: { x: 'month', y: 'temperature', color: 'city' },
  style: { lineWidth: 2 },
  padding: 'auto',
  axis: {
    x: { title: '月份' },
    y: { title: '气温 / °C' },
  },
  legend: { color: { position: 'bottom' } },
  tooltip: {
    title: 'month',
    items: [{ channel: 'y', name: '气温', valueFormatter: (v) => `${v} °C` }],
  },
});
```

当系列多到颜色难以区分或图例过长时，先考虑筛选、突出重点系列或小 multiples；不要通过给每个数据点加标签解决。

### 3. 组成与占比：堆叠、饼和环图

- **堆叠柱/面积：** 颜色表达组成系列，保留图例；分段多时不显示内部 label。百分比堆叠的轴显示百分比，tooltip 可补充原始值。
- **饼/环：** 仅适合类别较少、总和有意义的构成。3–6 类优先外置标签；更多类别优先 legend，必要时改为排序柱图。
- **玫瑰：** 扇区较少时位置已能区分，可用单色；扇区多而窄时颜色与图例可辅助定位。

```javascript
chart.options({
  type: 'interval',
  data,
  encode: { x: 'month', y: 'sales', color: 'product' },
  transform: [{ type: 'stackY' }],
  style: { stroke: '#fff', lineWidth: 1 },
  padding: 'auto',
  legend: { color: { position: 'bottom' } },
  tooltip: { title: 'month' },
});
```

### 4. 关系与分布：散点、气泡、直方图和箱线图

- **散点：** 仅在存在独立分组时用颜色；密集点默认依赖 tooltip，不使用常驻标签。
- **气泡：** 保持 Point 的 sqrt size 映射，按数据范围设置 `size.range`；size legend 有助解释大小时保留。
- **直方图：** 柱体是连续区间，不留间隔或圆角；单一分布不需要图例。
- **箱线图：** 箱体、须线和异常值已表达统计层级；单指标分类比较不重复按类别着色。

### 5. 结构与专项图：按布局优先

树图、桑基、树、词云、雷达、热力图等不应强套基础柱/线图的样式：

- 树图、桑基、树和词云可使用固定宽高，优先留出布局与文字空间；
- 热力图使用连续色标解释数值，单元格过密时隐藏 label；
- 雷达图仅用于量纲一致且维度较少的比较，面积低透明度、线条清晰；
- K 线的涨跌色显式定义，并避免遮挡时间序列的常驻标签。

各图的具体数据结构、transform 和坐标系以对应 mark 文档为准。

## 装饰增强

仅当用户明确要求报告级、精致或展示型视觉时，再考虑渐变、阴影、自定义动画、滑块或滚动条。先确认装饰不降低标签对比度、不引入冗余 legend，也不掩盖数据关系。
