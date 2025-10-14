# 新增飞书配置功能

## 问题描述
在历史记录页面缺少飞书配置功能，用户无法直接在页面上配置飞书应用的App ID和App Secret。

## 解决方案
1. 在后端添加更新飞书配置的API接口
2. 在历史记录页面添加飞书配置按钮
3. 创建飞书配置模态框
4. 添加相应的CSS样式
5. 在前端JavaScript中实现飞书配置的显示和保存功能

## 修改的文件和函数

### 1. 后端 (app.py)
- 添加了 `update_feishu_config()` 函数，用于处理飞书配置的更新请求
- 在 `FeishuBitableAPI` 类中添加了配置保存功能
- 添加了 `/api/feishu/config` 的POST路由

### 2. 前端模板 (templates/records.html)
- 添加了"飞书配置"按钮
- 创建了飞书配置模态框
- 引入了新的CSS文件

### 3. CSS样式 (static/css/modules/feishu-config.css)
- 创建了新的CSS文件，定义飞书配置按钮和模态框的样式

### 4. CSS模块 (static/css/modules/records-controls.css)
- 更新了按钮样式，使飞书配置按钮与其他按钮保持一致

### 5. 基础模板 (templates/base.html)
- 添加了飞书配置CSS文件的引用

### 6. JavaScript模块 (static/js/modules/records.js)
- 添加了 `showFeishuConfig()` 函数，用于显示飞书配置模态框
- 添加了 `closeFeishuConfigModal()` 函数，用于关闭飞书配置模态框
- 添加了 `saveFeishuConfig()` 函数，用于保存飞书配置

## 数据流逻辑
1. 用户点击历史记录页面的"飞书配置"按钮
2. 前端通过GET请求获取当前的飞书配置信息
3. 显示飞书配置模态框，并填充当前配置信息
4. 用户修改配置信息后点击"保存"按钮
5. 前端通过POST请求将新的配置信息发送到后端
6. 后端验证并保存配置信息到config/feishu_config.json文件
7. 返回保存结果给前端，前端显示成功或失败信息

## 测试验证
- 验证飞书配置按钮在历史记录页面正确显示
- 验证点击按钮能正确打开飞书配置模态框
- 验证模态框能正确显示当前配置信息
- 验证用户能成功保存新的配置信息
- 验证配置信息能正确保存到文件中