# 增加飞书导入今日计划日期日志

## 问题描述
从飞书导入今日计划时，导入的日期为T-1（前一天），不正确。需要增加详细的日志来诊断日期处理的问题。

## 问题分析
1. 飞书多维表格中的日期字段可能是时间戳格式（毫秒）
2. 在转换时间戳为日期时可能存在时区处理问题
3. 缺乏详细的日志信息来诊断具体的日期转换过程

## 解决方案

### 修改内容
1. 增加详细的日志记录，包括：
   - 原始日期字段值和类型
   - 时间戳转换过程的详细信息
   - 时区转换的详细信息
   - 当前系统时间信息
   - 飞书记录的完整字段信息

2. 优化时区处理逻辑：
   - 使用UTC时区解析时间戳
   - 正确转换为北京时间
   - 对比直接解析和时区转换的结果

### 具体改动

#### 1. 后端 (app.py)
在 `sync_plans_from_feishu` 函数中增加详细的日志记录：

```python
# 增加飞书记录字段信息日志
print(f"[飞书同步] 飞书记录所有字段键名: {list(fields.keys())}")

# 增加原始日期字段值日志
print(f"[飞书同步] 原始日期字段值: {activity_date} (类型: {type(activity_date)})")

# 增加时间戳转换详细日志
if isinstance(activity_date, (int, float)):
    # 添加详细的时间戳转换日志
    print(f"[飞书同步] 原始时间戳: {activity_date} (毫秒)")
    print(f"[飞书同步] 转换为秒: {activity_date / 1000}")
    
    # 使用UTC时区解析时间戳，然后转换为北京时间
    from datetime import timezone
    utc_date_obj = datetime.fromtimestamp(activity_date / 1000, tz=timezone.utc)
    print(f"[飞书同步] UTC时间对象: {utc_date_obj}")
    
    # 转换为北京时间
    beijing_date_obj = utc_date_obj.astimezone(BEIJING_TZ)
    print(f"[飞书同步] 北京时间对象: {beijing_date_obj}")
    
    # 格式化为日期字符串
    date_value = beijing_date_obj.strftime('%Y-%m-%d')
    print(f"[飞书同步] 转换时间戳 {activity_date} 为日期 {date_value}")
    
    # 对比直接解析的结果
    direct_date_obj = datetime.fromtimestamp(activity_date / 1000)
    direct_date_value = direct_date_obj.strftime('%Y-%m-%d')
    print(f"[飞书同步] 直接解析结果: {direct_date_value}")
    print(f"[飞书同步] 时区转换差异: {direct_date_value} != {date_value} ? {direct_date_value != date_value}")

# 增加最终日期值和当前系统时间日志
print(f"[飞书同步] 最终使用的日期值: {date_value}")
current_beijing_time = datetime.now(BEIJING_TZ)
print(f"[飞书同步] 当前北京时间: {current_beijing_time.strftime('%Y-%m-%d %H:%M:%S')}")
print(f"[飞书同步] 当前北京时间日期: {current_beijing_time.strftime('%Y-%m-%d')}")
```

## 测试建议

### 测试步骤
1. 配置飞书集成（App ID 和 App Secret）
2. 点击【从飞书导入】按钮
3. 观察控制台输出的详细日志信息
4. 检查导入的今日计划日期是否正确
5. 检查本地 plans.json 文件中的日期是否正确

## 注意事项

1. **日志级别**：增加的日志为调试级别，有助于诊断日期处理问题
2. **时区处理**：确保正确处理UTC时间戳到北京时间的转换
3. **兼容性**：保持对不同日期格式（时间戳和字符串）的兼容处理
4. **错误处理**：增强日期转换过程中的错误处理和日志记录

## 相关经验
- **飞书数据同步完整性**：实现飞书数据同步功能时，必须确保后端真实完成数据拉取与存储，不能仅停留在前端提示层面
- **系统集成问题排查规范**：排查第三方服务集成问题时，应先增强前后端错误日志，再通过控制台和网络面板收集详细错误信息