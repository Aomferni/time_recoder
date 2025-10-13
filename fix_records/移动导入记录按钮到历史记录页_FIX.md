# 移动导入记录按钮到历史记录页

## 功能描述
将【导入记录】按钮从主页移动到历史记录页，放置在【导出记录】按钮的右侧。

## 实现方案
1. 在历史记录页面(records.html)中添加导入记录按钮及相关元素
2. 在历史记录页面中添加导入记录的JavaScript函数和事件监听器
3. 为导入记录按钮添加相应CSS样式
4. 从主页(index.html)中移除原有的导入记录按钮及相关代码

## 修改的函数和数据流逻辑

### 前端修改
1. 在records.html中添加导入记录按钮、文件输入框和状态显示区域
2. 实现importRecordFile函数处理文件导入逻辑
3. 实现showImportStatus函数显示导入状态
4. 添加事件监听器处理按钮点击和文件选择
5. 在records-controls.css中添加导入按钮相关样式
6. 从index.html中移除原有的导入记录相关HTML和JavaScript代码

## 代码修改

### records.html
```html
<!-- 在筛选按钮区域添加导入记录按钮 -->
<div class="filter-actions">
    <button class="control-btn search-btn" onclick="applyFilters()">搜索</button>
    <button class="control-btn reset-btn" onclick="resetFilters()">重置</button>
    <button class="control-btn export-btn" onclick="exportRecords()">导出记录</button>
    <!-- 导入记录按钮 -->
    <div class="import-section">
        <input type="file" id="recordFileInput" accept=".json" class="file-input" style="display: none;">
        <button class="control-btn import-btn" id="importRecordBtn">导入记录</button>
        <div id="importStatus" class="import-status"></div>
    </div>
</div>
```

```javascript
// 导入记录文件函数
function importRecordFile(file) {
    if (!file) {
        showImportStatus('请选择要导入的文件', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', currentUsername);
    
    showImportStatus('正在导入...', 'info');
    
    fetch('/api/import-records', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showImportStatus(`导入成功！共导入 ${data.imported_count} 条记录`, 'success');
            // 清空文件选择
            document.getElementById('recordFileInput').value = '';
            // 重新加载记录
            loadRecords();
        } else {
            showImportStatus(`导入失败: ${data.error}`, 'error');
        }
    })
    .catch(error => {
        console.error('导入记录失败:', error);
        showImportStatus('导入失败，请查看控制台了解详情', 'error');
    });
}

// 显示导入状态
function showImportStatus(message, type) {
    const importStatus = document.getElementById('importStatus');
    if (!importStatus) return;
    
    importStatus.textContent = message;
    importStatus.className = 'import-status ' + type;
    
    // 3秒后自动清除状态信息
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            importStatus.textContent = '';
            importStatus.className = 'import-status';
        }, 3000);
    }
}

// 在DOMContentLoaded事件监听器中添加导入记录相关事件监听器
// 添加导入记录相关事件监听器
const importBtn = document.getElementById('importRecordBtn');
const fileInput = document.getElementById('recordFileInput');

if (importBtn && fileInput) {
    // 点击导入按钮时触发文件选择
    importBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    // 文件选择后处理导入
    fileInput.addEventListener('change', function() {
        if (fileInput.files && fileInput.files.length > 0) {
            importRecordFile(fileInput.files[0]);
        }
    });
}
```

### records-controls.css
```css
.import-btn {
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 15px;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 4px 10px rgba(0, 123, 255, 0.3);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 120px;
}

.import-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(0, 123, 255, 0.4);
}

.import-btn:active {
    transform: translateY(-1px);
}

.import-btn::before {
    content: '↑';
    font-size: 16px;
}

.import-section {
    display: flex;
    align-items: center;
    gap: 10px;
    /* 确保导入区域不会遮盖其他元素 */
    z-index: 2;
    position: relative;
}

.file-input {
    display: none;
}

.import-status {
    padding: 8px 12px;
    border-radius: 6px;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.3s ease;
}

.import-status.success {
    background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
    color: #155724;
    border: 1px solid #c3e6cb;
}

.import-status.error {
    background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.import-status.info {
    background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
    color: #0c5460;
    border: 1px solid #bee5eb;
}
```

### index.html
```html
<!-- 移除了原有的导入记录按钮相关HTML代码 -->
```

```javascript
// 移除了原有的导入记录相关JavaScript代码
```

## 验证结果
修改后，用户可以在历史记录页面看到"导出记录"和"导入记录"两个按钮，它们并排显示在筛选按钮的右侧。导入功能与之前保持一致，用户可以选择JSON文件导入记录，导入成功后会自动刷新记录列表。