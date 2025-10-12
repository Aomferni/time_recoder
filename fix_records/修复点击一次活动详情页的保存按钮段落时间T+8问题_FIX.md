# 修复点击一次【活动详情】页的【保存】按钮，段落的start和end时间都会T+8问题

## 问题描述
用户报告点击【活动详情】页的【保存】按钮后，段落的start和end时间都会显示为T+8（即比实际时间多8小时）。

## 问题分析
经过代码分析，发现问题出在[records.html](file:///Users/amy/Documents/codes/time_recoder/templates/records.html)文件中的[saveRecordDetail](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/ui.js#L768-L973)函数中处理段落时间和开始/结束时间的部分：

1. 在处理段落时间时，代码直接使用了输入框中的时间值创建Date对象，但输入框中的时间值已经是北京时间格式了，所以这里直接将其作为UTC时间存储，导致T+8的问题。

2. 在处理开始时间和结束时间时，代码错误地又加了一次8小时的偏移，导致T+16的问题。

## 修复方案
修改[records.html](file:///Users/amy/Documents/codes/time_recoder/templates/records.html)文件中[saveRecordDetail](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/ui.js#L768-L973)函数中处理段落时间和开始/结束时间的部分，正确地将北京时间转换为UTC时间存储：

```javascript
// 修改段落时间处理部分
// 输入框中的时间已经是北京时间格式，需要转换为UTC时间存储
const beijingStart = new Date(startIndex);
const beijingEnd = new Date(endIndex);
// 转换为UTC时间存储（减去8小时偏移）
const utcStart = new Date(beijingStart.getTime() - 8 * 60 * 60 * 1000);
const utcEnd = new Date(beijingEnd.getTime() - 8 * 60 * 60 * 1000);

// 修改开始时间和结束时间处理部分
// 输入框中的时间已经是北京时间格式，需要转换为UTC时间存储
const beijingStartDate = new Date(startTimeStr);
const beijingEndDate = new Date(endTimeStr);
// 转换为UTC时间存储（减去8小时偏移）
const utcStartDate = new Date(beijingStartDate.getTime() - 8 * 60 * 60 * 1000);
const utcEndDate = new Date(beijingEndDate.getTime() - 8 * 60 * 60 * 1000);
```

## 代码修改

### 修改文件: `/templates/records.html`

在[saveRecordDetail](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/ui.js#L768-L973)函数中:

1. 修改段落时间处理部分：
```javascript
// 输入框中的时间已经是北京时间格式，需要转换为UTC时间存储
const beijingStart = new Date(startIndex);
const beijingEnd = new Date(endIndex);
// 转换为UTC时间存储（减去8小时偏移）
const utcStart = new Date(beijingStart.getTime() - 8 * 60 * 60 * 1000);
const utcEnd = new Date(beijingEnd.getTime() - 8 * 60 * 60 * 1000);

if (!isNaN(utcStart.getTime()) && !isNaN(utcEnd.getTime())) {
    segments.push({
        start: utcStart.toISOString(),
        end: utcEnd.toISOString()
    });
}
```

2. 修改开始时间和结束时间处理部分：
```javascript
// 输入框中的时间已经是北京时间格式，需要转换为UTC时间存储
const beijingStartDate = new Date(startTimeStr);
const beijingEndDate = new Date(endTimeStr);
// 转换为UTC时间存储（减去8小时偏移）
const utcStartDate = new Date(beijingStartDate.getTime() - 8 * 60 * 60 * 1000);
const utcEndDate = new Date(beijingEndDate.getTime() - 8 * 60 * 60 * 1000);

if (!isNaN(utcStartDate.getTime()) && !isNaN(utcEndDate.getTime())) {
    updateData.startTime = utcStartDate.toISOString();
    updateData.endTime = utcEndDate.toISOString();
    
    // 重新计算时间跨度
    const timeSpan = utcEndDate - utcStartDate;
    updateData.timeSpan = timeSpan;
}
```

## 验证方法
1. 打开活动详情页面
2. 修改段落时间或开始/结束时间
3. 点击【保存】按钮
4. 检查保存后的时间是否正确显示为北京时间，而不是T+8

## 影响范围
- 活动详情页面保存功能
- 段落时间存储和显示
- 开始时间和结束时间存储和显示

## 注意事项
- 确保所有时间处理逻辑统一使用UTC时间存储，显示时转换为北京时间
- 保持前后端时间处理逻辑的一致性