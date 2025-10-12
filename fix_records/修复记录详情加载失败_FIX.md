# 修复记录详情加载失败问题

## 问题描述
在加载记录详情时出现"ReferenceError: totalDuration is not defined"错误，导致无法正常显示记录详情。

## 问题分析
在[records.html](file:///Users/amy/Documents/codes/time_recoder/templates/records.html)文件中的[showRecordDetail](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/ui.js#L402-L575)函数中，使用了`totalDuration`变量来显示计时时长，但该变量未在函数作用域内定义，导致JavaScript运行时错误。

## 修复方案
在[records.html](file:///Users/amy/Documents/codes/time_recoder/templates/records.html)文件的[showRecordDetail](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/ui.js#L402-L575)函数中添加`totalDuration`变量的定义，确保其值为记录的duration字段值。

## 代码修改

### 修改文件: `/templates/records.html`

在[showRecordDetail](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/ui.js#L402-L575)函数中添加`totalDuration`变量定义：

```javascript
// 处理段落信息显示
let segmentsDisplay = '';
// 根据规范，duration记录所有segments累计的时间
const totalDuration = (record && record.duration) || 0;
if (record.segments && record.segments.length > 0) {
```

## 验证结果
修复后，记录详情页面能够正常加载，不再出现"ReferenceError: totalDuration is not defined"错误。