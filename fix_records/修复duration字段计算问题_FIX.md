# 修复duration字段计算问题

## 问题描述
记录中的duration字段与实际segments计算的结果不一致，导致飞书同步时显示错误的时长信息。

## 问题原因
在更新记录时，只有当记录中还没有startTime时才会重新计算duration等时间字段，这导致当segments被更新但记录已有startTime时，duration字段不会被更新。

## 解决方案
修改更新记录的逻辑，确保当segments被更新时，总是重新计算duration、startTime、endTime、pauseCount和timeSpan等字段。

## 修改的函数和数据流逻辑

### 修改的函数
1. `update_record` - 修改更新记录逻辑，确保segments更新时重新计算所有时间字段

### 数据流逻辑
1. 用户更新记录的segments时，后端会重新计算所有相关的时间字段
2. 重新计算的字段包括：startTime、endTime、duration、pauseCount、timeSpan
3. 更新后的记录能正确反映实际的活动时长
4. 飞书同步时能正确显示准确的时长信息

## 验证结果
1. 更新记录时能正确重新计算duration字段
2. 飞书同步时能正确显示准确的时长信息
3. 修复后的功能符合PRD文档和structure文档的要求