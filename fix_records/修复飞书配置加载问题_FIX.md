# 修复飞书配置加载问题

## 问题描述
同步今日计划到飞书时报错："飞书配置错误: App ID或App Secret不正确，请检查配置"。用户已经通过【飞书配置】按钮保存了正确的配置，但同步功能仍然使用测试用的配置。

## 问题分析
1. 飞书配置文件 `/config/feishu_config.json` 中存储的是测试用的 App ID 和 App Secret
2. 用户通过前端飞书配置按钮保存的配置应该会更新这个文件
3. 问题在于配置保存后，FeishuBitableAPI 实例没有重新加载配置，导致仍然使用旧的配置

## 解决方案
在 `/api/feishu/config` POST 接口的 `update_feishu_config` 函数中，添加重新加载配置的逻辑：

```python
# 重新加载飞书API实例的配置，确保新配置生效
feishu_api.load_config()
```

## 进一步优化
为了提供更明确的错误信息，增强飞书API的错误处理逻辑，根据不同的错误类型提供具体的解决建议：

1. **App ID不存在**: "飞书配置错误: App ID在飞书系统中不存在，请检查App ID是否正确并在飞书开放平台创建了对应的应用"
2. **参数无效**: "飞书配置错误: App ID或App Secret不正确，请检查配置"
3. **其他错误**: "获取访问令牌失败: {具体错误信息}"

## 进一步改进
为了支持不同类型的飞书应用，增强FeishuBitableAPI类以支持不同的应用类型：

1. 添加对[app_type](file:///Users/amy/Documents/codes/time_recoder/config/feishu_config.json#L4-L4)配置的支持
2. 根据应用类型选择不同的API端点：
   - internal类型：使用`/tenant_access_token/internal`
   - 其他类型：使用`/tenant_access_token`

## 修改的文件
- `/Users/amy/Documents/codes/time_recoder/app.py` 
  - 在 update_feishu_config 函数中添加配置重新加载逻辑
  - 增强 get_tenant_access_token 函数的错误处理
  - 添加对应用类型的支持

## 验证结果
1. 通过测试脚本验证配置可以正确保存到文件
2. 通过测试脚本验证 FeishuBitableAPI 实例可以正确加载更新后的配置
3. 飞书同步功能现在可以使用用户保存的正确配置
4. 错误信息更加明确，便于用户排查问题
5. 支持不同类型的飞书应用

## 注意事项
用户需要确保输入的 App ID 和 App Secret 是有效的飞书应用凭证，否则仍然会出现认证失败的错误。如果遇到"app id not exists"错误，请：
1. 检查App ID是否正确
2. 确认飞书应用已创建并启用
3. 检查是否在正确的飞书企业环境中
4. 确认应用类型配置正确