# 代码重构
@rule updateStructure.md
指定代码重构计划，现在很多功能有重复的实现，导致不同页面打开或存在的问题不同

# 美化页面
美化首页布局，突出重点（专注时长记录），缩小其他按钮大小
今日记录单独成行，放在下方

# 理解项目
阅读与首页相关的所有代码
整理相关按钮的功能以及相关的数据逻辑，
绘制为流程图
最后写入structure.md




# 修复时间计算错误
查看所有相关函数，并绘制流程图，确认是否按照如下逻辑完成：
1. 点击【开始】
1.1 如果不存在currentRecordId，
- 创建新记录
- 新建这个记录的 segment，并记录这个segment的 start（当前时间）
- startTime为这个记录的 start

1.2 如果存在currentRecordId，
- 新建这个记录的 segment，并记录这个segment的 start（当前时间）

2. 点击活动的【继续】：
- 新建这个记录的 segment，并记录这个segment的 start（当前时间）
- 开始计时

3. 点击【停止】：
- 更新当前记录最后一个segment的 end（当前时间）
- 清零计时器
- 更新当前记录的 duration（所有segments 累计时间）
- pauseCount 为 （segments 的个数-1）


数据说明：
- startTime 是第一个 segments 的 start 时间且唯一不可修改
- endTime 为最后一个 segments 的 end 时间
- duration 记录所有 segments 累计的时间
- pauseCount 记录的是 segments 的个数

相关函数:
```
后端Python函数 (app.py)
TimeRecorderUtils工具类函数
get_first_segment_start(segments) - 获取第一个段落的开始时间
get_last_segment_end(segments) - 获取最后一个段落的结束时间
get_segments_count(segments) - 获取段落数量
calculate_segments_total_time(segments) - 计算所有段落的总时间
update_record_fields(record, data) - 更新记录字段，确保符合时间字段规范

Flask路由函数
add_record() - 添加新记录，确保时间字段符合规范
update_record(record_id) - 更新记录，确保时间字段符合规范
get_stats() - 获取统计信息，正确计算总时长

前端JavaScript函数 (script.js)
TimeRecorderFrontendUtils工具类函数
calculateSegmentsTotalTime(segments) - 计算段落总时间
calculateRecordTotalTime(record, currentElapsed) - 计算记录总时间（包括段落时间和当前计时）
formatTime(date) - 格式化时间
formatDuration(milliseconds) - 格式化时长

主要功能函数
toggleTimer() - 切换计时器（开始/停止），处理时间字段更新
continueActivity(recordId) - 继续选中的活动，正确处理段落添加
updateRecordsTable() - 更新记录表格，正确显示时间信息
showRecordDetail(recordId) - 显示记录详情浮窗，展示符合规范的时间字段
```

修复目前存在的问题：点击【停止】后，专注计时的时长 会重复计入【计时时长】

# 修复开始时间显示错误(失败)
当前时间为10月13日的0:52，但segment记录的start时间为10月12日的16:52
另外，页面上的今日记录显示时间为8:52

请修复这个问题

我的目标是所有的记录时间都为准确的北京时间，显示也为准确的北京时间

# 修复时间显示错误(失败)
我有一条记录：
```
{
    "id": "06c9ff4b-f0a3-4b23-89c8-c3d51f68ff1d",
    "activity": "玩玩具（时间追踪器）",
    "activityCategory": "玩玩具（时间追踪器）",
    "date": "2025/10/13",
    "startTime": "2025-10-13T00:38:50.688Z",
    "endTime": "2025-10-13T00:52:10.857Z",
    "duration": 28820689.0,
    "remark": "",
    "emotion": "",
    "pauseCount": 2,
    "timeSpan": 800169.0,
    "segments": [
      {
        "start": "2025-10-13T00:38:50.688Z",
        "end": "2025-10-13T00:39:03.015Z"
      },
      {
        "start": "2025-10-13T00:52:02.495Z",
        "end": "2025-10-13T00:52:10.857Z"
      }
    ]
}
```
在【活动详情】页显示为：
- 开始时间：2025/10/13 16:38
- 计时时长：8小时0分钟
- 段落1：2025/10/13 16:38 - 2025/10/13 16:39 （0分钟12秒）
- 段落2：2025/10/13 16:52 - 2025/10/13 16:52 （0分钟8秒）

请修复这个时间显示的错误

# 修复时间错误
查看所有相关函数，并绘制流程图，确认是否按照如下逻辑完成：
1. 与时间相关的所有数据，都应用北京时间进行存储和显示

修复目前存在的问题：
1. 开始时间显示为T+24
2. segments的end时间记录为T+8

# 时间错误修复
查看所有相关函数，并绘制流程图，确认是否按照如下逻辑完成：
1. 与时间相关的所有数据，都应用北京时间进行存储和显示

修复目前存在的问题：
1. 开始时间显示为T+24
2. segments的end时间记录为T+8