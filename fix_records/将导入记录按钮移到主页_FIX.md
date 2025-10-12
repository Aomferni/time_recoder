# 将导入记录按钮移到主页修复记录

## 问题描述
用户反馈导入记录功能只在【管理类别】页面中可用，希望将其移到主页，方便日常使用。

## 修复方案
1. 在主页的用户区域添加导入记录按钮
2. 实现导入记录功能的前端逻辑
3. 添加相应的CSS样式美化导入按钮和状态显示
4. 保持原有的导入功能逻辑不变

## 修改内容

### 1. 修改主页HTML模板
文件：`/templates/index.html`

在用户区域添加导入记录功能：
```html
<!-- 导入记录按钮 -->
<div class="import-section">
    <input type="file" id="recordFileInput" accept=".json" class="file-input" style="display: none;">
    <button class="control-btn import-btn" id="importRecordBtn">导入记录</button>
    <div id="importStatus" class="import-status"></div>
</div>
```

添加导入记录的JavaScript逻辑：
```javascript
// 导入记录功能
document.addEventListener('DOMContentLoaded', function() {
    const importBtn = document.getElementById('importRecordBtn');
    const fileInput = document.getElementById('recordFileInput');
    const importStatus = document.getElementById('importStatus');
    
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
    
    // 导入记录文件函数
    function importRecordFile(file) {
        if (!file) {
            showImportStatus('请选择要导入的文件', 'error');
            return;
        }
        
        const username = window.TimeRecorderConfig ? window.TimeRecorderConfig.currentUsername : null;
        if (!username || username === 'default') {
            showImportStatus('请先设置用户名', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('username', username);
        
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
                fileInput.value = '';
                // 重新加载记录
                if (window.TimeRecorderUI && window.TimeRecorderUI.loadRecords) {
                    window.TimeRecorderUI.loadRecords();
                }
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
});
```

### 2. 添加CSS样式
文件：`/static/css/modules/user-section.css`

添加导入记录部分的样式：
```css
/* 导入记录部分样式 */
.import-section {
    display: flex;
    align-items: center;
    gap: 10px;
}

.import-btn {
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 15px;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 4px 10px rgba(0, 123, 255, 0.3);
    display: inline-flex;
    align-items: center;
    gap: 8px;
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

添加响应式设计：
```css
@media (max-width: 768px) {
    .import-section {
        order: 3;
        width: 100%;
        justify-content: center;
        margin-top: 10px;
    }
}

@media (max-width: 480px) {
    .import-btn {
        padding: 8px 15px;
        font-size: 14px;
    }
}
```

## 效果
- 导入记录按钮现在显示在主页的用户区域
- 用户可以方便地导入记录文件
- 导入过程有状态提示（正在导入、成功、失败）
- 导入成功后会自动刷新记录列表
- 界面美观，符合整体设计风格
- 支持响应式设计，在移动设备上也能正常使用