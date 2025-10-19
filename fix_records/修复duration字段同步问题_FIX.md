# 修复duration字段同步问题

## 问题描述
飞书同步时duration字段没有正确同步，即使记录中有duration值，飞书多维表格中仍显示为空。

## 问题原因
1. 后端代码中对duration字段的判断条件不正确，使用`if record.get('duration')`会导致值为0时判断为False
2. 前端代码中同样存在此问题，使用`if (record.duration)`会导致值为0时判断为falsy

## 解决方案
1. 修改后端代码，将判断条件改为`if record.get('duration') is not None and record.get('duration') >= 0`
2. 修改前端代码，将判断条件改为`if (record.duration !== undefined && record.duration !== null && record.duration >= 0)`

## 修改的函数和数据流逻辑

### 修改的函数
1. `FeishuBitableAPI.import_records_to_bitable` - 修复后端duration字段处理逻辑
2. `FeishuBitableClient.importRecordsToBitable` - 修复前端duration字段处理逻辑

### 数据流逻辑
1. 用户保存活动详情时，会单独同步该记录到飞书多维表格
2. 同步过程中正确处理duration字段，即使值为0也能正确同步到飞书
3. 确保duration字段能够正确计算并同步到飞书多维表格

## 验证结果
1. duration字段值为0时也能正确同步到飞书
2. duration字段值大于0时能正确格式化并同步到飞书
3. 修复后的功能符合PRD文档和structure文档的要求