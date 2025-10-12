# 修复活动类型墙出现【其他】类型问题

## 问题描述
在活动类型墙中出现了【其他】类型，这是由于活动名称与活动类别配置中的名称不完全匹配导致的。例如：
- 记录中的活动名称是"梳理方案（Qoder）"，但配置中只有"梳理方案"
- 记录中的活动名称是"玩玩具（时间追踪器）"等，但配置中只有"玩玩具"

这些不匹配的活动名称无法在`activity_to_category`映射中找到对应的类别，因此被归类为【其他】类型。

## 问题分析
在后端处理活动类型墙数据时，当活动没有匹配到任何预定义的类别时，会默认归类为【其他】类型。原来的匹配逻辑只支持精确匹配，不支持模糊匹配，导致很多活动被错误地归类为【其他】。

## 修复方案
修改后端代码，使用更宽松的匹配方式来匹配活动名称和类别配置：
1. 首先尝试精确匹配
2. 如果精确匹配失败，尝试模糊匹配（检查配置中的活动名称是否是记录中活动名称的子串）
3. 如果所有匹配都失败，才返回"其他"

## 代码修改

### 修改文件: `/app.py`

1. 修改[get_activity_wall_data](file:///Users/amy/Documents/codes/time_recoder/app.py#L317-L402)函数，使用更宽松的匹配方式：
```python
# 获取活动对应的类别（使用更宽松的匹配方式）
category = TimeRecorderUtils.get_activity_category_loose_match(activity, activity_to_category)
```

2. 添加[get_activity_category_loose_match](file:///Users/amy/Documents/codes/time_recoder/app.py#L399-L410)函数，实现宽松匹配逻辑：
```python
@staticmethod
def get_activity_category_loose_match(activity, activity_to_category):
    """使用宽松匹配方式获取活动类别"""
    # 首先尝试精确匹配
    if activity in activity_to_category:
        return activity_to_category[activity]
    
    # 如果精确匹配失败，尝试模糊匹配
    for configured_activity in activity_to_category:
        # 检查配置中的活动名称是否是记录中活动名称的子串
        if configured_activity in activity:
            return activity_to_category[configured_activity]
    
    # 如果所有匹配都失败，返回"其他"
    return '其他'
```

## 验证结果
修复后，活动类型墙中的【其他】类型将大大减少，因为现在支持模糊匹配，能够正确地将"梳理方案（Qoder）"匹配到"梳理方案"类别，将"玩玩具（时间追踪器）"匹配到"玩玩具"类别等。