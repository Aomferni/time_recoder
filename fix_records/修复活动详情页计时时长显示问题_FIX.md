# 修复活动详情页计时时长显示问题

## 问题描述
活动详情页的计时时长应展示准确的时长，但当前实现中可能存在计时时长显示不准确的问题。

## 问题分析
通过检查代码发现，在[records.html](file:///Users/amy/Documents/codes/time_recoder/templates/records.html)的showRecordDetail函数中，totalDuration直接使用了record.duration的值，而没有重新计算段落的总时间。这可能导致以下问题：
1. 如果record.duration存储的值不准确，显示的计时时长也会不准确
2. 如果段落信息发生了变化但record.duration未及时更新，显示的计时时长会与实际段落总时间不一致

## 修复方案
修改showRecordDetail函数中的totalDuration计算逻辑，确保计时时长显示准确：
1. 使用TimeRecorderFrontendUtils.calculateSegmentsTotalTime工具函数重新计算段落总时间
2. 只有在重新计算结果为0时，才使用record.duration作为后备值

## 修改的文件
1. `/Users/amy/Documents/codes/time_recoder/templates/records.html` - 修改showRecordDetail函数中的totalDuration计算逻辑

## 核心修改逻辑
将原来的：
```javascript
// 根据规范，duration记录所有segments累计的时间
const totalDuration = (record && record.duration) || 0;
```

修改为：
```javascript
// 根据规范，duration记录所有segments累计的时间
// 重新计算段落总时间以确保准确性
let totalDuration = 0;
if (record.segments && Array.isArray(record.segments)) {
    // 使用工具类计算所有段落的总时间
    totalDuration = TimeRecorderFrontendUtils.calculateSegmentsTotalTime(record.segments);
}
// 如果计算结果为0，使用record.duration作为后备值
if (totalDuration === 0) {
    totalDuration = (record && record.duration) || 0;
}
```

这样确保了计时时长显示的准确性，优先使用重新计算的段落总时间，只有在无法计算时才使用record.duration作为后备值。