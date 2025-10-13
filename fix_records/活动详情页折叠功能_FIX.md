# 活动详情页折叠功能修复记录

## 问题描述
首页点击打开的活动详情页，默认展开显示所有信息，不符合用户需求。用户希望仅展开显示【记录收获】和【记录情绪】部分，其他信息均折叠，折叠中按照【段落详情】、【核心信息】、【时间信息】进行展示。

## 解决方案
1. 在records.html中添加toggleSection函数，实现与index.html相同的折叠功能
2. 修改records.html中的showRecordDetail函数，使详情页默认只展开【记录收获】和【记录情绪】部分
3. 其他信息（段落详情、核心信息、时间信息）默认折叠，可通过折叠按钮展开

## 修改的函数和数据流逻辑
1. 添加了TimeRecorderFrontendUtils.toggleSection方法和全局toggleSection函数
2. 修改了showRecordDetail函数中构建详情内容的模板，实现默认折叠功能
3. 为各个详情区域添加了折叠按钮和相应的CSS类

## 修改的文件
- /Users/mac/Documents/local-Datawhale教研/好用的工具/time_recoder/templates/records.html

## 验证结果
修改后，活动详情页默认只展开【记录收获】和【记录情绪】部分，其他信息默认折叠，符合用户需求。