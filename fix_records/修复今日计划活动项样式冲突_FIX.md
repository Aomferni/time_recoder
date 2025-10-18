# 修复今日计划活动项样式冲突

## 问题描述
在今日计划的"今日做过的活动"部分，活动名称显示颜色不符合预期，这是由于CSS样式冲突和设计要求变更导致的。

## 问题分析
通过分析代码发现：
1. 在`static/css/style.css`中定义了`.activity-item`样式，用于今日记录详情表格
2. 在`static/css/modules/daily-plan.css`中也定义了`.activity-item`样式，用于今日计划
3. 由于CSS加载顺序和优先级问题，可能存在样式覆盖的情况
4. 根据最新设计要求，今日计划中的活动名称应该显示为黑色以与记录详情表格保持一致

## 解决方法
为避免样式冲突并满足设计要求，采取以下措施：
1. 将`daily-plan.css`中的`.activity-item`重命名为`.plan-activity-item`，避免与记录详情表格样式冲突
2. 将JavaScript代码中生成的HTML结构中的类名也相应更新
3. 修改`.activity-name`的颜色属性，从白色改为黑色，以与记录详情表格保持一致

## 修改的文件
- `static/css/modules/daily-plan.css` - 第278行，将`.activity-item`重命名为`.plan-activity-item`，并修改`.activity-name`颜色为黑色
- `static/js/modules/dailyPlan.js` - 第152行，将HTML模板中的`activity-item`更新为`plan-activity-item`

## 验证结果
修改后，今日计划中"今日做过的活动"部分的活动名称现在正确显示为黑色，与记录详情表格保持一致，避免了样式冲突问题。

## 设计优势
1. **避免样式冲突**：通过使用特定的类名前缀，避免了与其他模块的样式冲突
2. **保持一致性**：活动名称颜色与记录详情表格保持一致
3. **易于维护**：每个模块使用独立的CSS类名，便于后续维护