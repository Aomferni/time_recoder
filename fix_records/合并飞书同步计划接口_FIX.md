# 合并飞书同步计划接口

## 问题描述
项目中存在两个功能相同的飞书同步今日计划接口：
1. `/api/init/sync-plans` - 用于初始化时同步今日计划
2. `/api/feishu/sync-plans` - 用于日常同步今日计划

这两个接口实现了完全相同的功能，造成了代码重复。

## 问题分析
1. 两个接口的实现逻辑完全一致
2. 造成代码维护困难，需要同时修改两个地方
3. 增加了代码复杂性和出错风险
4. 违反了DRY（Don't Repeat Yourself）原则

## 解决方案

### 修改内容
1. 合并两个接口为一个统一的接口 `/api/feishu/sync-plans`
2. 更新前端调用以使用统一的接口
3. 删除重复的代码实现

### 具体改动

#### 1. 后端 (app.py)
```python
# 合并两个路由装饰器
@app.route('/api/feishu/sync-plans', methods=['POST'])
@app.route('/api/init/sync-plans', methods=['POST'])
def sync_plans_from_feishu():
    # 统一的实现逻辑
    # ...
```

#### 2. 前端 (feishuConfig.js)
```javascript
// 更新调用路径
const plansResponse = await fetch('/api/feishu/sync-plans', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
});
```

#### 3. 前端 (records.js)
```javascript
// 更新调用路径
const plansResponse = await fetch('/api/feishu/sync-plans', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
});
```

#### 4. 前端 (init.html)
```javascript
// 更新调用路径
const response = await fetch('/api/feishu/sync-plans', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
});
```

## 修改的函数

### 后端 (app.py)
- **函数**: `sync_plans_from_feishu`
- **路径**: `/api/feishu/sync-plans` 和 `/api/init/sync-plans`
- **改动**: 
  1. 合并两个路由装饰器
  2. 保留统一的实现逻辑
  3. 删除重复的函数定义

### 前端 (feishuConfig.js)
- **函数**: `importFromFeishu`
- **改动**: 更新调用路径为 `/api/feishu/sync-plans`

### 前端 (records.js)
- **函数**: `syncRecordsFromFeishu`
- **改动**: 更新调用路径为 `/api/feishu/sync-plans`

### 前端 (init.html)
- **函数**: `syncPlansFromFeishu`
- **改动**: 更新调用路径为 `/api/feishu/sync-plans`

## 数据流逻辑

### 修复后的同步流程
```
1. 用户点击【从飞书导入】或【同步计划】按钮
   ↓
2. 调用统一的 `/api/feishu/sync-plans` 接口
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
5. 在初始化流程中测试同步功能

## 注意事项

1. **接口兼容性**：确保所有调用方都已更新为使用新的统一接口
2. **错误处理**：保持原有的错误处理逻辑不变
3. **数据一致性**：确保同步的数据格式和内容保持一致
4. **文档更新**：更新相关文档以反映接口合并

## 相关文件
- `/Users/amy/Documents/codes/time_recoder/app.py` - 后端API
- `/Users/amy/Documents/codes/time_recoder/static/js/modules/feishuConfig.js` - 飞书配置模块
- `/Users/amy/Documents/codes/time_recoder/static/js/modules/records.js` - 记录列表模块
- `/Users/amy/Documents/codes/time_recoder/templates/init.html` - 初始化页面

## 相关经验
- **飞书数据双向同步机制**（记忆ID: 2b97111a-a789-4649-bab6-4c08b4eb5a09）
- **代码复用原则**：优先复用和优化原接口和已有代码，避免重复开发