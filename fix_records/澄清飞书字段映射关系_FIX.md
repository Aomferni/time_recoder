# 澄清飞书字段映射关系

## 问题描述
在从飞书多维表格同步今日计划数据时，importantThings、tryThings、score、scoreReason等字段的映射关系不够明确，导致开发和维护过程中容易出现混淆。

## 解决方案
1. 在PRD文档中明确字段映射关系：
   - `importantThings` 对应飞书多维表格中的 "今天重要的三件事" 字段
   - `tryThings` 对应飞书多维表格中的 "今天要尝试的三件事" 字段
   - `score` 对应飞书多维表格中的 "给今天打个分" 字段
   - `scoreReason` 对应飞书多维表格中的 "为什么？" 字段

2. 在structure文档中添加相同的字段映射说明，确保技术文档的一致性

3. 确认后端同步逻辑已正确实现这些字段的映射

## 验证结果
通过检查后端代码，确认sync_plans_from_feishu函数已正确实现这些字段的映射：
- important_things_text = fields.get('重要的三件事', '')
- try_things_text = fields.get('要尝试的三件事', '')
- local_plan['score'] = fields.get('给今天打个分', '')
- local_plan['scoreReason'] = fields.get('为什么？', '')

## 影响范围
- PRD文档更新
- structure文档更新
- VERSIONS.md版本记录更新