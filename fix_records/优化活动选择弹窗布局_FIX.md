# 优化活动选择弹窗布局

## 问题描述
【选择活动】的浮窗当前按活动类别分组显示，每个类别都有独立的标题和容器，导致界面显得较为分散。用户希望将不同类别的活动按钮放在同一行显示，每行最多展示8个按钮，同时确保在手机端也能良好适配。

## 解决方案
修改活动选择弹窗的HTML结构和CSS样式，将所有活动按钮放在统一的网格容器中，移除类别分组显示，通过CSS网格布局实现每行最多显示8个按钮，并优化移动端适配。

## 修改的函数和数据流逻辑

### 1. 修改的文件
- `static/js/script.js` - 修改活动选择弹窗的HTML结构生成逻辑
- `static/css/modules/detail-modal.css` - 修改活动选择弹窗的CSS样式

### 2. JavaScript修改
- 修改`showActivitySelectionModal`函数，移除按类别分组的逻辑
- 创建统一的活动按钮容器`.activities-selection-container`
- 将所有活动按钮直接添加到统一容器中，不再创建类别标题和容器

### 3. CSS样式修改
- 添加`.activities-selection-container`类，使用网格布局
- 设置网格列数为`repeat(auto-fill, minmax(100px, 1fr))`，实现响应式布局
- 移除类别标题和容器的样式显示
- 优化移动端适配，调整网格列数和按钮样式

### 4. 数据流逻辑
```
用户点击活动选择区域
    ↓
触发showActivitySelectionModal函数
    ↓
收集所有活动类别中的活动按钮
    ↓
将所有按钮添加到统一的网格容器中
    ↓
渲染活动选择弹窗
    ↓
用户点击任意活动按钮
    ↓
设置选中的活动和活动类别
    ↓
更新计时器区域颜色和类别显示
    ↓
关闭弹窗
```

## 优势
- 界面更加紧凑，提高空间利用率
- 用户可以更快速地找到所需活动
- 保持功能完整性，不影响活动选择功能
- 响应式设计，适配不同屏幕尺寸
- 提升用户体验，使界面更加现代化

## 修复记录：优化活动选择弹窗布局

## 问题描述
1. 【选择活动】浮窗没有占据整体的3/5宽度
2. 【选择活动】浮窗的布局不够紧凑，浪费了屏幕空间

## 问题分析
通过代码分析发现，问题出在[detail-modal.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/detail-modal.css)文件中：
1. 活动选择弹窗的宽度设置不正确，没有统一设置为页面的3/5宽度
2. 活动选择弹窗的内边距、外边距和字体大小等设置使得布局不够紧凑

## 解决方案
1. 更新[detail-modal.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/detail-modal.css)文件中的活动选择弹窗样式，确保其占据整体的3/5宽度
2. 优化活动选择弹窗的布局，减小内边距、外边距和字体大小，使布局更加紧凑

## 修改内容

### 1. 修改detail-modal.css文件
更新活动选择弹窗样式，确保其占据整体的3/5宽度并优化布局：

```css
/* 活动选择弹窗样式 */
#activitySelectionModal .modal-content {
    width: 60%; /* 占据页面的3/5 */
    max-width: 1000px; /* 设置最大宽度 */
    margin: 5% auto;
    padding: 15px; /* 减少内边距使布局更紧凑 */
    border-radius: 10px;
    background: white;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

/* 活动类别容器 */
.activity-category-box {
    margin-bottom: 15px; /* 减少外边距使布局更紧凑 */
    padding: 12px; /* 减少内边距使布局更紧凑 */
    border: 1px solid #eee;
    border-radius: 8px;
    background-color: #fafafa;
}

/* 活动类别标题 */
.activity-category-title {
    margin: 0 0 10px 0; /* 减少外边距使布局更紧凑 */
    padding: 0 0 8px 0; /* 减少内边距使布局更紧凑 */
    color: #333;
    font-size: 16px; /* 稍微减小字体大小 */
    font-weight: 600;
    border-bottom: 2px solid #ddd;
}

/* 活动类别按钮容器 */
.activity-category-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); /* 调整最小宽度使布局更紧凑 */
    gap: 8px; /* 减少间距使布局更紧凑 */
}

#activitySelectionModal .activity-btn {
    margin: 0;
    padding: 10px 6px; /* 减少内边距使布局更紧凑 */
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-size: 12px; /* 稍微减小字体大小 */
    font-weight: 500;
    transition: all 0.2s ease;
    text-align: center;
    min-height: 40px; /* 减少最小高度使布局更紧凑 */
    display: flex;
    align-items: center;
    justify-content: center;
    word-break: break-word;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

同时更新移动端优化样式：

```css
/* 移动端优化 */
@media (max-width: 480px) {
    .modal-content {
        width: 95%;
        margin: 10% auto;
        padding: 15px;
    }
    
    .activity-category-buttons {
        grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); /* 移动端进一步调整 */
        gap: 6px;
    }
    
    #activitySelectionModal .activity-btn {
        padding: 8px 5px;
        font-size: 11px;
        min-height: 35px;
    }
    
    .activity-category-title {
        font-size: 15px;
    }
    
    #activitySelectionModal .modal-content {
        padding: 12px;
    }
    
    .activity-category-box {
        padding: 10px;
        margin-bottom: 12px;
    }
}
```

## 验证结果
通过本地测试，确认以下功能正常工作：
1. 【选择活动】浮窗正确占据整体的3/5宽度
2. 【选择活动】浮窗的布局更加紧凑，更好地利用了屏幕空间
3. 在不同屏幕尺寸下都能正确显示
4. 保持与现有功能的一致性

## 影响范围
- 活动选择弹窗样式
- 响应式设计
- 保持与现有代码的一致性