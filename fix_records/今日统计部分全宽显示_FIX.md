# 修复记录：【今日统计】部分全宽显示

## 问题描述
用户要求将【今日统计】部分设置为全宽显示，而不是与其他简要视图内容一样采用网格布局。

## 解决方案
修改HTML结构和CSS样式，将【今日统计】部分从[daily-plan-summary](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/daily-plan.css#L43-L43)容器中分离出来，创建独立的全宽显示区域。

## 修改内容

### 1. HTML结构调整
将【今日统计】部分从[daily-plan-summary](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/daily-plan.css#L43-L43)容器中移出，创建独立的[daily-plan-stats-full-width](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/daily-plan.css#L50-L57)容器：

```html
<!-- 折叠时显示的简要视图 -->
<div class="daily-plan-summary" id="daily-plan-summary" style="display: block;">
    <!-- 其他简要视图内容 -->
</div>

<!-- 新增：今日统计数据（全宽显示） -->
<div class="daily-plan-stats-full-width" id="daily-plan-stats-full-width" style="display: block; margin-top: 15px;">
    <div class="daily-plan-stats-content">
        <div class="daily-plan-stats-title">📊 今日统计</div>
        <div class="summary-stats">
            <div class="summary-stat-item">
                <div class="stat-label">专注时长</div>
                <div class="stat-value" id="summary-total-duration">0小时0分</div>
            </div>
            <div class="summary-stat-item">
                <div class="stat-label">创作时长</div>
                <div class="stat-value" id="summary-creation-duration">0小时0分</div>
            </div>
            <div class="summary-stat-item">
                <div class="stat-label">活动次数</div>
                <div class="stat-value" id="summary-activity-count">0次</div>
            </div>
        </div>
    </div>
</div>
```

### 2. CSS样式调整
添加新的CSS类来支持全宽显示效果：

```css
/* 折叠时的全宽统计数据视图 */
.daily-plan-stats-full-width {
    margin-top: 15px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    backdrop-filter: blur(10px);
}

.daily-plan-stats-content {
    width: 100%;
}

.daily-plan-stats-title {
    font-size: 18px;
    font-weight: bold;
    color: #ffd700;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 2px solid rgba(255, 215, 0, 0.3);
    text-align: center;
}
```

### 3. JavaScript逻辑更新
修改JavaScript代码以支持全宽统计数据的更新：

1. 在[updateSummaryView](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/dailyPlan.js#L178-L268)函数中添加对全宽统计数据的更新调用
2. 添加新的[updateFullWidthStats](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/dailyPlan.js#L328-L369)函数专门处理全宽统计数据更新
3. 修改[setCollapsedState](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/dailyPlan.js#L602-L636)函数以正确控制全宽统计数据的显示/隐藏

## 验证结果
通过本地测试，确认【今日统计】部分现在以全宽形式显示，与其他简要视图内容分离，提升了视觉效果和信息层次感。

## 影响范围
- 仅影响今日计划模块在折叠状态下的显示效果
- 不影响展开状态下的功能
- 不影响其他模块的功能