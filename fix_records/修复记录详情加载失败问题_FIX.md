# 修复记录详情加载失败问题

## 问题描述
加载记录详情时出现错误：ReferenceError: formatDateTimeForInput is not defined，导致记录详情无法正常显示。

## 问题分析
通过检查代码发现，在[records.html](file:///Users/amy/Documents/codes/time_recoder/templates/records.html)文件中，有两处直接使用了[formatDateTimeForInput](file:///Users/amy/Documents/codes/video_cut_helper/time_recoder/static/js/script.js#L798-L805)函数：
1. 第307行：`<input type="datetime-local" class="segment-start" value="${formatDateTimeForInput(segment.start)}">`
2. 第309行：`<input type="datetime-local" class="segment-end" value="${formatDateTimeForInput(segment.end)}">`

但这个函数没有在页面中定义，应该使用`TimeRecorderFrontendUtils.formatDateTimeForInput`工具函数。

## 修复方案
将直接调用[formatDateTimeForInput](file:///Users/amy/Documents/codes/video_cut_helper/time_recoder/static/js/script.js#L798-L805)的地方修改为调用`TimeRecorderFrontendUtils.formatDateTimeForInput`，确保使用正确的工具函数。

## 修改的文件
1. `/Users/amy/Documents/codes/time_recoder/templates/records.html` - 修复函数调用错误

## 核心修改逻辑
将：
```javascript
<input type="datetime-local" class="segment-start" value="${formatDateTimeForInput(segment.start)}">
<input type="datetime-local" class="segment-end" value="${formatDateTimeForInput(segment.end)}">
```

修改为：
```javascript
<input type="datetime-local" class="segment-start" value="${TimeRecorderFrontendUtils.formatDateTimeForInput(segment.start)}">
<input type="datetime-local" class="segment-end" value="${TimeRecorderFrontendUtils.formatDateTimeForInput(segment.end)}">
```

这样修复后，记录详情页面将能正常加载，不再出现ReferenceError错误。