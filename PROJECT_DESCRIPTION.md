# 时间追踪器项目说明

## 项目概述

时间追踪器是一个基于Python Flask的时间追踪Web应用，帮助用户记录和管理日常活动时间。该应用允许用户按类别记录活动，追踪时间消耗，并提供统计分析功能，帮助用户更好地了解和管理自己的时间分配。

## 面向用户的功能说明

### 主要功能

1. **活动时间追踪**
   - 实时计时功能，精确到秒
   - 支持活动暂停和继续
   - 自动记录活动开始和结束时间

2. **活动分类管理**
   - 提供多种预设活动类别
   - 支持自定义活动类别
   - 按类别统计时间分配

3. **记录管理**
   - 添加、编辑和删除时间记录
   - 查看历史记录（支持分页和筛选）
   - 为记录添加备注和情绪标签

4. **数据统计**
   - 今日时间统计
   - 活动次数统计
   - 按时间段查看记录

5. **用户管理**
   - 支持多用户使用
   - 用户数据隔离
   - 用户数据迁移

### 具体的分类与数据映射关系

#### 活动分类体系

| 分类名称 | 颜色标识 | 包含活动示例 | 用途说明 |
|---------|---------|-------------|----------|
| 工作输出 | 蓝色 | 梳理方案、开会、执行工作、复盘 | 记录核心工作时间 |
| 大脑充电 | 绿色 | 和智者对话、做调研 | 学习和思考时间 |
| 身体充电 | 绿色 | 健身、散步 | 运动和身体锻炼 |
| 修养生息 | 紫色 | 处理日常、进入工作状态、睡觉仪式 | 休息和准备时间 |
| 输出创作 | 橙色 | 创作/写作、玩玩具 | 创造性活动时间 |
| 暂停一下 | 青色 | 交流心得、记录\|反思\|计划 | 短暂休息和反思 |
| 纯属娱乐 | 灰色 | 刷手机 | 娱乐消遣时间 |

#### 数据结构映射

1. **记录数据结构**
   ```json
   {
     "id": "唯一标识符",
     "activity": "活动名称",
     "activityCategory": "活动类别",
     "date": "日期",
     "startTime": "开始时间",
     "endTime": "结束时间",
     "duration": "计时时长(毫秒)",
     "timeSpan": "时间跨度(毫秒)",
     "remark": "备注信息",
     "emotion": "情绪标签",
     "pauseCount": "暂停次数",
     "segments": "段落记录"
   }
   ```

2. **用户数据存储**
   - 每个用户的数据存储在独立的JSON文件中
   - 文件路径：`data/{username}/records_{username}.json`
   - 支持用户数据迁移

## 面向开发者的技术说明

### 核心技术路线

1. **后端技术栈**
   - Python 3.x
   - Flask Web框架
   - JSON文件存储（无需数据库）
   - RESTful API设计

2. **前端技术栈**
   - HTML5
   - CSS3
   - JavaScript (原生，无框架)
   - AJAX异步请求

3. **架构设计**
   - MVC模式（Model-View-Controller）
   - 前后端分离（通过API交互）
   - 响应式设计（适配移动端）

### 核心函数说明

#### 后端核心函数 (app.py)

1. **数据管理函数**
   - `get_data_file_path(username)` - 获取用户数据文件路径
   - `load_records_by_username(username)` - 加载指定用户记录
   - `load_all_records(username)` - 加载所有用户记录
   - `save_records(records, username)` - 保存记录到文件
   - `migrate_user_records(old_username, new_username)` - 迁移用户记录

2. **API接口函数**
   - `set_username()` - 设置用户名并迁移记录
   - `get_records()` - 获取今日记录
   - `get_record(record_id)` - 获取单个记录详情
   - `add_record()` - 添加新记录
   - `update_record(record_id)` - 更新记录
   - `delete_record(record_id)` - 删除记录
   - `get_all_records()` - 获取所有记录（支持筛选和分页）
   - `get_stats()` - 获取统计信息

3. **辅助函数**
   - `get_activity_category(activity)` - 根据活动名称获取类别
   - `calculate_time_span(startTime, endTime)` - 计算时间跨度

#### 前端核心函数 (static/js/script.js)

