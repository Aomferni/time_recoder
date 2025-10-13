# 调整首页统计信息展示修复记录

## 问题描述
根据项目架构文档 [structure.md](file:///Users/mac/Documents/local-Datawhale%E6%95%99%E7%A0%94/%E5%A5%BD%E7%94%A8%E7%9A%84%E5%B7%A5%E5%85%B7/time_recoder/structure.md) 的要求：
1. 首页的【今日总计】需要显示当天所有活动的计时时长累加
2. 【今日玩玩具总计】应为当天【创作】类活动的累计时长

但当前实现中：
1. 后端API统计逻辑不正确，仅通过活动名称包含"玩玩具"来判断，而不是基于活动类别
2. 前端显示标题不够准确

## 解决方案
1. 修改后端统计API（[app.py](file:///Users/mac/Documents/local-Datawhale%E6%95%99%E7%A0%94/%E5%A5%BD%E7%94%A8%E7%9A%84%E5%B7%A5%E5%85%B7/time_recoder/app.py)），根据活动类别配置正确计算创作类活动时间
2. 更新前端UI显示标题，将"今日玩玩具总计"改为"今日创作总计"以更准确反映统计内容

## 修改的函数和数据流逻辑
1. 修改了 `get_stats()` 函数，使用活动类别配置来识别创作类活动
2. 更新了前端模板 [index.html](file:///Users/mac/Documents/local-Datawhale%E6%95%99%E7%A0%94/%E5%A5%BD%E7%94%A8%E7%9A%84%E5%B7%A5%E5%85%B7/time_recoder/templates/index.html) 中的标题显示

## 验证结果
修改后，首页能够正确显示：
- 【今日总计】：当天所有活动的计时时长累加
- 【今日创作总计】：当天创作类活动（输出创作类别）的累计时长