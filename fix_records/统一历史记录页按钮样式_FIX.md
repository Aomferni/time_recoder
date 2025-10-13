# 统一历史记录页按钮样式

## 功能描述
统一历史记录页面中【搜索】、【重置】、【导出记录】、【导入记录】四个按钮的样式，使它们具有一致的外观和交互效果。

## 实现方案
1. 修改records-controls.css文件，统一四个按钮的样式
2. 移除导入按钮的特殊样式，使其与其他按钮保持一致

## 修改的函数和数据流逻辑

### CSS修改
1. 在records-controls.css中创建统一的按钮样式类
2. 移除导入按钮的特殊样式（如:before伪元素图标）
3. 统一四个按钮的背景色、阴影、过渡效果等样式属性

## 代码修改

### records-controls.css
```css
/* 统一四个按钮的样式 */
.search-btn, .reset-btn, .export-btn, .import-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 15px;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
    min-width: 100px;
    text-align: center;
}

.search-btn:hover, .reset-btn:hover, .export-btn:hover, .import-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(102, 126, 234, 0.4);
}

.search-btn:active, .reset-btn:active, .export-btn:active, .import-btn:active {
    transform: translateY(-1px);
}

/* 移除导入按钮的特殊样式 */
.import-btn {
    display: inline-block;
    align-items: center;
    gap: 8px;
    min-width: 100px;
}

.import-btn::before {
    content: '';
    font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .records-controls {
        padding: 15px;
    }
    
    .filter-row {
        gap: 15px;
    }
    
    .filter-group {
        min-width: 140px;
    }
    
    .filter-group label {
        font-size: 14px;
    }
    
    .filter-group input,
    .filter-group select {
        padding: 8px 10px;
        font-size: 14px;
    }
    
    .search-btn,
    .reset-btn,
    .export-btn,
    .import-btn {
        padding: 8px 16px;
        font-size: 14px;
    }
}
```

## 验证结果
修改后，历史记录页面中的四个按钮（搜索、重置、导出记录、导入记录）具有统一的样式：
- 相同的紫色渐变背景色
- 相同的圆角边框
- 相同的阴影效果
- 相同的悬停和点击动画效果
- 相同的最小宽度和内边距

这使得界面更加美观和一致，提升了用户体验。