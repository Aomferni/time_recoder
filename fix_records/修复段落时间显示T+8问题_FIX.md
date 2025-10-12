# 修复段落时间显示T+8问题

## 问题描述
用户报告在打开活动详情时，段落的start和end时间都会显示为T+8（即比实际时间多8小时）。

## 问题分析
经过代码分析，发现问题出在[showFullRecordDetail](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/ui.js#L372-L648)函数中处理段落信息显示的部分。虽然注释表明需要将UTC时间转换为北京时间显示，但实际代码中并没有正确执行这一转换。

具体问题：
1. 在处理段落时间时，虽然注释说明需要转换为北京时间，但实际代码只是简单创建了Date对象
2. 没有正确应用UTC到北京时间的转换（+8小时偏移）

## 修复方案
修改[showFullRecordDetail](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/ui.js#L372-L648)函数中处理段落信息的部分，正确地将UTC时间转换为北京时间：

```javascript
// 修改前
const start = new Date(new Date(segment.start).getTime());
const end = new Date(new Date(segment.end).getTime());
const duration = end - start;

// 修改后
const start = new Date(segment.start);
const end = new Date(segment.end);
// 转换为北京时间（UTC+8）
const beijingStart = new Date(start.getTime() + 8 * 60 * 60 * 1000);
const beijingEnd = new Date(end.getTime() + 8 * 60 * 60 * 1000);
const duration = beijingEnd - beijingStart;
```

## 代码修改

### 修改文件: `/static/js/modules/ui.js`

在[showFullRecordDetail](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/ui.js#L372-L648)函数中:

```javascript
// 数据存储的是UTC时间，需要转换为北京时间显示
const start = new Date(segment.start);
const end = new Date(segment.end);
// 转换为北京时间（UTC+8）
const beijingStart = new Date(start.getTime() + 8 * 60 * 60 * 1000);
const beijingEnd = new Date(end.getTime() + 8 * 60 * 60 * 1000);
const duration = beijingEnd - beijingStart;
return {
    index,
    start: beijingStart,
    end: beijingEnd,
    duration
};
```

## 验证方法
1. 打开活动详情页面
2. 检查段落信息中的start和end时间显示是否正确
3. 确认时间显示为正确的北京时间，而不是T+8

## 影响范围
- 活动详情页面中的段落时间显示
- 段落持续时间计算

## 注意事项
- 确保所有时间处理逻辑统一使用UTC时间存储，显示时转换为北京时间
- 保持前后端时间处理逻辑的一致性