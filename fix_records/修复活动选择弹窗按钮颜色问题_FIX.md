# 修复活动选择弹窗按钮颜色问题

## 问题描述
在活动选择弹窗中，按钮颜色应该和活动类型对应的配色保持一致，但大部分按钮都是白色底，导致文字看不清楚。

## 问题分析
1. 在[activity-buttons.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-buttons.css)文件中，[activity-btn](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-buttons.css#L17-L42)类设置了`color: white;`，这会导致所有按钮的文字都是白色。
2. 在[activity-selection-optimized.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-selection-optimized.css)文件中，虽然尝试将颜色设置为`#333`（深灰色），但没有针对不同背景色的按钮设置合适的文字颜色。
3. 不同颜色的背景需要不同的文字颜色才能保证足够的对比度：
   - 深色背景（蓝色、绿色、紫色、橙色、青色）需要白色文字
   - 浅色背景（灰色）需要深色文字

## 修复方案
在[activity-selection-optimized.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-selection-optimized.css)文件中，为不同类别的按钮设置合适的文字颜色：
1. 为蓝色、绿色、紫色、橙色、青色背景的按钮设置白色文字
2. 为灰色背景的按钮设置深色文字

## 修改的文件
- [/Users/amy/Documents/codes/time_recoder/static/css/modules/activity-selection-optimized.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-selection-optimized.css)

## 验证方法
1. 打开活动选择弹窗
2. 检查各类别按钮的颜色和文字对比度
3. 确保所有按钮的文字都清晰可见