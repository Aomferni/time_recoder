# 修复情绪与活动墙显示为空问题

## 问题描述
情绪墙和活动墙页面显示为空，没有数据展示。

## 问题分析
经过检查发现以下问题：
1. 情绪墙页面引用了不存在的CSS文件`wall.css`，实际应该引用`mood-wall.css`
2. JavaScript中渲染情绪墙和活动墙的逻辑存在一些问题，可能导致数据无法正确显示

## 解决方案
1. 修复mood_wall.html中CSS文件的引用路径
2. 优化moodWall.js中的渲染逻辑，确保数据能正确显示

## 修改的文件
1. [/Users/amy/Documents/codes/time_recoder/templates/mood_wall.html](file:///Users/amy/Documents/codes/time_recoder/templates/mood_wall.html)：修复CSS文件引用路径
2. [/Users/amy/Documents/codes/time_recoder/static/js/modules/moodWall.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/moodWall.js)：优化渲染逻辑

## 验证结果
修复后，情绪墙和活动墙能正常显示数据。
