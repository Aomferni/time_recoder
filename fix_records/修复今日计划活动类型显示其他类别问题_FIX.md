# 修复今日计划活动类型显示"其他"类别问题

## 问题描述
在今日计划的活动类型集合中，显示了"其他"类别，这不符合规范要求。活动墙上的小方块必须显示每条记录实际的activityCategory字段值，禁止使用"其他"等笼统分类。

## 问题分析
在`DailyPlanUtils.update_plan_from_records`方法中，直接从记录中获取`activityCategory`字段的值并添加到`activity_categories`集合中，但没有过滤掉值为"其他"的类别。这导致在今日计划的活动类型集合中显示了"其他"类别。

## 解决方案
修改`DailyPlanUtils.update_plan_from_records`方法，在收集活动类型时过滤掉值为"其他"的类别，确保只显示明确的活动类别。

## 修改的文件
1. [/Users/amy/Documents/codes/time_recoder/app.py](file:///Users/amy/Documents/codes/time_recoder/app.py)
   - 在[update_plan_from_records](file:///Users/amy/Documents/codes/time_recoder/app.py#L2248-L2314)方法中添加过滤逻辑，排除"其他"类别

## 验证方法
1. 创建一些包含"其他"类别的活动记录
2. 查看今日计划的活动类型集合
3. 验证"其他"类别不再显示在活动类型集合中
4. 验证其他明确的活动类别仍能正确显示