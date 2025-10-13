# 关于时间的字段及逻辑
duration：记录所有segments累计的时间，不是时间跨度
timeSpan：记录从第一个段落的start到最后一个段落的end的时间跨度
pauseCount：记录segments的个数，即计时段落数量
startTime：第一个segments的start时间且唯一不可修改
endTime：最后一个segments的end时间

1. 创建新记录：
- 在点击【选择活动】按钮并点击【开始计时】时创建新记录
- 同时新建这个记录的 segment，并记录 start 时间

2. 继续活动：
- 先添加新段落到 segments
- 然后设置新段落的 start 时间
- 最后开始计时

3. 数据规范符合性：
- startTime 是第一个 segments 的 start 时间且唯一不可修改
- endTime 为最后一个 segments 的 end 时间
- duration 记录所有 segments 累计的时间
- pauseCount 记录的是 segments 的个数

## 逻辑流程图
```
graph TD
    A[用户点击活动按钮] --> B[设置currentActivity]
    B --> C[清除currentRecordId]
    C --> D[更新记录表格]
    
    E[用户点击开始按钮] --> F{是否存在currentRecordId?}
    F -- 是 --> G[继续现有记录]
    F -- 否 --> H[创建新记录]
    H --> I[创建包含初始段落的记录]
    I --> J[设置segments数组包含初始段落]
    I --> K[设置段落start和end时间为当前时间]
    I --> L[发送到后端创建记录]
    L --> M[保存返回的记录ID到currentRecordId]
    M --> N[开始计时]
    
    G --> O[添加新段落到现有记录]
    O --> P[设置新段落start和end时间为当前时间]
    O --> Q[发送到后端更新记录]
    Q --> N
    
    R[停止计时] --> S[更新当前段落结束时间]
    S --> T[计算所有段落累计时间]
    T --> U[更新duration为累计时间]
    U --> V[更新timeSpan为第一个段落start到最后一个段落end]
    V --> W[保存记录]
```

## 相关函数
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