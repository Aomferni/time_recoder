# 修复记录：计时器部分全宽显示

## 问题描述
用户要求将计时器部分设置为全宽显示，而不是与其他内容一样采用两列网格布局。

## 解决方案
修改HTML结构，使用CSS Grid的`grid-column: 1 / -1`属性使计时器部分跨越所有列，占据整行宽度。

## 修改内容

### 1. HTML结构调整
为包含计时器的[.section](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/layout.css#L11-L23)容器添加样式属性：

```html
<div class="main-layout">
    <div class="section" style="grid-column: 1 / -1;">
        <div class="current-activity" id="currentActivity" contenteditable="false">请选择活动</div>
        
        <!-- 合并计时器和开始按钮 -->
        <div class="focus-timer-section" id="focusTimerSection">
            <div class="focus-label">当前持续专注时长</div>
            <div class="timer-display" id="timerDisplay">00:00:00</div>
        </div>
        
        <!-- 快速情绪记录区域 -->
        <div class="quick-emotion-section" id="quickEmotionSection" style="display: none;">
            <div class="quick-emotion-label">快速记录情绪：</div>
            <div class="quick-emotion-buttons">
                <button class="emotion-btn" data-emotion="高兴" style="background-color: #4CAF50;">😊</button>
                <button class="emotion-btn" data-emotion="专注" style="background-color: #2196F3;">😎</button>
                <button class="emotion-btn" data-emotion="平静" style="background-color: #00BCD4;">😌</button>
                <button class="emotion-btn" data-emotion="兴奋" style="background-color: #E91E63;">🤩</button>
                <button class="emotion-btn" data-emotion="疲惫" style="background-color: #9E9E9E;">😴</button>
                <button class="emotion-btn" data-emotion="焦虑" style="background-color: #FF9800;">😰</button>
            </div>
        </div>
    </div>
    
    <div class="section" style="grid-column: 1 / -1;">
        <h2>今日记录详情（<span id="currentDate"></span>）</h2>
        <table class="records-table">
            <thead>
                <tr>
                    <th>活动</th>
                    <th>开始时间</th>
                    <th>计时时长</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody id="recordsBody">
            </tbody>
        </table>
    </div>
</div>
```

## 验证结果
通过本地测试，确认计时器部分现在以全宽形式显示，占据整行宽度，提升了视觉效果和信息层次感。

## 影响范围
- 仅影响首页计时器区域的布局
- 不影响其他功能模块
- 保持响应式设计，在移动端也能正常显示