1. **界面控制函数**
   - `toggleTimer()` - 切换计时器状态（开始/暂停）
   - `updateTimer()` - 更新计时器显示
   - `resetTimer()` - 重置计时器
   - `stopTimer()` - 停止计时

2. **数据处理函数**
   - `loadRecords()` - 从后端加载记录
   - `updateRecordsTable()` - 更新记录表格显示
   - `addRecord(record)` - 添加记录到后端
   - `updateRecordEndTime(recordId, endTime)` - 更新记录结束时间
   - `deleteRecord(recordId)` - 删除记录

3. **UI交互函数**
   - `showRecordDetail(recordId)` - 显示记录详情
   - `saveRecordDetail(recordId)` - 保存记录详情
   - `closeRecordDetailModal()` - 关闭详情浮窗
   - `continueActivity(recordId)` - 继续活动

4. **辅助函数**
   - `formatTime(date)` - 格式化时间显示
   - `formatDuration(milliseconds)` - 格式化时长显示
   - `parseDurationString(durationStr)` - 解析时长字符串
   - `getActivityClass(activity, activityCategory)` - 获取活动CSS类

### 项目结构

```
time_recoder/
├── app.py              # Flask应用主文件
├── requirements.txt    # 项目依赖
├── README.md           # 项目说明文档
├── PROJECT_DESCRIPTION.md  # 详细项目说明（本文档）
├── data/               # 数据存储目录
│   └── {username}/     # 用户数据目录
│       └── records_{username}.json  # 用户记录文件
├── templates/          # HTML模板目录
│   ├── base.html       # 基础模板
│   ├── index.html      # 主页面模板
│   └── records.html    # 记录页面模板
└── static/             # 静态文件目录
    ├── css/
    │   └── style.css   # 样式文件
    └── js/
        └── script.js   # JavaScript文件
```

## 未来功能展望

### 短期计划（1-3个月）

1. **数据分析增强**
   - 添加周/月/年统计视图
   - 实现活动时间趋势分析
   - 增加时间使用效率评估

2. **用户体验优化**
   - 添加活动时间目标设定
   - 实现提醒功能（如长时间未记录提醒）
   - 增加数据导出功能（CSV/Excel格式）

3. **界面改进**
   - 添加图表可视化（饼图、柱状图等）
   - 实现暗色主题
   - 优化移动端体验

### 中期计划（3-6个月）

1. **社交功能**
   - 添加好友系统
   - 实现时间使用排行榜
   - 增加活动分享功能

2. **智能推荐**
   - 基于历史数据推荐活动安排
   - 实现时间分配优化建议
   - 添加智能分类建议

3. **多平台支持**
   - 开发桌面应用（Electron）
   - 实现移动端APP（React Native）

### 长期计划（6个月以上）

1. **AI集成**
   - 集成AI助手提供时间管理建议
   - 实现自然语言记录（语音转文字）
   - 添加智能情绪分析

2. **团队协作**
   - 实现团队时间追踪
   - 添加项目时间管理功能
   - 集成项目管理工具

3. **生态系统**
   - 开发插件系统
   - 实现第三方应用集成
   - 创建开发者API

## 部署和运行

### 环境要求
- Python 3.6+
- Flask 2.0+
- 现代浏览器（支持ES6）

### 安装步骤
1. 克隆项目代码
2. 安装依赖：`pip install -r requirements.txt`
3. 运行应用：`python app.py`
4. 在浏览器中访问 `http://localhost:5002`

### 配置说明
- 端口配置：在[app.py](file:///Users/amy/Documents/codes/time_recoder/app.py)中修改`app.run()`的port参数
- 数据存储路径：在[app.py](file:///Users/amy/Documents/codes/time_recoder/app.py)中修改`DATA_FOLDER`常量
- 调试模式：在[app.py](file:///Users/amy/Documents/codes/time_recoder/app.py)中修改`app.run()`的debug参数

## 贡献指南

欢迎对项目进行贡献！请遵循以下步骤：
1. Fork项目
2. 创建功能分支
3. 提交更改
4. 发起Pull Request

## 许可证

本项目采用MIT许可证，详情请见[LICENSE](file:///Users/amy/Documents/codes/time_recoder/LICENSE)文件。