# 飞书字段名匹配错误修复记录

## 问题描述
在同步今日计划到飞书时，出现 `FieldNameNotFound` 错误，导致同步失败。

### 错误信息
```
dailyPlan.js:468  错误堆栈: Error: HTTP error! status: 500, message: {
  "error": "导入记录失败 (批次 1): FieldNameNotFound",
  "success": false
}
```

## 问题原因
根据飞书API规范和历史经验记忆，调用飞书多维表格API时，必须使用字段的**完整显示名称**作为fields键值，而非简化名称或字段ID。

原代码中使用的字段名（如 `日期(计划日期)`、`重要的三件事(今日重点)` 等）与飞书表格中的实际字段名不匹配，导致API报错。

## 解决方案

### 修改内容
修改了 `/Users/amy/Documents/codes/time_recoder/app.py` 文件中的 `sync_daily_plan_to_feishu` 函数。

### 具体改动

#### 1. 增加字段信息获取逻辑
在同步前先调用飞书API获取表格的实际字段列表：
```python
# 首先获取表格字段信息以确定正确的字段名
fields_url = f"https://open.feishu.cn/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/fields"
fields_response = requests.get(fields_url, headers=headers)
```

#### 2. 建立字段映射机制
通过关键词匹配自动建立简化名到完整字段名的映射：
```python
field_mapping = {}

# 根据字段名中的关键词建立映射
for field in field_items:
    field_name = field.get('field_name', '')
    if '日期' in field_name or 'date' in field_name.lower():
        field_mapping['date'] = field_name
    elif '重要' in field_name or 'important' in field_name.lower():
        field_mapping['importantThings'] = field_name
    # ... 其他字段映射
```

#### 3. 使用映射后的字段名构建记录
```python
feishu_record = {
    "fields": {}
}

# 根据字段映射填充数据
if 'date' in field_mapping:
    feishu_record['fields'][field_mapping['date']] = timestamp_value
if 'importantThings' in field_mapping:
    feishu_record['fields'][field_mapping['importantThings']] = '\n'.join(plan.get('importantThings', []))
# ... 其他字段
```

#### 4. 增加错误处理
```python
# 如果无法获取字段信息，返回错误
if fields_response.status_code != 200:
    return jsonify({
        'success': False,
        'error': f'无法获取飞书表格字段信息: {fields_response.text}'
    }), 500

# 如果无法建立字段映射，返回错误
if not field_mapping:
    return jsonify({
        'success': False,
        'error': '无法建立字段映射，请检查飞书表格配置'
    }), 500
```

## 修改的函数

### 后端 (app.py)
- **函数**: `sync_daily_plan_to_feishu`
- **路径**: `/api/daily-plan/sync-feishu`
- **改动**: 
  1. 增加飞书表格字段信息获取逻辑
  2. 实现字段名自动映射机制
  3. 使用映射后的完整字段名构建飞书记录
  4. 增强错误处理和日志输出

## 数据流逻辑

### 修复后的同步流程
```
1. 接收同步请求
   ↓
2. 获取飞书表格字段信息
   ↓
3. 解析字段列表，建立字段映射
   ↓
4. 加载今日计划数据
   ↓
5. 格式化数据（日期、时长等）
   ↓
6. 使用映射后的字段名构建飞书记录
   ↓
7. 调用飞书API创建记录
   ↓
8. 更新同步状态
```

### 字段映射规则
| 内部字段名 | 匹配关键词 | 示例字段名 |
|-----------|----------|-----------|
| date | 日期/date | 日期、计划日期、Date |
| importantThings | 重要/important | 重要的三件事、今日重点 |
| tryThings | 尝试/try | 要尝试的三件事、今日尝试 |
| otherMatters | 其他/other | 其他事项、其他待办 |
| reading | 充电/阅读/reading | 今日充电、阅读学习 |
| score | 评分（非原因） | 今日评分、自评等级 |
| scoreReason | 原因/reason | 评分原因、评分说明 |
| activities | 活动+明细 | 今日活动、活动明细 |
| emotions | 情绪/emotion | 今日情绪、情绪记录 |
| totalDuration | 专注+总 | 专注时长、总时长 |
| creationDuration | 创作/creation | 创作时长、创作专注 |

## 测试建议

### 测试步骤
1. 确保飞书配置正确（App ID 和 App Secret）
2. 填写今日计划内容
3. 点击"同步到飞书"按钮
4. 查看浏览器控制台输出的字段映射信息
5. 检查飞书表格是否成功创建记录

### 调试信息
修复后的代码会在控制台输出详细的调试信息：
- 字段API响应状态
- 表格字段列表
- 字段映射结果
- 飞书记录数据
- API调用结果

## 注意事项

1. **字段名必须完全匹配**：飞书API对字段名大小写敏感，必须使用完整的显示名称
2. **字段类型要匹配**：
   - 日期字段必须使用毫秒级时间戳
   - 多选字段（如情绪）必须使用数组格式
   - 文本字段使用字符串格式
3. **权限检查**：确保飞书应用有写入多维表格的权限
4. **表格ID正确**：确认使用的是正确的 app_token 和 table_id

## 相关文件
- `/Users/amy/Documents/codes/time_recoder/app.py` - 后端API
- `/Users/amy/Documents/codes/time_recoder/static/js/modules/dailyPlan.js` - 前端模块

## 相关经验
- **飞书多维表格API字段命名规范**（记忆ID: 56daa288-84a2-4d1b-aeb3-8dc6a904b74e）
- **飞书日期字段转换规范**（记忆ID: a58bdd85-a31d-474d-af50-532a9352bb14）
