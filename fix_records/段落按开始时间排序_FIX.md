# 段落按开始时间排序修复

## 问题描述
段落需要按照开始时间排序，且记录的开始时间应该是第一个段落的开始时间。

## 解决方案
1. 在后端处理记录更新时，对段落按开始时间进行排序
2. 确保记录的startTime字段始终是第一个段落的开始时间
3. 保持其他时间字段的正确性

## 修改内容

### 1. 后端修改 (app.py)
在 [/app.py](file:///Users/amy/Documents/codes/time_recoder/app.py) 文件中：
- 在更新记录时，对segments数组按开始时间进行排序
- 确保startTime始终是第一个段落的开始时间
- 保持endTime为最后一个段落的结束时间
- 重新计算duration和timeSpan字段

### 2. 前端修改 (ui.js)
在 [/static/js/modules/ui.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/ui.js) 文件中：
- 在保存记录详情时，对段落按开始时间进行排序
- 确保发送到后端的数据是按时间顺序排列的

## 验证结果
修改后，段落将按开始时间正确排序，记录的开始时间将是第一个段落的开始时间。