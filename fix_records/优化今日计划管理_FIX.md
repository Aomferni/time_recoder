# 修复记录：优化今日计划管理

## 问题描述
今日计划管理功能存在以下问题：
1. [load_daily_plan](file:///Users/amy/Documents/codes/time_recoder/app.py#L1897-L1924)函数中存在重复代码，逻辑不清晰
2. 需要确保每次请求都返回当日计划，而不是指定日期的计划
3. 需要确保所有计划都保存在一个统一的索引文件中
4. 需要增加飞书记录ID字段用于记录飞书多维表格的记录ID

## 解决方案
1. 修复[load_daily_plan](file:///Users/amy/Documents/codes/time_recoder/app.py#L1897-L1924)函数中的重复代码问题，确保逻辑清晰
2. 修改[load_daily_plan](file:///Users/amy/Documents/codes/time_recoder/app.py#L1897-L1924)函数，确保总是返回当日计划
3. 确保[create_new_daily_plan](file:///Users/amy/Documents/codes/time_recoder/app.py#L1936-L1957)函数中包含feishuRecordId字段
4. 确保索引文件更新逻辑正确实现

## 修改的函数和数据流逻辑
1. **[load_daily_plan](file:///Users/amy/Documents/codes/time_recoder/app.py#L1897-L1924)函数**：
   - 修复重复代码问题
   - 确保总是使用当前日期加载计划
   - 如果当日计划不存在，则创建新的当日计划

2. **[create_new_daily_plan](file:///Users/amy/Documents/codes/time_recoder/app.py#L1936-L1957)函数**：
   - 确保包含feishuRecordId字段，初始值为None

3. **[update_plans_index](file:///Users/amy/Documents/codes/time_recoder/app.py#L1974-L1996)函数**：
   - 确保索引文件包含feishuRecordId字段

## 验证结果
1. 修复后的[load_daily_plan](file:///Users/amy/Documents/codes/time_recoder/app.py#L1897-L1924)函数逻辑清晰，无重复代码
2. 无论请求哪个日期，总是返回当日计划
3. 新创建的计划包含feishuRecordId字段
4. 索引文件正确更新，包含所有计划的元数据信息