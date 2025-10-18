# 修复编辑历史日期计划跳转问题

## 问题描述
用户在编辑历史日期（如10月18日）的今日计划时，系统总是自动跳转到当前日期（如10月19日），这不符合用户预期。

## 问题分析
经过分析，发现问题出在后端API的`/api/daily-plan/sync-feishu`接口中。虽然前端正确传递了日期参数，但后端在加载计划时使用了[DailyPlanUtils.load_daily_plan()](file:///Users/amy/Documents/codes/time_recoder/app.py#L1897-L1921)函数的默认行为，该函数总是返回当日计划，而不是用户选择的日期计划。

具体问题点：
1. 在飞书同步接口中，后端没有正确使用前端传递的日期参数来加载对应的计划
2. [DailyPlanUtils.load_daily_plan()](file:///Users/amy/Documents/codes/time_recoder/app.py#L1897-L1921)函数在没有传入日期参数时，默认使用当前日期加载计划

## 解决方案
修改后端API的`/api/daily-plan/sync-feishu`接口，确保使用前端传递的日期参数来加载对应的计划：

```python
# 修复前：
plan = DailyPlanUtils.load_daily_plan()  # 总是加载当日计划

# 修复后：
plan = DailyPlanUtils.load_daily_plan(date_str)  # 使用指定日期加载计划
```

## 修改文件
1. [/Users/amy/Documents/codes/time_recoder/app.py](file:///Users/amy/Documents/codes/time_recoder/app.py) - 修复飞书同步接口中的计划加载逻辑

## 验证方法
1. 打开今日计划界面
2. 使用日期选择器选择一个历史日期（非当前日期）
3. 编辑该日期的计划内容
4. 点击收起按钮触发自动保存和同步
5. 验证系统是否仍然保持在历史日期界面，而不会跳转到当前日期

## 影响范围
该修复仅影响今日计划的飞书同步功能，确保同步操作针对当前编辑的日期而不是强制切换到当前日期。