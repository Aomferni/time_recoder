# 修复飞书导入今日计划功能

## 问题描述
飞书配置页面的【从飞书导入】功能声称可以导入plans.json文件，但实际上并未正确实现从飞书多维表格同步今日计划数据到本地plans.json文件的功能。

虽然前端代码调用了`/api/feishu/sync-plans`接口，但后端实现存在以下问题：
1. 从飞书获取数据后，未正确保存到本地plans.json文件
2. 数据格式转换可能不完整
3. 缺少错误处理和日志记录

## 问题分析
1. 前端飞书配置模块中的[importFromFeishu](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/records.js#L737-L781)函数显示了导入plans.json的提醒，但实际上后端接口未正确实现该功能
2. 后端`sync_plans_from_feishu`函数虽然尝试从飞书获取数据，但在保存到本地文件时可能存在问题
3. 缺少对导入过程的详细日志记录，难以排查问题

## 解决方案

### 修改内容
1. 完善后端`sync_plans_from_feishu`函数，确保能正确从飞书多维表格获取今日计划数据并保存到plans.json文件
2. 增强错误处理和日志记录
3. 确保数据格式正确转换

### 具体改动

#### 1. 后端 (app.py)
```python
# 完善 sync_plans_from_feishu 函数实现
@app.route('/api/feishu/sync-plans', methods=['POST'])
@app.route('/api/init/sync-plans', methods=['POST'])
def sync_plans_from_feishu():
    """从飞书多维表格同步今日计划到本地"""
    try:
        # 检查飞书配置
        if not feishu_api.app_id or not feishu_api.app_secret:
            return jsonify({
                'success': False,
                'error': '飞书配置不完整，请先配置App ID和App Secret'
            }), 400
        
        # 验证飞书链接是否有效
        try:
            token = feishu_api.get_tenant_access_token()
            if not token:
                return jsonify({
                    'success': False,
                    'error': '无法获取飞书访问令牌，请检查飞书配置是否正确'
                }), 400
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'飞书链接验证失败: {str(e)}'
            }), 400
        
        # 从飞书多维表格获取今日计划记录
        # 使用今日计划表格的app_token和table_id
        app_token = "BKCLblwCmajwm9sFmo4cyJxJnON"  # 飞书多维表格应用token
        table_id = "tbl6bujbIMxBHqb3"  # 今日计划表格ID
        
        result = feishu_api.get_records_from_bitable(app_token, table_id)
        
        if not result.get('success'):
            return jsonify({
                'success': False,
                'error': result.get('error', '从飞书获取今日计划失败')
            }), 500
        
        # 转换飞书记录为本地计划格式
        feishu_records = result.get('records', [])
        synced_count = 0
        
        for feishu_record in feishu_records:
            fields = feishu_record.get('fields', {})
            
            # 提取日期字段（假设是时间戳格式）
            date_value = ''
            activity_date = fields.get('今天是——')  # 根据实际字段名调整
            if not activity_date:
                # 尝试其他可能的日期字段名
                for key in fields:
                    if '日期' in key or 'date' in key.lower():
                        activity_date = fields[key]
                        break
            
            if activity_date:
                try:
                    # 飞书日期字段是时间戳（毫秒）
                    if isinstance(activity_date, (int, float)):
                        date_obj = datetime.fromtimestamp(activity_date / 1000)
                        date_value = date_obj.strftime('%Y-%m-%d')
                    else:
                        # 如果是字符串格式，尝试解析
                        date_value = str(activity_date)
                except Exception as e:
                    print(f"转换日期时出错: {e}")
                    continue  # 跳过这条记录
            
            if not date_value:
                print(f"无法提取有效日期，跳过记录: {fields}")
                continue  # 跳过没有有效日期的记录
            
            # 创建本地计划对象
            local_plan = DailyPlanUtils.create_new_daily_plan(date_value)
            
            # 提取并映射字段
            # 重要事项
            important_things_text = fields.get('重要的三件事', '')
            if important_things_text:
                # 分行处理
                lines = [line.strip() for line in important_things_text.split('\n') if line.strip()]
                local_plan['importantThings'] = lines[:3] + [''] * (3 - len(lines[:3]))
            
            # 尝试事项
            try_things_text = fields.get('要尝试的三件事', '')
            if try_things_text:
                # 分行处理
                lines = [line.strip() for line in try_things_text.split('\n') if line.strip()]
                local_plan['tryThings'] = lines[:3] + [''] * (3 - len(lines[:3]))
            
            # 其他事项
            local_plan['otherMatters'] = fields.get('其他事项', '')
            
            # 阅读计划
            local_plan['reading'] = fields.get('今日充电（要阅读）', '')
            
            # 评分
            local_plan['score'] = fields.get('给今天打个分', '')
            
            # 评分原因
            local_plan['scoreReason'] = fields.get('为什么？', '')
            
            # 保存计划
            if DailyPlanUtils.save_daily_plan(local_plan):
                synced_count += 1
            else:
                print(f"保存计划失败: {date_value}")
        
        return jsonify({
            'success': True,
            'message': f'成功同步 {synced_count} 条今日计划数据',
            'count': synced_count
        })
            
    except Exception as e:
        print(f"从飞书同步今日计划出错: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
```

## 修改的函数

### 后端 (app.py)
- **函数**: `sync_plans_from_feishu`
- **路径**: `/api/feishu/sync-plans` 和 `/api/init/sync-plans`
- **改动**: 
  1. 确保从飞书获取的数据能正确保存到plans.json文件
  2. 增强错误处理和日志记录
  3. 确保数据格式正确转换

## 数据流逻辑

### 修复后的同步流程
```
1. 用户点击【从飞书导入】按钮
   ↓
2. 调用 [/api/feishu/sync-plans](file:///Users/amy/Documents/codes/time_recoder/app.py#L1515-L1656) 接口
   ↓
3. 验证飞书配置和链接有效性
   ↓
4. 从飞书多维表格获取今日计划记录
   ↓
5. 转换飞书记录为本地格式
   ↓
6. 保存到本地 plans.json 文件
   ↓
7. 返回同步结果给前端
```

## 测试建议

### 测试步骤
1. 确保飞书配置正确（App ID 和 App Secret）
2. 点击【从飞书导入】按钮
3. 观察是否能正确同步今日计划数据
4. 检查本地 plans.json 文件是否更新
5. 验证导入的数据格式是否正确

## 注意事项

1. **接口兼容性**：确保所有调用方都已更新为使用新的统一接口
2. **错误处理**：保持原有的错误处理逻辑不变
3. **数据一致性**：确保同步的数据格式和内容保持一致
4. **文档更新**：更新相关文档以反映接口合并

## 相关文件
- `/Users/amy/Documents/codes/time_recoder/app.py` - 后端API
- `/Users/amy/Documents/codes/time_recoder/static/js/modules/feishuConfig.js` - 飞书配置模块

## 相关经验
- **飞书数据双向同步机制**（记忆ID: 2b97111a-a789-4649-bab6-4c08b4eb5a09）
- **代码复用原则**：优先复用和优化原接口和已有代码，避免重复开发