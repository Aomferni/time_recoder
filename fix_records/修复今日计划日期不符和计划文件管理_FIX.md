# 修复今日计划日期不符和计划文件管理问题

## 问题描述
1. 当请求的今日计划日期与实际日期不符时，系统仍然返回旧日期的计划而不是创建新的当日计划
2. 所有今日计划记录没有统一管理，需要将所有计划记录到一个索引文件plans.json中，便于管理和查询

## 问题分析
通过代码分析发现：
1. 在`DailyPlanUtils.load_daily_plan`函数中，没有检查请求的日期是否与当前日期一致，导致即使日期不匹配也会返回旧计划
2. 缺少统一的计划索引管理机制，所有计划文件分散存储，没有集中管理

## 解决方案
1. 修改`DailyPlanUtils.load_daily_plan`函数，添加日期检查逻辑：
   - 当请求的日期与当前日期不一致时，自动创建新的当日计划
2. 添加计划索引管理功能：
   - 创建`get_plans_index_file_path`函数获取索引文件路径
   - 创建`update_plans_index`函数更新索引文件
   - 每次保存计划时更新索引文件
3. 更新PRD.md和structure.md文档，添加关于plans.json的说明

## 修改的文件
- [/Users/amy/Documents/codes/time_recoder/app.py](file:///Users/amy/Documents/codes/time_recoder/app.py)
- [/Users/amy/Documents/codes/time_recoder/PRD.md](file:///Users/amy/Documents/codes/time_recoder/PRD.md)
- [/Users/amy/Documents/codes/time_recoder/structure.md](file:///Users/amy/Documents/codes/time_recoder/structure.md)

## 验证方法
1. 访问首页，检查今日计划日期显示是否正确
2. 查看`data/daily_plans`目录，确认是否生成了新的当日计划文件
3. 检查`data/daily_plans/plans.json`文件是否存在并包含正确的索引信息

## 影响范围
此修改仅影响今日计划功能，不会对其他功能产生影响。确保了用户始终看到正确日期的计划，并提供了更好的计划文件管理机制。