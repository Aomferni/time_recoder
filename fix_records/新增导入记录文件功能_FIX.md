# 新增导入记录文件功能

## 问题描述
需要新增一个按钮，支持导入用户的record.json文件。

## 解决方案
1. 在管理类别页面添加导入功能按钮
2. 实现后端API处理文件上传和数据导入
3. 添加前端文件选择和上传功能

## 修改内容

### 1. 前端修改
在 [/templates/manage_categories.html](file:///Users/amy/Documents/codes/time_recoder/templates/manage_categories.html) 文件中：
- 添加文件选择和上传按钮
- 实现文件上传功能的JavaScript代码

### 2. 后端修改
在 [/app.py](file:///Users/amy/Documents/codes/time_recoder/app.py) 文件中：
- 添加处理文件上传的API路由
- 实现数据导入逻辑

## 验证结果
修改后，用户可以通过管理类别页面导入record.json文件，实现数据迁移功能。