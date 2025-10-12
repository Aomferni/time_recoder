# 修复toggleDetailMode和closeRecordDetailModal未定义错误

## 问题描述

在时间记录器应用中出现了以下JavaScript错误：
```
Uncaught ReferenceError: toggleDetailMode is not defined
    at HTMLButtonElement.onclick

Uncaught ReferenceError: closeRecordDetailModal is not defined
    at HTMLSpanElement.onclick
```

这些错误表明在HTML中通过onclick属性调用的`toggleDetailMode`和`closeRecordDetailModal`函数没有被正确定义或暴露到全局作用域。

## 问题分析

通过分析代码库中的HTML和JavaScript文件，发现以下问题：

1. 在HTML文件中，模态框的关闭按钮使用了`onclick="closeRecordDetailModal()"`直接调用函数。

2. 在HTML文件中，切换详情模式的按钮使用了`onclick="toggleDetailMode()"`直接调用函数。

3. 在模块化的JavaScript代码中，这些功能是作为`TimeRecorderUI.closeRecordDetailModal`和`TimeRecorderUI.toggleDetailMode`方法实现的，而不是全局的函数。

## 解决方案

### 1. 修改HTML中的函数调用
将HTML文件中所有`onclick="closeRecordDetailModal()"`的调用修改为`onclick="TimeRecorderUI.closeRecordDetailModal()"`，以正确调用模块化代码中的方法。

将HTML文件中所有`onclick="toggleDetailMode()"`的调用修改为`onclick="TimeRecorderUI.toggleDetailMode()"`，以正确调用模块化代码中的方法。

### 2. 涉及的文件
- [/Users/amy/Documents/codes/video_cut_helper/time_recoder/templates/index.html](file:///Users/amy/Documents/codes/video_cut_helper/time_recoder/templates/index.html)
- [/Users/amy/Documents/codes/video_cut_helper/time_recoder/templates/records.html](file:///Users/amy/Documents/codes/video_cut_helper/time_recoder/templates/records.html)

## 修改内容

### [/Users/amy/Documents/codes/video_cut_helper/time_recoder/templates/index.html](file:///Users/amy/Documents/codes/video_cut_helper/time_recoder/templates/index.html)文件
```html
<!-- 修改前 -->
<span class="close" onclick="closeRecordDetailModal()">&times;</span>

<!-- 修改后 -->
<span class="close" onclick="TimeRecorderUI.closeRecordDetailModal()">&times;</span>
```

### [/Users/amy/Documents/codes/video_cut_helper/time_recoder/templates/records.html](file:///Users/amy/Documents/codes/video_cut_helper/time_recoder/templates/records.html)文件
```html
<!-- 修改前 -->
<span class="close" onclick="closeRecordDetailModal()">&times;</span>

<!-- 修改后 -->
<span class="close" onclick="TimeRecorderUI.closeRecordDetailModal()">&times;</span>
```

## 验证测试
1. 重新加载页面，确保没有JavaScript错误
2. 点击"切换到简化版详情"按钮，验证功能正常工作
3. 点击模态框关闭按钮，验证功能正常工作
4. 确认按钮文本正确切换和模态框能正常关闭

## 相关函数
- [TimeRecorderUI.closeRecordDetailModal()](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/ui.js#L646-L673) - 关闭记录详情浮窗函数
- [TimeRecorderUI.toggleDetailMode()](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/ui.js#L670-L680) - 切换详情模式函数

## 数据架构影响
此次修复不改变数据结构，仅修正了函数调用方式，确保与模块化架构一致：
- 保持原有的字段定义和用途
- 保持与[structure.md](file:///Users/amy/Documents/codes/time_recoder/structure.md)规范的一致性
- 确保前后端交互逻辑不受影响