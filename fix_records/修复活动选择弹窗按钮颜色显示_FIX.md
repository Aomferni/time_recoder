# 修复活动选择弹窗按钮颜色显示

## 问题描述
活动选择弹窗中的按钮仍然显示为浅灰色背景，颜色显示不正确。

## 问题分析
通过深入分析，发现以下问题：
1. 尽管已经在[activity-selection-optimized.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-selection-optimized.css)中定义了按钮样式，但由于CSS选择器优先级不够高，样式没有正确应用
2. 多个CSS文件中定义了相似的按钮样式，存在潜在的冲突
3. 活动选择弹窗是一个特殊场景，需要更高优先级的样式定义

## 解决方案
1. 创建一个新的CSS文件[activity-selection-buttons.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-selection-buttons.css)，专门用于活动选择弹窗的按钮样式
2. 在新文件中使用更高优先级的选择器`#activitySelectionModal button.activity-btn`
3. 直接使用十六进制颜色值而不是CSS变量，确保颜色正确显示
4. 在base.html中引入新的CSS文件，确保它在其他样式文件之后加载

## 修改的文件
- 创建[/Users/amy/Documents/codes/time_recoder/static/css/modules/activity-selection-buttons.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-selection-buttons.css)
- 修改[/Users/amy/Documents/codes/time_recoder/templates/base.html](file:///Users/amy/Documents/codes/time_recoder/templates/base.html)

## 验证方法
1. 打开活动选择弹窗
2. 检查各类别按钮的背景颜色和文字颜色是否正确显示
3. 确认工作输出类（蓝色）、充电类（绿色）、修养生息类（紫色）、输出创作类（橙色）、暂停一下类（青色）、纯属娱乐类（灰色）都显示正确的背景颜色
4. 验证按钮文字与背景有足够的对比度