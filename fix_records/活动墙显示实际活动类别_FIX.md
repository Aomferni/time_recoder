# 活动墙显示实际活动类别

## 问题描述
活动墙显示的是活动类别的名称，而不是每个记录实际的`activityCategory`字段值。这导致所有同类别活动都显示相同的文本，无法区分具体活动类型。

## 解决方案
修改活动墙的渲染逻辑，使其显示每个记录实际的`activityCategory`字段值，而不是类别的名称。

## 修改的文件
1. [/Users/amy/Documents/codes/time_recoder/static/js/modules/moodWall.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/moodWall.js) - 修改活动墙渲染逻辑，显示每个记录的实际`activityCategory`字段值

## 验证结果
修改后，活动墙的小方块上会显示每个记录实际的`activityCategory`字段值，而不是类别的名称，使用户能够更准确地了解每个活动的具体类型。