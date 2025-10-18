# 修复活动类别"其他"问题

## 问题描述
在系统中出现了"其他"类别的活动记录，这不符合规范要求。每个活动在创建时都应该有一个明确的类别，不应该出现"其他"类别。

## 问题分析
通过代码分析发现以下问题：

1. **后端宽松匹配逻辑**：在[TimeRecorderUtils.get_activity_category_loose_match](file:///Users/amy/Documents/codes/time_recoder/app.py#L463-L476)函数中，当活动无法匹配到任何已配置的类别时，会返回"其他"类别。

2. **前端活动类别选择不完整**：在活动详情页的活动类别选择下拉框中，只提供了预定义的几个类别选项，没有包含用户自定义的类别。

3. **缺乏数据验证**：在保存记录时，没有验证activityCategory字段是否为空或无效值。

## 解决方案
1. 修改后端逻辑，移除返回"其他"类别的宽松匹配逻辑，当无法匹配时返回空字符串
2. 修改前端活动详情页，动态加载所有活动类别到下拉框
3. 增强数据验证，确保activityCategory字段不为空
4. 更新PRD文档，明确活动类别规范

## 修改的文件
1. [/Users/amy/Documents/codes/time_recoder/app.py](file:///Users/amy/Documents/codes/time_recoder/app.py)
   - 修改[get_activity_category_loose_match](file:///Users/amy/Documents/codes/time_recoder/app.py#L463-L476)函数，当无法匹配时返回空字符串而不是"其他"
   - 在创建记录时增加验证，确保activityCategory字段不为空

2. [/Users/amy/Documents/codes/time_recoder/static/js/modules/recordDetail.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/recordDetail.js)
   - 修改活动类别下拉框，动态加载所有活动类别
   - 在保存记录时增加验证，确保activityCategory字段不为空

3. [/Users/amy/Documents/codes/time_recoder/PRD.md](file:///Users/amy/Documents/codes/time_recoder/PRD.md)
   - 添加活动类别规范说明

## 验证方法
1. 创建新活动记录，验证必须选择活动类别
2. 编辑现有记录，验证活动类别下拉框包含所有可用类别
3. 尝试保存没有活动类别的记录，验证会提示错误
4. 检查系统中不再出现"其他"类别的活动记录