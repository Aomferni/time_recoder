# 修复记录：统一今日计划统计数据样式

## 问题描述
在【今日计划】模块中，【今日统计】在展开态与收起态的样式不一致：
- 展开态使用 [stats-grid](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/daily-plan.css#L272-L276) 和 [stat-item](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/daily-plan.css#L277-L284) 样式
- 收起态使用 [summary-stats](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/daily-plan.css#L106-L110) 和 [summary-stat-item](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/daily-plan.css#L111-L114) 样式

这导致了两种状态下的视觉呈现不一致，影响用户体验。

## 解决方案
修改CSS样式，使两种状态下的统计数据展示保持一致：

1. 统一使用相同的网格布局：
   - 将 [summary-stats](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/daily-plan.css#L106-L110) 的 `display` 属性从 `flex` 改为 `grid`
   - 统一 `grid-template-columns` 属性为 `repeat(auto-fit, minmax(200px, 1fr))`

2. 统一子项样式：
   - 将 [summary-stat-item](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/daily-plan.css#L111-L114) 的样式与 [stat-item](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/daily-plan.css#L277-L284) 保持一致
   - 统一 [stat-label](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/daily-plan.css#L285-L289) 和 [stat-value](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/daily-plan.css#L290-L294) 的样式

3. 响应式设计调整：
   - 在手机端媒体查询中，为 [summary-stats](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/daily-plan.css#L106-L110) 添加 `grid-template-columns: 1fr;` 以保持一致性

## 修改的文件
1. `/static/css/modules/daily-plan.css` - 统计数据样式调整
2. `/templates/index.html` - 确保HTML结构一致性

## 验证结果
通过本地测试，确认在展开态和收起态下，【今日统计】的样式现在保持一致，提升了用户体验的一致性。