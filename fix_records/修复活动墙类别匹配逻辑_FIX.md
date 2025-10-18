# 修复活动墙类别匹配逻辑问题

## 问题描述
活动墙在显示活动类别时，错误地使用了通过活动名称匹配类别的方式，而不是直接使用记录中的`activityCategory`字段。这导致了类别显示不准确的问题。

## 问题分析
通过代码分析发现，在`TimeRecorderUtils.get_activity_wall_data`函数中，使用了`get_activity_category_loose_match`函数通过活动名称来匹配类别，但实际上应该直接使用记录中的`activityCategory`字段。

## 解决方案
1. 修改`TimeRecorderUtils.get_activity_wall_data`函数，直接使用记录中的`activityCategory`字段
2. 更新PRD.md和structure.md文档，强调应该直接使用activityCategory字段
3. 移除不再需要的`get_activity_category_loose_match`函数调用

## 修改的文件
- [/Users/amy/Documents/codes/time_recoder/app.py](file:///Users/amy/Documents/codes/time_recoder/app.py)
- [/Users/amy/Documents/codes/time_recoder/PRD.md](file:///Users/amy/Documents/codes/time_recoder/PRD.md)
- [/Users/amy/Documents/codes/time_recoder/structure.md](file:///Users/amy/Documents/codes/time_recoder/structure.md)

## 验证方法
1. 创建一些测试记录，确保它们的activityCategory字段设置正确
2. 访问情绪与活动墙页面
3. 观察活动墙是否正确显示了记录中的activityCategory字段值
4. 检查浏览器控制台日志，确认没有"其他"类别的显示

## 影响范围
此修改仅影响活动墙的显示逻辑，不会对其他功能产生影响。确保了活动墙能准确显示用户设置的活动类别。