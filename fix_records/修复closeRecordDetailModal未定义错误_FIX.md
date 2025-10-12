# 修复closeRecordDetailModal未定义错误

## 问题描述

在时间记录器应用中出现了以下JavaScript错误：
```
Uncaught ReferenceError: closeRecordDetailModal is not defined
    at HTMLSpanElement.onclick
```

这个错误表明在HTML中通过onclick属性调用的[closeRecordDetailModal](file:///Users/amy/Documents/codes/video_cut_helper/time_recoder/static/js/script.js#L647-L650)函数没有被正确定义或暴露到全局作用域。

## 问题分析

通过分析代码库中的HTML和JavaScript文件，发现以下问题：

1. 在HTML文件（index.html和records.html）中，模态框的关闭按钮使用了`onclick="closeRecordDetailModal()"`直接调用函数。

2. 在模块化的JavaScript代码中，关闭模态框的功能是作为[TimeRecorderUI.closeRecordDetailModal](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/ui.js#L646-L673)方法实现的，而不是全局的[closeRecordDetailModal](file:///Users/amy/Documents/codes/video_cut_helper/time_recoder/static/js/script.js#L647-L650)函数。

3. 在records.html文件中，还存在一个本地定义的[closeRecordDetailModal](file:///Users/amy/Documents/codes/video_cut_helper/time_recoder/static/js/script.js#L647-L650)函数，这与模块化架构不一致。

## 解决方案

### 1. 修改HTML中的函数调用
将HTML文件中所有`onclick="closeRecordDetailModal()"`的调用修改为`onclick="TimeRecorderUI.closeRecordDetailModal()"`，以正确调用模块化代码中的方法。

### 2. 删除重复的本地函数定义
删除records.html文件中本地定义的[closeRecordDetailModal](file:///Users/amy/Documents/codes/video_cut_helper/time_recoder/static/js/script.js#L647-L650)函数，统一使用模块化代码中的实现。

### 3. 更新其他调用点
将records.html中其他地方对[closeRecordDetailModal](file:///Users/amy/Documents/codes/video_cut_helper/time_recoder/static/js/script.js#L647-L650)的调用更新为[TimeRecorderUI.closeRecordDetailModal](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/ui.js#L646-L673)。

## 核心修改

### index.html
- 修改模态框关闭按钮的onclick调用

### records.html
- 修改模态框关闭按钮的onclick调用
- 修改JavaScript代码中对[closeRecordDetailModal](file:///Users/amy/Documents/codes/video_cut_helper/time_recoder/static/js/script.js#L647-L650)的调用
- 删除重复的本地[closeRecordDetailModal](file:///Users/amy/Documents/codes/video_cut_helper/time_recoder/static/js/script.js#L647-L650)函数定义

## 验证结果

通过以上修改，解决了以下问题：
1. 修复了"Uncaught ReferenceError: closeRecordDetailModal is not defined"错误
2. 统一了模态框关闭功能的实现方式
3. 保持了代码的一致性和模块化架构

这些修改应该能够解决报告的JavaScript错误，并提高了代码的可维护性。