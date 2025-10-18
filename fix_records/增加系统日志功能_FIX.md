# 增加系统日志功能

## 需求描述
增加一个日志功能，把所有的操作和处理都记录在日志当中，仅保留近2个小时的日志。

## 解决方案
实现了一个完整的日志系统，包括前端和后端两部分：

### 前端日志模块
1. 创建了[logger.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/logger.js)模块，提供统一的日志记录接口
2. 在关键模块中集成日志记录：
   - [moodWall.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/moodWall.js)：记录墙数据加载和渲染过程
   - [api.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/api.js)：记录API调用过程
   - [recordDetail.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/recordDetail.js)：记录记录详情操作过程

### 后端日志模块
1. 创建了[utils/logger.py](file:///Users/amy/Documents/codes/time_recoder/utils/logger.py)模块，提供后端日志记录功能
2. 实现了日志文件的自动清理功能，仅保留2小时内的日志

### 日志查看页面
1. 创建了[logs.html](file:///Users/amy/Documents/codes/time_recoder/templates/logs.html)模板，提供友好的日志查看界面
2. 实现了日志筛选、分页、导出和清空功能
3. 添加了API端点用于获取和清空日志数据

### 导航集成
1. 在情绪墙页面添加了系统日志链接
2. 可以通过导航栏直接访问日志查看页面

## 修改文件
1. [/Users/amy/Documents/codes/time_recoder/static/js/modules/logger.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/logger.js) - 新建前端日志模块
2. [/Users/amy/Documents/codes/time_recoder/static/js/modules/moodWall.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/moodWall.js) - 集成日志记录
3. [/Users/amy/Documents/codes/time_recoder/static/js/modules/api.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/api.js) - 集成日志记录
4. [/Users/amy/Documents/codes/time_recoder/static/js/modules/recordDetail.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/recordDetail.js) - 集成日志记录
5. [/Users/amy/Documents/codes/time_recoder/utils/logger.py](file:///Users/amy/Documents/codes/time_recoder/utils/logger.py) - 新建后端日志模块
6. [/Users/amy/Documents/codes/time_recoder/app.py](file:///Users/amy/Documents/codes/time_recoder/app.py) - 添加日志API端点和路由
7. [/Users/amy/Documents/codes/time_recoder/templates/logs.html](file:///Users/amy/Documents/codes/time_recoder/templates/logs.html) - 新建日志查看页面
8. [/Users/amy/Documents/codes/time_recoder/templates/mood_wall.html](file:///Users/amy/Documents/codes/time_recoder/templates/mood_wall.html) - 添加日志页面链接

## 验证结果
1. 前端和后端的所有操作都会被记录到日志中
2. 日志会自动清理，仅保留2小时内的记录
3. 可以通过日志查看页面方便地查看、筛选和导出日志
4. 日志记录不会影响系统的正常运行性能