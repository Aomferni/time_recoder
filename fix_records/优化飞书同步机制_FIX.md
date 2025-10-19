# 优化飞书同步机制

## 问题描述
原有的飞书同步机制存在以下问题：
1. 在保存今日计划时会同步所有记录到飞书多维表格，效率低下且不必要
2. 缺乏针对性的记录同步机制

## 解决方案
1. 修改savePlan功能，移除同步所有记录到飞书的逻辑
2. 在每次保存单独活动详情时，单独同步该记录到飞书多维表格
3. 在每次停止一次活动计时时，单独同步该记录到飞书多维表格

## 修改的函数和数据流逻辑

### 修改的函数
1. `DailyPlanModule.savePlan` - 移除了同步所有记录到飞书的逻辑
2. `DailyPlanModule.checkAndSyncToFeishu` - 保留了同步今日计划到飞书的逻辑
3. `DailyPlanModule.syncToFeishuSilently` - 移除了同步所有记录到飞书的逻辑
4. `DailyPlanModule.syncRecordsToFeishu` - 移除了同步所有记录到飞书的逻辑
5. `TimeRecorderRecordDetail.saveRecordDetail` - 添加了同步当前记录到飞书的逻辑
6. `TimeRecorderRecordDetail.syncRecordToFeishu` - 新增了同步单个记录到飞书的函数
7. `TimeRecorderTimer.toggleTimer` - 在停止计时时添加了同步当前记录到飞书的逻辑
8. `TimeRecorderTimer.addRecord` - 在创建新记录时添加了同步当前记录到飞书的逻辑
9. `TimeRecorderTimer.syncRecordToFeishu` - 新增了同步单个记录到飞书的函数

### 数据流逻辑
1. 用户保存今日计划时，只同步今日计划到飞书，不再同步所有记录
2. 用户保存活动详情时，会单独同步该记录到飞书多维表格
3. 用户停止活动计时时，会单独同步该记录到飞书多维表格

## 验证结果
1. 今日计划保存时不再同步所有记录到飞书
2. 保存活动详情时能正确同步该记录到飞书
3. 停止活动计时时能正确同步该记录到飞书
4. PRD文档和structure文档已更新以反映这些变更