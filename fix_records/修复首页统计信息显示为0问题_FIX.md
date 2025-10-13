# 修复首页统计信息显示为0问题

## 问题描述
首页的【今日总计】和【今日创作总计】展示的都是0，即使用户已经有今天的记录。

## 问题分析
经过分析发现，问题出在后端统计API [get_stats()](file:///Users/mac/Documents/local-Datawhale%E6%95%99%E7%A0%94/%E5%A5%BD%E7%94%A8%E7%9A%84%E5%B7%A5%E5%85%B7/time_tracker/app.py#L325-L346) 函数中。该函数在实现时没有像 [get_records()](file:///Users/mac/Documents/local-Datawhale%E6%95%99%E7%A0%94/%E5%A5%BD%E7%94%A8%E7%9A%84%E5%B7%A5%E5%85%B7/time_recoder/app.py#L638-L666) 函数那样筛选今天的记录，而是统计了用户的所有记录。由于统计API返回的是所有记录的统计结果，而前端UI只显示今天的记录，这就导致了统计信息与实际显示的记录不匹配。

## 修复方案
修改后端 [get_stats()](file:///Users/mac/Documents/local-Datawhale%E6%95%99%E7%A0%94/%E5%A5%BD%E7%94%A8%E7%9A%84%E5%B7%A5%E5%85%B7/time_tracker/app.py#L325-L346) 函数，添加筛选今天记录的逻辑，确保统计信息只包含今天的记录：

```python
# 获取今天的日期（使用北京时间）
today = datetime.now(BEIJING_TZ).strftime('%Y/%m/%d')

# 筛选今天的记录
records = [record for record in all_records if record.get('date', '') == today]
```

## 修改的函数和数据流逻辑
1. 修改了 [app.py](file:///Users/mac/Documents/local-Datawhale%E6%95%99%E7%A0%94/%E5%A5%BD%E7%94%A8%E7%9A%84%E5%B7%A5%E5%85%B7/time_recoder/app.py) 中的 [get_stats()](file:///Users/mac/Documents/local-Datawhale%E6%95%99%E7%A0%94/%E5%A5%BD%E7%94%A8%E7%9A%84%E5%B7%A5%E5%85%B7/time_tracker/app.py#L325-L346) 函数
2. 添加了日期筛选逻辑，确保只统计今天的记录
3. 保持了原有的创作类活动识别逻辑和宽松匹配方式

## 验证结果
修复后，首页能够正确显示：
- 【今日总计】：当天所有活动的计时时长累加
- 【今日创作总计】：当天创作类活动（输出创作类别）的累计时长

通过测试数据验证，统计API现在能正确返回今天的记录统计信息，前端显示也恢复正常。