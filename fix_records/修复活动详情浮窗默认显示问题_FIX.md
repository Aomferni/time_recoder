# 修复活动详情浮窗默认显示问题

## 问题描述
刷新页面时不应该显示活动详情浮窗，只有在点击【活动名称】、【情绪墙的小方块】或【活动类型墙的小方块】时才应该弹出对应活动详情的浮窗。

## 问题分析
检查发现：
1. 情绪墙页面(mood_wall.html)中的活动详情浮窗已经设置了默认隐藏样式（`style="display: none;"`）
2. 主页(index.html)和历史记录页面(records.html)中的活动详情浮窗没有设置默认隐藏样式，导致刷新页面时浮窗默认显示

## 修复方案
为所有页面的活动详情浮窗添加默认隐藏样式，确保浮窗只在用户点击相关元素时才显示。

## 修改的文件
1. `/Users/amy/Documents/codes/time_recoder/templates/index.html` - 为主页的活动详情浮窗添加默认隐藏样式
2. `/Users/amy/Documents/codes/time_recoder/templates/records.html` - 为历史记录页面的活动详情浮窗添加默认隐藏样式

## 核心修改逻辑
将活动详情浮窗的定义从：
```html
<div id="recordDetailModal" class="modal">
```

修改为：
```html
<div id="recordDetailModal" class="modal" style="display: none;">
```

这样确保了所有页面的活动详情浮窗在页面加载时默认是隐藏的，只有在用户点击相关元素时才会显示。