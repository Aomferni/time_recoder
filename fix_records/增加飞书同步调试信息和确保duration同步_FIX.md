# 增加飞书同步调试信息和确保duration同步

## 问题描述
1. 飞书同步时缺乏足够的调试信息，无法确认同步的具体活动
2. 需要确保duration(总计专注时长)字段正确同步到飞书

## 解决方案
1. 在飞书同步时增加打印活动名称和duration的调试信息
2. 确保后端和前端都正确处理duration字段的计算和传递

## 修改的函数和数据流逻辑

### 修改的函数
1. `TimeRecorderRecordDetail.syncRecordToFeishu` - 增加活动名称和duration的打印
2. 验证`FeishuBitableClient.importRecordsToBitable` - 确保duration字段正确计算
3. 验证`FeishuBitableAPI.import_records_to_bitable` - 确保duration字段正确处理

### 数据流逻辑
1. 用户保存活动详情时，会单独同步该记录到飞书多维表格
2. 同步前打印活动名称和duration用于调试
3. 确保duration字段正确计算并同步到飞书

## 验证结果
1. 飞书同步时能够正确打印活动名称和duration
2. duration字段能够正确同步到飞书多维表格
3. 修复后的功能符合PRD文档和structure文档的要求