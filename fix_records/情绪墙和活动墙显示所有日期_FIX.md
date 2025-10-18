# 情绪墙和活动墙显示所有日期

## 问题描述
情绪墙和活动墙只显示有记录的日期，没有记录的日期不显示，导致日期显示不完整。

## 解决方案
修改情绪墙和活动墙的渲染逻辑，使其显示最近7天的所有日期，即使某一天没有记录也会显示空行，并添加"无记录"提示信息。

## 修改的文件
1. [/Users/amy/Documents/codes/time_recoder/static/js/modules/moodWall.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/moodWall.js) - 修改情绪墙和活动墙渲染逻辑，显示最近7天的所有日期

## 验证结果
修改后，情绪墙和活动墙会显示最近7天的所有日期，即使某一天没有记录也会显示空行，并添加"无记录"提示信息，使日期显示更加完整和一致。