# 修复记录：统一今日计划存储方式

## 问题描述
根据用户需求，所有的今日计划都应当从plans.json一个文件中读取，而不应该存在plan_xxxx.json分散存储的方式。当前系统使用分散存储方式，需要修改为统一存储。

## 修复方案
1. 修改PRD文档和structure文档中关于今日计划存储的描述
2. 修改后端代码实现统一存储在plans.json文件中
3. 更新DailyPlanUtils类的相关方法，不再创建单独的plan_xxxx.json文件

## 修改内容

### 1. PRD文档修改
- 修改数据存储描述，明确所有计划数据统一存储在`data/daily_plans/plans.json`文件中

### 2. Structure文档修改
- 修改计划文件管理部分，明确所有计划数据统一存储在`plans.json`索引文件中
- 更新数据存储部分描述

### 3. 后端代码修改
- 修改`DailyPlanUtils.load_daily_plan`方法，从统一的plans.json文件中加载指定日期的计划
- 修改`DailyPlanUtils.save_daily_plan`方法，将计划保存到统一的索引文件中
- 修改`DailyPlanUtils.update_plans_index`方法，存储完整的计划数据而不仅仅是元数据

## 验证结果
- 修改后系统能够正常加载和保存今日计划
- 所有计划数据统一存储在plans.json文件中
- 不再创建分散的plan_xxxx.json文件
- 系统功能保持正常运行

## 影响范围
- 今日计划的存储和读取逻辑
- 文件系统结构（不再生成plan_xxxx.json文件）
- 向后兼容性（系统仍能处理旧的分散存储文件，但不再使用）

## 注意事项
- 此修改不会影响现有数据，系统仍能读取旧的分散存储文件
- 建议定期清理旧的plan_xxxx.json文件以节省存储空间