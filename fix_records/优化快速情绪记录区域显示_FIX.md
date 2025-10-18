# 优化快速情绪记录区域显示

## 问题描述
快速记录情绪页面的选项同时显示表情图标和文字，界面显得较为拥挤。用户希望只显示表情图标，当鼠标移动到选项上方时才显示文字。

## 解决方案
修改快速情绪记录区域的HTML结构和CSS样式，将表情图标和文字分离，通过CSS控制只在鼠标悬停时显示文字。

## 修改的函数和数据流逻辑

### 1. 修改的文件
- `templates/index.html` - 修改快速情绪记录区域的HTML结构
- `static/css/modules/timer.css` - 修改情绪按钮的样式

### 2. HTML结构修改
将每个情绪按钮的HTML结构从：
```html
<button class="emotion-btn" data-emotion="惊奇" style="background-color: #9C27B0;">✨ 惊奇</button>
```

修改为：
```html
<button class="emotion-btn" data-emotion="惊奇" style="background-color: #9C27B0;" title="惊奇">
    <span class="emotion-icon">✨</span>
    <span class="emotion-text">惊奇</span>
</button>
```

### 3. CSS样式修改
- 为情绪按钮添加相对定位
- 为情绪文字添加绝对定位，初始状态隐藏
- 通过:hover伪类控制鼠标悬停时显示文字

### 4. 数据流逻辑
```
页面加载
    ↓
渲染快速情绪记录区域
    ↓
每个情绪按钮包含图标和文字元素
    ↓
默认只显示图标
    ↓
用户鼠标悬停到按钮上
    ↓
显示对应的情绪文字
    ↓
用户点击情绪按钮
    ↓
调用recordQuickEmotion函数记录情绪
```

## 优势
- 界面更加简洁美观
- 提升用户体验，减少视觉干扰
- 保持功能完整性，不影响情绪记录功能
- 响应式设计，适配不同屏幕尺寸