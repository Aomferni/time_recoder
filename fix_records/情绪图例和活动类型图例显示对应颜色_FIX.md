# 修复情绪图例和活动类型图例显示对应颜色问题

## 问题描述
情绪图例和活动类型图例应该显示对应的颜色，但实际上图例颜色没有正确显示。

## 问题分析
1. 检查[moodWall.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/moodWall.js)文件中的[renderLegends](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/moodWall.js#L242-L261)函数，发现图例渲染逻辑已经正确实现，使用了`${item.color}`来设置颜色。
2. 检查[mood-wall.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/mood-wall.css)文件，发现问题在于CSS中定义了`.legend-color-box`类但HTML中使用的是`.legend-color`类，类名不匹配导致样式未生效。

## 解决方案
将CSS中的`.legend-color-box`类名修改为`.legend-color`，使其与HTML中使用的类名一致。

## 修改文件
1. [/Users/amy/Documents/codes/time_recoder/static/css/modules/mood-wall.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/mood-wall.css)
   - 将`.legend-color-box`类名修改为`.legend-color`

## 验证结果
修改后，情绪图例和活动类型图例能够正确显示对应的颜色。