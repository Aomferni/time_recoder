# 时间追踪器

一个基于Python Flask的时间追踪Web应用，帮助用户记录和管理日常活动时间。

## 功能特点

1. **活动时间追踪**
   - 实时计时功能，精确到秒
   - 支持活动暂停和继续
   - 自动记录活动开始和结束时间
   - 支持段落记录，可记录多个专注时间段

2. **活动分类管理**
   - 提供多种预设活动类别
   - 支持自定义活动类别
   - 按类别统计时间分配

| 分类名称 | 颜色标识 | 包含活动示例 | 用途说明 |
|---------|---------|-------------|----------|
| 工作输出 | 蓝色 | 梳理方案、开会、执行工作、复盘 | 记录核心工作时间 |
| 大脑充电 | 绿色 | 和智者对话、做调研 | 学习和思考时间 |
| 身体充电 | 绿色 | 健身、散步 | 运动和身体锻炼 |
| 修养生息 | 紫色 | 处理日常、进入工作状态、睡觉仪式 | 休息和准备时间 |
| 输出创作 | 橙色 | 创作/写作、玩玩具 | 创造性活动时间 |
| 暂停一下 | 青色 | 交流心得、记录\|反思\|计划 | 短暂休息和反思 |
| 纯属娱乐 | 灰色 | 刷手机 | 娱乐消遣时间 |

3. **记录管理**
   - 添加、编辑和删除时间记录
   - 查看历史记录（支持分页和筛选）
   - 为记录添加备注和情绪标签
   - 支持段落时间管理

4. **数据统计**
   - 今日时间统计
   - 活动次数统计
   - 按时间段查看记录
   - 情绪和活动类型可视化展示

5. **用户管理**
   - 支持多用户使用
   - 用户数据隔离
   - 用户数据迁移

6. **数据可视化**
   - 情绪墙展示情绪变化趋势
   - 活动类型墙展示活动分布
   - 关键词词云展示关注点

## 核心技术路线

1. **后端技术栈**
   - Python 3.x
   - Flask Web框架
   - JSON文件存储（无需数据库）
   - RESTful API设计

2. **前端技术栈**
   - HTML5
   - CSS3
   - JavaScript (原生，ES6模块化)
   - AJAX异步请求

