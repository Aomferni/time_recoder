## 1. 项目概述

时间记录器是一个基于Python Flask的时间追踪Web应用，帮助用户记录和管理日常活动时间。该应用采用模块化设计，将前端JavaScript代码拆分为多个独立的模块，以提高代码的可维护性和可扩展性。

## 2. 技术架构

### 2.1 后端架构
- **框架**: Python Flask
- **数据存储**: JSON文件存储（无需数据库）
- **API设计**: RESTful API
- **部署**: 独立运行，无需外部依赖

### 2.2 前端架构
- **HTML5**: 语义化标签和现代特性
- **CSS3**: 响应式设计和现代化样式
- **JavaScript**: 原生ES6模块化开发
- **AJAX**: 异步数据交互

### 2.3 时间处理架构
- **时间存储**: 使用UTC时间格式存储所有时间数据
- **时间显示**: 在前端界面显示时转换为北京时间
- **日期记录**: date字段记录北京时间的日期

## 3. 前端架构

### 3.1 模块划分

#### 3.1.1 核心模块
- **主应用模块** (`app.js`) - 应用入口点，负责初始化和模块协调
- **配置模块** (`config.js`) - 全局配置和常量定义，包括活动类别映射、颜色映射等
- **工具模块** (`utils.js`) - 通用工具函数，如时间格式化、类别获取等
- **API模块** (`api.js`) - 封装所有后端API调用
- **UI模块** (`ui.js`) - 负责DOM操作和界面更新
- **计时器模块** (`timer.js`) - 实现计时器核心功能
- **记录详情模块** (`recordDetail.js`) - 处理记录详情相关功能
- **今日计划模块** (`dailyPlan.js`) - 实现今日计划功能
- **飞书配置模块** (`feishuConfig.js`) - 处理飞书集成配置

#### 3.1.2 样式模块
- **基础样式** (`base.css`) - 全局基础样式和重置
- **字节风设计系统** (`byte-design-system.css`) - 字节风设计规范实现
- **活动颜色样式** (`activity-colors.css`) - 活动分类颜色定义，采用统一的颜色管理体系
- **活动按钮样式** (`activity-buttons.css`) - 活动按钮样式定义
- **控制按钮样式** (`control-buttons.css`) - 控制按钮样式定义
- **详情表单样式** (`detail-form.css`) - 记录详情表单样式
- **详情模态框样式** (`detail-modal.css`) - 记录详情模态框样式
- **情绪标签样式** (`emotion-tag.css`) - 情绪标签样式定义
- **标签样式** (`labels.css`) - 活动标签样式定义
- **布局样式** (`layout.css`) - 页面布局样式定义
- **导航样式** (`navigation.css`) - 导航栏样式定义
- **结论样式** (`conclusion.css`) - 结论区域样式定义
- **分页样式** (`pagination.css`) - 分页组件样式定义
- **心情墙样式** (`mood-wall.css`) - 心情墙组件样式定义
- **活动分类样式** (`activity-category.css`) - 活动分类管理样式定义
- **每日计划样式** (`daily-plan.css`) - 今日计划样式定义
- **飞书配置样式** (`feishu-config.css`) - 飞书配置样式定义
- **飞书导入样式** (`feishu-import.css`) - 飞书导入功能样式定义
- **活动选择优化样式** (`activity-selection-optimized.css`) - 活动选择弹窗优化样式定义
- **活动选择按钮样式** (`activity-selection-buttons.css`) - 活动选择弹窗按钮样式定义
- **导航优化样式** (`navigation-optimized.css`) - 导航栏优化样式定义
- **每日计划原始样式** (`daily-plan-original.css`) - 今日计划原始样式定义
- **详情区域样式** (`detail-sections.css`) - 详情区域样式定义
- **活动管理分类样式** (`manage-categories.css`) - 活动分类管理页面样式定义

### 3.2 颜色管理体系
系统采用统一的颜色管理体系，确保所有界面元素的颜色一致性：

