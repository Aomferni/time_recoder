# 主页添加飞书配置按钮 - 修复记录

## 问题描述

用户请求在主页也添加一个【飞书配置】按钮，方便在主页直接配置飞书应用的App ID和App Secret，而不需要跳转到历史记录页面。

## 解决方案

### 1. 修改文件列表

1. **templates/index.html** - 主页HTML模板
   - 引入飞书配置CSS样式文件
   - 在导航区域添加飞书配置按钮
   - 添加飞书配置模态框HTML结构

2. **static/js/script.js** - 主页JavaScript
   - 添加`showFeishuConfig()`函数：显示飞书配置模态框
   - 添加`closeFeishuConfig()`函数：关闭飞书配置模态框
   - 添加`saveFeishuConfig()`函数：保存飞书配置
   - 添加模态框点击外部区域关闭的事件监听

3. **static/css/modules/user-section.css** - 用户区域样式
   - 添加飞书配置按钮样式（与导航链接保持一致的设计风格）
   - 使用渐变背景色（蓝色到绿色）
   - 添加悬停和点击效果

### 2. 核心实现逻辑

#### 2.1 飞书配置按钮位置
```html
<div class="top-navigation">
    <a href="/records" class="nav-link">查看历史记录</a>
    <a href="/mood-wall" class="nav-link">情绪与活动墙</a>
    <a href="/project-description" class="nav-link">项目说明</a>
    <a href="/manage-categories" class="nav-link">管理类别</a>
    <button class="control-btn feishu-config-btn" onclick="window.showFeishuConfig()">飞书配置</button>
</div>
```

#### 2.2 飞书配置模态框结构
```html
<div id="feishuConfigModal" class="modal" style="display: none;">
    <div class="modal-content">
        <span class="close" onclick="window.closeFeishuConfig()">&times;</span>
        <h2>飞书配置</h2>
        <div class="detail-form">
            <div class="highlight-field">
                <label for="feishuAppId">App ID:</label>
                <input type="text" id="feishuAppId" placeholder="请输入飞书应用的App ID">
            </div>
            <div class="highlight-field">
                <label for="feishuAppSecret">App Secret:</label>
                <input type="password" id="feishuAppSecret" placeholder="请输入飞书应用的App Secret">
            </div>
            <div class="detail-actions">
                <button type="button" class="save-btn" onclick="window.saveFeishuConfig()">保存</button>
                <button type="button" class="cancel-btn" onclick="window.closeFeishuConfig()">取消</button>
            </div>
        </div>
    </div>
</div>
```

#### 2.3 JavaScript函数实现

**显示飞书配置模态框**：
```javascript
window.showFeishuConfig = async function() {
    try {
        // 获取当前飞书配置
        const response = await fetch('/api/feishu/config');
        const data = await response.json();
        
        if (data.success) {
            // 填充配置信息
            document.getElementById('feishuAppId').value = data.config.app_id || '';
            document.getElementById('feishuAppSecret').value = ''; // 不返回secret
            
            // 显示模态框
            const modal = document.getElementById('feishuConfigModal');
            if (modal) {
                modal.style.display = 'block';
            }
        } else {
            throw new Error(data.error || '获取飞书配置失败');
        }
    } catch (error) {
        console.error('获取飞书配置失败:', error);
        alert('获取飞书配置失败: ' + error.message);
    }
};
```

**保存飞书配置**：
```javascript
window.saveFeishuConfig = async function() {
    try {
        const appId = document.getElementById('feishuAppId').value.trim();
        const appSecret = document.getElementById('feishuAppSecret').value.trim();
        
        // 验证输入
        if (!appId) {
            alert('请输入App ID');
            return;
        }
        
        // 如果用户没有输入新的App Secret，则不更新
        const updateData = {
            app_id: appId
        };
        
        // 只有当用户输入了新的App Secret时才更新
        if (appSecret) {
            updateData.app_secret = appSecret;
        }
        
        // 发送更新请求
        const response = await fetch('/api/feishu/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('飞书配置保存成功');
            window.closeFeishuConfig();
        } else {
            throw new Error(data.error || '保存飞书配置失败');
        }
    } catch (error) {
        console.error('保存飞书配置失败:', error);
        alert('保存飞书配置失败: ' + error.message);
    }
};
```

### 3. 样式设计

飞书配置按钮采用与导航链接一致的设计风格：
- 圆角按钮（border-radius: 50px）
- 渐变背景色（蓝色#0066ff到绿色#00b900）
- 光泽动画效果
- 悬停时上移和放大
- 点击时轻微压缩
- 阴影效果增强视觉层次

## 数据流逻辑

### 显示飞书配置流程
```
用户点击飞书配置按钮
    ↓
调用 window.showFeishuConfig()
    ↓
GET /api/feishu/config
    ↓
填充 App ID 到输入框
    ↓
显示飞书配置模态框
```

### 保存飞书配置流程
```
用户填写 App ID 和 App Secret
    ↓
点击保存按钮
    ↓
调用 window.saveFeishuConfig()
    ↓
验证 App ID 是否为空
    ↓
构造更新数据（只包含填写的字段）
    ↓
POST /api/feishu/config
    ↓
保存成功，显示提示
    ↓
关闭模态框
```

## 测试验证

### 测试内容
1. ✅ 飞书配置按钮显示在导航区域
2. ✅ 点击按钮打开飞书配置模态框
3. ✅ 模态框显示当前的App ID
4. ✅ 保存新的App ID和App Secret
5. ✅ 点击关闭按钮或模态框外部区域关闭模态框
6. ✅ App Secret为空时只更新App ID

### 预期结果
- 主页导航区域显示【飞书配置】按钮
- 点击按钮显示飞书配置模态框
- 能够查看和修改飞书配置
- 保存成功后关闭模态框并显示提示

## 影响范围

### 修改的文件
1. `/templates/index.html` - 添加飞书配置按钮和模态框
2. `/static/js/script.js` - 添加飞书配置相关函数
3. `/static/css/modules/user-section.css` - 添加飞书配置按钮样式

### 新增的功能
- 主页飞书配置入口
- 主页飞书配置模态框
- 主页飞书配置保存功能

### 不受影响的功能
- 历史记录页面的飞书配置功能保持不变
- 所有其他页面和功能均不受影响

## 注意事项

1. **样式一致性**：飞书配置按钮采用与导航链接相同的设计风格，确保UI一致性
2. **模态框复用**：飞书配置模态框的HTML结构和样式与历史记录页面保持一致
3. **函数命名**：使用`window.`前缀确保函数在HTML的onclick属性中可访问
4. **安全性**：App Secret在获取配置时不返回，只有用户输入新的Secret时才更新
5. **用户体验**：保存成功后自动关闭模态框，避免用户手动关闭

## 关联文档

- PRD.md - 产品需求文档
- structure.md - 项目架构文档
- VERSION.md - 版本更新记录
