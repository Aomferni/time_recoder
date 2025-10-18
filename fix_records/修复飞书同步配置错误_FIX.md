# 修复飞书同步配置错误

## 问题描述
在同步今日计划到飞书时出现错误："获取访问令牌失败: invalid param"。这表明飞书应用的App ID或App Secret配置不正确。

## 问题分析
通过分析代码和错误信息发现：

1. 错误发生在获取飞书租户访问令牌时，返回"invalid param"错误
2. 这通常是由于App ID或App Secret为空或不正确导致的
3. 原来的错误处理不够友好，没有明确指出配置问题

## 解决方法
1. **改进错误检查**：在获取访问令牌前检查App ID和App Secret是否配置
2. **优化错误信息**：针对"invalid param"错误提供更友好的提示信息
3. **增强用户体验**：明确告知用户需要配置飞书应用凭证

## 修改的文件
- `app.py` - 第1230行开始，修改`FeishuBitableAPI.get_tenant_access_token`方法：
  - 增加App ID和App Secret配置检查
  - 针对"invalid param"错误提供更明确的提示

## 验证结果
修改后，当飞书配置不正确时会显示明确的错误信息，指导用户正确配置飞书应用凭证。

## 使用建议
用户需要：
1. 在飞书开放平台创建自建应用
2. 获取App ID和App Secret
3. 在应用界面点击"飞书配置"按钮
4. 输入正确的App ID和App Secret
5. 点击保存