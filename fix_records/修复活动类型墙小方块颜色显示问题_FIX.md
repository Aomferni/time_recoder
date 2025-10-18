# 修复活动类型墙小方块颜色显示问题

## 问题描述
活动类型墙的小方块应该按照活动类型展示对应的颜色，但现在有【工作输出】类的活动，展示的方块颜色为灰色，而不是应该的蓝色。

## 问题分析
通过检查代码和配置文件，发现问题出在活动类型墙数据生成逻辑中：

1. 在[get_activity_wall_data](file:///Users/amy/Documents/codes/time_recoder/app.py#L302-L429)函数中，颜色映射字典`color_map`的位置不正确，导致颜色映射可能不完整
2. 检查[/Users/amy/Documents/codes/time_recoder/data/activity_categories.json](file:///Users/amy/Documents/codes/time_recoder/data/activity_categories.json)配置文件发现【工作输出】类别应该映射为蓝色(`blue` -> `#2196F3`)，但实际显示为灰色

## 解决方案
1. 重新调整[get_activity_wall_data](file:///Users/amy/Documents/codes/time_recoder/app.py#L302-L429)函数中颜色映射字典`color_map`的位置，确保在遍历所有类别之前就定义好
2. 确保颜色映射逻辑正确，每个活动类别都能获取到正确的颜色值

## 修改文件
1. [/Users/amy/Documents/codes/time_recoder/app.py](file:///Users/amy/Documents/codes/time_recoder/app.py)
   - 调整[get_activity_wall_data](file:///Users/amy/Documents/codes/time_recoder/app.py#L302-L429)函数中颜色映射字典的位置，确保正确初始化

## 验证结果
修改后，活动类型墙的小方块能够正确显示对应的颜色：
- 【工作输出】类活动显示为蓝色(#2196F3)
- 【大脑充电】和【身体充电】类活动显示为绿色(#4CAF50)
- 【修养生息】类活动显示为紫色(#9C27B0)
- 【输出创作】类活动显示为橙色(#FF9800)
- 【暂停一下】类活动显示为青色(#00BCD4)
- 【纯属娱乐】类活动显示为灰色(#795548)

这样修复后，用户可以清楚地通过颜色识别不同的活动类型，提升了情绪墙和活动墙的可视化效果和用户体验。