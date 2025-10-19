# 修复飞书自动同步开关有效性

## 问题描述
用户反馈关闭了飞书配置弹窗中的【自动同步至飞书】开关，但系统仍然在整点执行同步操作。经过分析发现：
1. 自动保存计划时没有调用checkAndSyncToFeishu函数
2. checkAndSyncToFeishu函数只检查了飞书是否已配置，但没有检查自动同步开关是否开启。

## 解决方案
1. 修改savePlan函数，在保存成功后调用checkAndSyncToFeishu函数
2. 修改checkAndSyncToFeishu函数，同时检查飞书配置和自动同步开关状态
3. 只有在飞书已配置且自动同步开关启用的情况下才执行同步操作
4. 更新PRD和structure文档，明确说明自动同步开关的控制作用

## 修改的函数和数据流逻辑

### 修改的函数
1. `DailyPlanModule.savePlan` - 在保存成功后调用checkAndSyncToFeishu函数
2. `DailyPlanModule.checkAndSyncToFeishu` - 修改了飞书同步检查逻辑，增加了对自动同步开关的检查

### 数据流逻辑
1. 在今日计划自动保存时，系统会调用savePlan函数保存计划
2. savePlan函数在保存成功后会调用checkAndSyncToFeishu函数
3. checkAndSyncToFeishu函数会同时检查飞书配置和自动同步开关状态
4. 只有当飞书已配置且自动同步开关启用时，才会执行同步操作
5. 如果飞书未配置或自动同步开关未启用，系统会跳过同步操作并记录日志

## 验证结果
1. 关闭自动同步开关后，整点不再执行同步操作
2. 开启自动同步开关后，整点正常执行同步操作
3. PRD文档和structure文档已更新以反映这些变更