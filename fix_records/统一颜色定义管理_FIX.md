# 统一颜色定义管理

## 问题描述
好多地方都在重复定义这些颜色，应该在一个地方统一管理。

## 问题分析
通过代码分析，发现颜色定义存在以下问题：
1. 颜色值在多个文件中重复定义，包括：
   - [data/activity_categories.json](file:///Users/amy/Documents/codes/time_recoder/data/activity_categories.json) - 活动分类颜色配置
   - [static/js/modules/config.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/config.js) - JavaScript颜色映射
   - [static/css/modules/activity-colors.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-colors.css) - CSS颜色样式
   - [templates/manage_categories.html](file:///Users/amy/Documents/codes/time_recoder/templates/manage_categories.html) - 活动分类管理页面颜色映射

2. 缺乏统一的颜色管理策略说明，导致维护困难

## 解决方案
1. 在PRD文档中澄清颜色定义的统一管理策略
2. 在structure文档中更新技术架构说明，明确颜色管理体系
3. 确保所有颜色定义都基于[data/activity_categories.json](file:///Users/amy/Documents/codes/time_recoder/data/activity_categories.json)文件，其他地方通过导入或引用使用
4. 建立清晰的颜色使用规范，避免硬编码和重复定义

## 修改的文件
- [/Users/amy/Documents/codes/time_recoder/PRD.md](file:///Users/amy/Documents/codes/time_recoder/PRD.md)
- [/Users/amy/Documents/codes/time_recoder/structure.md](file:///Users/amy/Documents/codes/time_recoder/structure.md)

## 验证方法
1. 检查PRD文档是否添加了颜色体系说明
2. 检查structure文档是否更新了颜色管理体系说明
3. 确认各模块的颜色使用是否遵循统一管理策略