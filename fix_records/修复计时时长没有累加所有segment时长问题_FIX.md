# 修复计时时长没有累加所有segment时长问题

## 问题描述
在时间记录器中，计时时长（duration）字段没有正确累加所有段落（segments）的时长，导致显示的计时时长不准确。

## 问题分析
通过代码分析发现，问题主要出现在以下几个地方：
1. 在记录详情页面显示时，直接使用了record.duration而没有重新计算所有段落的总时间
2. 在记录表格显示时，使用了工具类中的calculateRecordTotalTime函数，但该函数也只是简单地使用了record.duration
3. 在工具类中的calculateRecordTotalTime函数中，没有重新计算所有段落的时间

## 修复方案
1. 修改records.html模板中的记录详情显示逻辑，重新计算所有段落的总时间
2. 修改ui.js模块中的记录详情显示逻辑，重新计算所有段落的总时间
3. 修改utils.js模块中的calculateRecordTotalTime函数，确保正确计算所有段落的时间

## 修改的函数和数据流逻辑
1. records.html中的记录详情显示逻辑
2. ui.js中的showSimpleRecordDetail和showFullRecordDetail函数
3. utils.js中的calculateRecordTotalTime函数

## 代码修改
### records.html
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

### ui.js
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

### utils.js
```javascript
/**
 * 计算记录总时间（包括段落时间和当前计时）
 */
calculateRecordTotalTime: function(record, currentElapsed = 0) {
    // 根据规范，duration记录所有segments累计的时间
    // 重新计算段落总时间以确保准确性
    let total = 0;
    if (record.segments && Array.isArray(record.segments)) {
        // 使用工具类计算所有段落的总时间
        total = this.calculateSegmentsTotalTime(record.segments);
    }
    // 如果计算结果为0，使用record.duration作为后备值
    if (total === 0) {
        total = (record && record.duration) || 0;
    }
    
    // 确保window.TimeRecorderConfig存在且有currentRecordId属性
    if (typeof window !== 'undefined' && 
        window.TimeRecorderConfig && 
        window.TimeRecorderConfig.currentRecordId) {
        // 如果是当前计时的记录，加上当前段的时间
        if (window.TimeRecorderConfig.currentRecordId === record.id) {
            total += currentElapsed;
        }
    }
    
    return total;
}
```

## 验证结果
修改后，计时时长能够正确累加所有段落的时长，显示准确的时间信息。