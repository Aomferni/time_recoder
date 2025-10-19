# 修复活动选择弹窗按钮颜色重复定义冲突

## 问题描述
活动选择弹窗中的按钮颜色显示仍然不正确，分析发现是由于CSS重复定义冲突导致的问题。

## 问题分析
通过代码分析，发现以下问题：
1. 在[activity-buttons.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-buttons.css)和[activity-selection-optimized.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-selection-optimized.css)中都定义了按钮样式，存在重复定义冲突
2. [activity-buttons.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-buttons.css)中定义了基础按钮样式，但没有设置背景颜色和文字颜色
3. [activity-selection-optimized.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-selection-optimized.css)中定义了具体场景的按钮样式，但选择器优先级可能不够高
4. 由于CSS加载顺序和选择器特异性问题，导致活动选择弹窗中的按钮样式没有正确应用

## 解决方案
1. 修改[activity-buttons.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-buttons.css)文件，移除所有颜色相关的样式定义，只保留基础样式
2. 在[activity-selection-optimized.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-selection-optimized.css)中提高选择器特异性，明确指定`button.activity-btn`前缀
3. 为不同类别的按钮样式添加`!important`声明，确保优先级高于其他样式
4. 确保活动选择弹窗中的按钮样式能够正确覆盖其他样式

## 修改的文件
- [/Users/amy/Documents/codes/time_recoder/static/css/modules/activity-buttons.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-buttons.css)
- [/Users/amy/Documents/codes/time_recoder/static/css/modules/activity-selection-optimized.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/activity-selection-optimized.css)

## 验证方法
1. 打开活动选择弹窗
2. 检查各类别按钮的背景颜色和文字颜色是否正确显示
3. 确认所有按钮都有合适的背景色和文字颜色，确保足够的对比度
4. 验证在不同浏览器中样式是否一致