# 修复日志歧义问题

## 问题描述
如果checkAndSyncToFeishu函数可能不会执行保存，"今日计划已自动保存"这个日志有歧义。

## 问题分析
在[savePlan](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/dailyPlan.js#L564-L589)函数中，当日志打印"今日计划已自动保存"时，实际上只是本地保存成功，而[checkAndSyncToFeishu](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/dailyPlan.js#L610-L632)函数可能会因为飞书未配置或自动同步开关未启用而不执行同步操作。这会导致日志信息有歧义，让人误以为同步也已经完成。

## 解决方案
将日志信息从"今日计划已自动保存"修改为"今日计划已保存到本地"，明确表示这只是本地保存操作，不包含同步操作。

## 修改的文件
- [/Users/amy/Documents/codes/time_recoder/static/js/modules/dailyPlan.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/dailyPlan.js)

## 验证方法
1. 触发今日计划保存操作
2. 检查控制台日志输出
3. 确认日志信息已更新为"今日计划已保存到本地"