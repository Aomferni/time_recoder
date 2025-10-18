# 飞书同步优化 - 支持更新已存在记录

## 问题描述
原实现中，每次同步今日计划到飞书时都会创建新记录，导致同一天多次同步会产生重复记录。

## 需求
如果飞书多维表格中已有当前日期的记录，应该是更新记录，而不是新建一条记录。

## 解决方案

### 实现逻辑
采用"存在则更新，不存在则创建"的策略：

```
1. 查询飞书表格中是否已存在当天日期的记录
   ↓
2. 如果存在 → 调用更新API（PUT）
   ↓
3. 如果不存在 → 调用创建API（POST）
   ↓
4. 返回相应的成功消息（告知用户是更新还是创建）
```

### 技术实现

#### 1. 查询已存在记录
使用飞书多维表格的搜索API，根据日期字段筛选：

```python
# 构建筛选条件：查询日期字段等于当前日期的记录
search_url = f"https://open.feishu.cn/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/search"
search_payload = {
    "filter": {
        "conjunction": "and",
        "conditions": [
            {
                "field_name": date_field_name,  # 日期字段名
                "operator": "is",
                "value": [timestamp_value]  # 毫秒级时间戳
            }
        ]
    }
}

search_response = requests.post(search_url, json=search_payload, headers=headers)
```

#### 2. 更新已存在记录
如果查询到记录，使用更新API：

```python
if existing_record_id:
    # 更新已存在的记录
    update_url = f"https://open.feishu.cn/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/{existing_record_id}"
    update_response = requests.put(
        update_url,
        json={"fields": feishu_record['fields']},
        headers=headers
    )
```

#### 3. 创建新记录
如果未查询到记录，创建新记录：

```python
else:
    # 创建新记录
    result = feishu_api.import_records_to_bitable(
        [feishu_record],
        app_token=app_token,
        table_id=table_id
    )
```

#### 4. 返回不同的消息
根据操作类型返回相应消息：

```python
if result.get('updated'):
    message = f'同步到飞书成功（已更新日期 {date_str} 的记录）'
elif result.get('created'):
    message = f'同步到飞书成功（已创建日期 {date_str} 的新记录）'
```

## 修改的函数

### 后端 (app.py)
- **函数**: `sync_daily_plan_to_feishu`
- **路径**: `/api/daily-plan/sync-feishu`
- **改动**: 
  1. 新增记录查询逻辑
  2. 实现更新/创建分支逻辑
  3. 优化返回消息，告知用户操作类型

## 数据流逻辑

### 优化后的同步流程
```
获取飞书字段信息
   ↓
建立字段映射
   ↓
加载今日计划数据
   ↓
格式化数据（日期、时长等）
   ↓
【新增】查询是否已存在当天记录
   ↓
   ├─ 存在 → 调用更新API (PUT)
   │         ↓
   │    返回"已更新"消息
   │
   └─ 不存在 → 调用创建API (POST)
              ↓
         返回"已创建"消息
   ↓
更新本地同步状态
```

## API说明

### 飞书搜索记录API
- **接口**: `POST /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/search`
- **参数**:
  ```json
  {
    "filter": {
      "conjunction": "and",
      "conditions": [
        {
          "field_name": "字段名",
          "operator": "is",
          "value": [值]
        }
      ]
    }
  }
  ```

### 飞书更新记录API
- **接口**: `PUT /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}`
- **参数**:
  ```json
  {
    "fields": {
      "字段名": "字段值"
    }
  }
  ```

## 测试建议

### 测试场景1：首次同步（创建）
1. 确保飞书表格中没有当天日期的记录
2. 填写今日计划
3. 点击"同步到飞书"
4. 预期：提示"已创建日期 YYYY-MM-DD 的新记录"

### 测试场景2：重复同步（更新）
1. 修改今日计划内容
2. 再次点击"同步到飞书"
3. 预期：提示"已更新日期 YYYY-MM-DD 的记录"
4. 验证：飞书表格中只有一条记录，且内容已更新

### 测试场景3：跨日同步
1. 在不同日期分别同步
2. 预期：飞书表格中有多条记录，每个日期一条

## 注意事项

1. **日期字段必须映射成功**：查询功能依赖日期字段映射，确保字段映射逻辑正确
2. **时间戳格式**：查询时使用毫秒级时间戳，与创建/更新时保持一致
3. **错误处理**：如果查询失败，会默认创建新记录，确保功能可用
4. **权限要求**：需要飞书应用有读取和写入多维表格的权限

## 优势

1. **避免重复记录**：同一天多次同步不会产生重复数据
2. **数据完整性**：确保每天只有一条记录，数据更清晰
3. **用户体验**：明确告知用户是更新还是创建操作
4. **向后兼容**：不影响原有创建逻辑，首次同步仍正常工作

## 相关文件
- `/Users/amy/Documents/codes/time_recoder/app.py` - 后端API
- `/Users/amy/Documents/codes/time_recoder/static/js/modules/dailyPlan.js` - 前端模块
