# 新增记录文件导出功能

## 功能描述
为时间记录器增加记录文件的导出功能，仅支持导出对应用户名的记录文件。

## 实现方案
1. 在后端添加导出记录的API接口
2. 在前端历史记录页面添加导出按钮和相关功能
3. 为导出按钮添加相应样式

## 修改的函数和数据流逻辑

### 后端修改
1. 在app.py中添加`/api/export-records`路由接口
2. 实现export_records函数，用于导出指定用户的记录文件

### 前端修改
1. 在records.html中添加导出按钮
2. 实现exportRecords JavaScript函数，用于处理导出逻辑
3. 在records-controls.css中添加导出按钮样式

## 代码修改

### app.py
```python
@app.route('/api/export-records', methods=['GET'])
def export_records():
    """导出记录文件"""
    try:
        # 获取用户名参数
        username = request.args.get('username', 'default')
        
        if not username:
            return jsonify({
                'success': False,
                'error': '用户名不能为空'
            }), 400
        
        # 加载该用户的记录
        records = TimeRecorderUtils.load_records_by_username(username)
        
        # 返回JSON格式的记录数据
        return jsonify({
            'success': True,
            'records': records,
            'username': username,
            'count': len(records)
        })
        
    except Exception as e:
        print(f"导出记录失败: {e}")
        return jsonify({
            'success': False,
            'error': f'导出记录失败: {str(e)}'
        }), 500
```

### records.html
```html
<!-- 在筛选按钮区域添加导出按钮 -->
<div class="filter-actions">
    <button class="control-btn search-btn" onclick="applyFilters()">搜索</button>
    <button class="control-btn reset-btn" onclick="resetFilters()">重置</button>
    <button class="control-btn export-btn" onclick="exportRecords()">导出记录</button>
</div>
```

```javascript
// 导出记录
function exportRecords() {
    // 显示确认对话框
    if (!confirm(`确定要导出用户 "${currentUsername}" 的所有记录吗？`)) {
        return;
    }
    
    // 发送请求导出记录
    fetch(`/api/export-records?username=${encodeURIComponent(currentUsername)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 创建要下载的JSON数据
                const jsonData = JSON.stringify(data.records, null, 2);
                
                // 创建Blob对象
                const blob = new Blob([jsonData], { type: 'application/json' });
                
                // 创建下载链接
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `records_${currentUsername}.json`;
                
                // 触发下载
                document.body.appendChild(a);
                a.click();
                
                // 清理
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
                
                alert(`成功导出 ${data.count} 条记录`);
            } else {
                alert('导出记录失败: ' + data.error);
            }
        })
        .catch(error => {
            console.error('导出记录失败:', error);
            alert('导出记录失败，请查看控制台了解详情');
        });
}
```

### records-controls.css
```css
.export-btn {
    background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 15px;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 4px 10px rgba(33, 150, 243, 0.2);
}

.export-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(33, 150, 243, 0.3);
}
```

## 验证结果
修改后，用户可以在历史记录页面点击"导出记录"按钮，将当前用户的记录导出为JSON文件。导出功能仅能导出当前登录用户的记录，确保了数据的安全性。