3. **架构设计**
   - MVC模式（Model-View-Controller）
   - 前后端分离（通过API交互）
   - 响应式设计（适配移动端）
   - 模块化设计（CSS和JavaScript模块化）

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
- 端口配置：在[app.py](file:///Users/mac/Documents/local-Datawhale%E6%95%99%E7%A0%94/%E5%A5%BD%E7%94%A8%E7%9A%84%E5%B7%A5%E5%85%B7/time_recoder/app.py)中修改`app.run()`的port参数
- 数据存储路径：在[app.py](file:///Users/mac/Documents/local-Datawhale%E6%95%99%E7%A0%94/%E5%A5%BD%E7%94%A8%E7%9A%84%E5%B7%A5%E5%85%B7/time_recoder/app.py)中修改`DATA_FOLDER`常量
- 调试模式：在[app.py](file:///Users/mac/Documents/local-Datawhale%E6%95%99%E7%A0%94/%E5%A5%BD%E7%94%A8%E7%9A%84%E5%B7%A5%E5%85%B7/time_recoder/app.py)中修改`app.run()`的debug参数

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

#### 前端核心模块

1. **配置模块** (`static/js/modules/config.js`)
   - 管理全局配置和状态变量
   - 提供状态管理的setter函数

2. **工具模块** (`static/js/modules/utils.js`)
   - `TimeRecorderFrontendUtils` 对象，包含所有工具函数
   - 时间格式化函数
   - 持续时间计算函数
   - CSS类名映射函数
   - 情绪颜色处理函数
   - 时间字符串解析函数

3. **API模块** (`static/js/modules/api.js`)
   - `TimeRecorderAPI` 对象，包含所有API调用函数
   - 活动类别加载接口
   - 用户名设置接口
   - 记录增删改查接口
   - 统计信息获取接口
   - 所有记录加载接口（带筛选和分页）

4. **UI模块** (`static/js/modules/ui.js`)
   - `TimeRecorderUI` 对象，包含所有UI操作函数
   - 活动按钮渲染和更新
   - 记录表格显示和更新
   - 记录详情弹窗显示
   - 用户交互事件处理

5. **计时器模块** (`static/js/modules/timer.js`)
   - `TimeRecorderTimer` 对象，包含所有计时器相关函数
   - 计时器启动/停止逻辑
   - 时间显示更新
   - 记录创建和更新

6. **记录详情模块** (`static/js/modules/recordDetail.js`)
   - `TimeRecorderRecordDetail` 对象，包含所有记录详情操作函数
   - 记录详情显示（简化版和完整版）
   - 记录编辑和保存功能
   - 段落管理功能
   - 统一的模态框控制

7. **主模块** (`static/js/modules/main.js`)
   - 应用初始化和模块协调
   - DOM加载完成后的初始化逻辑
   - 事件监听器绑定
   - 模块间协调和全局状态管理

### 项目结构

```
time_recoder/
├── app.py              # Flask应用主文件
├── requirements.txt    # 项目依赖
├── README.md           # 项目说明文档
├── structure.md        # 架构设计文档
├── VERSION.md          # 版本更新记录
├── data/               # 数据存储目录
│   └── {username}/     # 用户数据目录
│       └── records_{username}.json  # 用户记录文件
├── templates/          # HTML模板目录
│   ├── base.html       # 基础模板
│   ├── index.html      # 主页面模板
│   ├── records.html    # 记录页面模板
│   ├── mood_wall.html  # 情绪墙页面模板
│   ├── manage_categories.html # 类别管理页面模板
│   └── project_description.html # 项目说明页面
├── fix_records/        # 修复记录目录
└── static/             # 静态文件目录
    ├── css/
    │   ├── style.css   # 样式文件
    │   └── modules/    # CSS模块目录
    │       ├── base.css              # 基础样式模块
    │       ├── user-section.css      # 用户区域模块
    │       ├── layout.css            # 布局模块
    │       ├── activity-buttons.css  # 活动按钮模块
    │       ├── activity-colors.css   # 活动颜色模块
    │       ├── timer.css             # 计时器模块
    │       ├── control-buttons.css   # 控制按钮模块
    │       ├── detail-modal.css      # 详情模态框模块
    │       ├── detail-form.css       # 详情表单模块
    │       ├── navigation.css        # 导航模块
    │       ├── records-table.css     # 记录表格模块
    │       ├── stats.css             # 统计模块
    │       ├── labels.css            # 标签模块
    │       ├── manage-categories.css # 类别管理模块
    │       ├── records-controls.css  # 记录控制模块
    │       ├── pagination.css        # 分页模块
    │       ├── segments.css          # 段落模块
    │       ├── record-detail.css     # 记录详情模块
    │       ├── selected-record.css   # 选中记录模块
    │       ├── detail-sections.css   # 详情分段模块
    │       ├── remark.css            # 收获记录模块
    │       ├── activity-category.css # 活动类别模块
    │       ├── start-time.css        # 开始时间模块
    │       ├── emotion-tag.css       # 情绪标签模块
    │       ├── mood-wall.css         # 情绪墙模块
    │       └── control-btn.css       # 控制按钮特殊样式
    └── js/
        ├── script.js   # JavaScript主文件（模块入口）
        └── modules/    # JavaScript模块目录
            ├── config.js    # 配置模块
            ├── utils.js     # 工具模块
            ├── api.js       # API模块
            ├── ui.js        # UI模块
            ├── timer.js     # 计时器模块
            ├── recordDetail.js # 记录详情模块
            └── main.js      # 主模块

```

## 贡献指南

欢迎对项目进行贡献！请遵循以下步骤：
1. Fork项目
2. 创建功能分支
3. 提交更改
4. 发起Pull Request

## 许可证

本项目采用MIT许可证，详情请见[LICENSE](./LICENSE)文件。