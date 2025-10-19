# 修复活动选择弹窗按钮背景颜色

## 问题描述
【选择活动】的浮窗中，按钮背景就应该是对应的颜色展示，目前除了修养生息类和暂停一下类实对应颜色，其他的都是白色底。

## 问题分析
通过代码分析，发现以下问题：
1. 在[activity-selection-optimized.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-selection-optimized.css)文件中，虽然为不同类别的按钮设置了文字颜色，但没有为它们设置背景颜色
2. 背景颜色应该从[activity-colors.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-colors.css)文件中继承，但由于CSS选择器的优先级问题，可能没有正确应用
3. 修养生息类（.btn-rest）和暂停一下类（.btn-gap）的背景颜色是直接定义的十六进制值，所以能正常显示
4. 其他类别使用了CSS变量，但在活动选择弹窗中的优先级可能不够高

## 解决方案
1. 在[activity-selection-optimized.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-selection-optimized.css)文件中，为不同类别的按钮明确设置背景颜色
2. 统一处理所有类别的按钮样式，确保每种颜色类别都有正确的背景色和文字颜色
3. 删除重复的样式定义

## 修改的文件
- [/Users/amy/Documents/codes/time_recoder/static/css/modules/activity-selection-optimized.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-selection-optimized.css)

## 验证方法
1. 打开活动选择弹窗
2. 检查各类别按钮的背景颜色是否正确显示
3. 确认工作输出类（蓝色）、充电类（绿色）、修养生息类（紫色）、输出创作类（橙色）、暂停一下类（青色）、纯属娱乐类（灰色）都显示正确的背景颜色