1. **颜色定义集中化**：所有活动分类颜色定义集中存储在[data/activity_categories.json](file:///Users/amy/Documents/codes/time_recoder/data/activity_categories.json)文件中
2. **前端映射统一化**：通过[static/js/modules/config.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/config.js)中的[colorClassMap](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/config.js#L59-L66)对象实现颜色值到CSS类名的统一映射
3. **CSS样式模块化**：通过[static/css/modules/activity-colors.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-colors.css)文件定义所有活动分类的CSS样式
4. **颜色使用规范化**：所有模块通过导入配置和CSS类名使用颜色，避免硬编码和重复定义

这种设计确保了颜色定义的一致性和可维护性，任何颜色调整只需修改配置文件和CSS文件即可全局生效。

## 4. 数据流逻辑

### 4.1 核心数据流

#### 4.1.1 活动记录数据流
```
用户选择活动
    ↓
创建活动记录
    ↓
开始计时
    ↓
暂停/继续操作创建段落
    ↓
停止计时
    ↓
保存记录到本地JSON文件
    ↓
可选：同步当前记录到飞书多维表格（在保存活动详情或停止计时时单独同步）
```

#### 4.1.2 今日计划数据流
```
用户填写今日计划
    ↓
自动保存到本地JSON文件（每小时）
    ↓
可选：同步到飞书多维表格
    ↓
次日自动加载新日期的计划
```

#### 4.1.3 飞书数据同步数据流
```
用户配置飞书集成
    ↓
验证飞书链接有效性
    ↓
从飞书导入数据（活动记录和今日计划）
    ↓
保存到本地JSON文件
    ↓
应用正常启动并显示同步数据
```

#### 4.1.4 飞书数据导入数据流（v1.2.13优化）
```
用户点击【从飞书导入】按钮
    ↓
调用 [/api/feishu/sync-records](file:///Users/amy/Documents/codes/time_recoder/app.py#L2253-L2286) 接口同步活动记录
    ↓
调用 [/api/feishu/sync-plans](file:///Users/amy/Documents/codes/time_recoder/app.py#L1514-L1582) 接口同步今日计划
    ↓
保存到本地JSON文件（records.json和plans.json）
    ↓
刷新页面显示导入的数据
```

### 4.2 数据结构

#### 4.2.1 活动记录结构
```json
{
  "id": "记录唯一标识符",
  "date": "记录日期 (YYYY/MM/DD)",
  "activity": "活动名称",
  "activityCategory": "活动类别",
  "startTime": "开始时间 (ISO 8601格式)",
  "endTime": "结束时间 (ISO 8601格式)",
  "duration": "专注时长 (毫秒)",
  "timeSpan": "时间跨度 (毫秒)",
  "pauseCount": "暂停次数",
  "remark": "备注信息",
  "emotion": "情绪记录 (逗号分隔的字符串)",
  "segments": [
    {
      "start": "段落开始时间 (ISO 8601格式)",
      "end": "段落结束时间 (ISO 8601格式)"
    }
  ]
}
```

#### 4.2.2 今日计划结构
```json
{
  "date": "计划日期 (YYYY-MM-DD)",
  "importantThings": ["重要事项1", "重要事项2", "重要事项3"],
  "tryThings": ["尝试事项1", "尝试事项2", "尝试事项3"],
  "otherMatters": "其他事项",
  "reading": "阅读计划",
  "score": "今日评分",
  "scoreReason": "评分原因",
  "totalDuration": "专注时长",
  "creationDuration": "创作时长",
  "activityCount": "活动次数",
  "activities": ["活动1", "活动2"],
  "emotions": ["情绪1", "情绪2"],
  "activityCategories": ["类别1", "类别2"],
  "lastSyncTime": "最后同步时间",
  "feishuRecordId": "飞书记录ID"
}
```

**飞书字段映射说明**：
- `importantThings` 对应飞书多维表格中的 "今天重要的三件事" 字段
- `tryThings` 对应飞书多维表格中的 "今天要尝试的三件事" 字段
- `score` 对应飞书多维表格中的 "给今天打个分" 字段
- `scoreReason` 对应飞书多维表格中的 "为什么？" 字段

## 5. 飞书集成架构

### 5.1 飞书配置管理
- 通过 `/api/feishu/config` 接口管理飞书配置
- 支持App ID和App Secret的配置和持久化

### 5.2 数据同步机制
- 支持活动记录和今日计划的双向同步
- 自动同步机制（今日计划每小时自动同步），可通过飞书配置页面的【自动同步至飞书】开关控制启用/禁用
- 收起同步机制（点击【收起】按钮时执行同步），不受【自动同步至飞书】开关影响，只要配置了飞书就会同步
- 手动同步机制（通过飞书配置页面触发）
- **支持通过【从飞书导入】按钮一次性同步活动记录和今日计划**
- **同步时准确处理activityCategory字段，确保活动类别信息正确同步**
- **对于飞书多维表格中已存在的记录（通过id字段判断），执行更新操作而不是创建新记录，避免数据重复**
- **优化：移除同步所有记录到飞书的逻辑，改为在每次保存单独活动详情和停止一次活动计时时，单独同步该记录到飞书多维表格**

## 6. 快速记录功能更新 (2025-11-01)

### 6.1 界面布局更新
- 将快速记录情绪和快速记录收获功能从独立区域整合为并排的两栏布局
- 使用Flexbox实现响应式两栏设计，在移动端自动切换为单列布局
- 统一两栏的高度，确保界面美观一致

### 6.2 功能交互更新
- 两栏区域在开始计时时同时显示，在停止计时时同时隐藏
- 快速记录情绪和收获的内容保持独立，互不影响
- 收获内容直接与记录字段保持一致，不进行追加操作
- 点击【继续】按钮时，快速记录情绪信息应与原记录保持一致