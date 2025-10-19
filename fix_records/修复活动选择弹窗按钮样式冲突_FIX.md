# 修复活动选择弹窗按钮样式冲突

## 问题描述
活动选择弹窗中的按钮仍然显示错误，分析发现是样式冲突导致的问题。

## 问题分析
通过代码分析，发现以下问题：
1. 在[activity-buttons.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-buttons.css)文件中，[.activity-btn](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-buttons.css#L17-L42)类设置了`color: white;`，这会影响所有活动按钮的文字颜色
2. [activity-buttons.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-buttons.css)在[activity-selection-optimized.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-selection-optimized.css)之前引入，可能导致样式冲突
3. CSS选择器优先级不够高，导致在活动选择弹窗中的按钮样式没有正确应用
4. 某些按钮类别缺少`!important`声明，导致样式被其他CSS规则覆盖

## 解决方案
1. 修改[activity-buttons.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-buttons.css)文件，移除可能导致冲突的`color: white`样式
2. 在[activity-selection-optimized.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-selection-optimized.css)中为所有按钮设置默认的背景和文字颜色
3. 为不同类别的按钮样式添加`!important`声明，确保优先级高于其他样式
4. 确保活动选择弹窗中的按钮样式能够正确覆盖其他样式

## 修改的文件
- [/Users/amy/Documents/codes/time_recoder/static/css/modules/activity-buttons.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-buttons.css)
- [/Users/amy/Documents/codes/time_recoder/static/css/modules/activity-selection-optimized.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-selection-optimized.css)

## 验证方法
1. 打开活动选择弹窗
2. 检查各类别按钮的背景颜色和文字颜色是否正确显示
3. 确认所有按钮都有合适的背景色和文字颜色，确保足够的对比度