# 今日计划折叠时显示重要事项优化

## 需求描述
用户希望在今日计划面板折叠后，仍然能看到"重要的三件事"，这样即使面板收起也能快速查看当天最重要的任务。

## 解决方案

### 1. UI设计
在今日计划面板中添加一个简要视图区域：
- 默认隐藏，只在面板折叠时显示
- 以列表形式展示"重要的三件事"
- 过滤空值，只显示已填写的事项
- 如果没有填写，显示"还未填写"提示

### 2. 交互逻辑
**折叠状态切换**：
- 点击【收起】→ 隐藏完整内容，显示简要视图，按钮文字变为【展开】
- 点击【展开】→ 显示完整内容，隐藏简要视图，按钮文字变为【收起】

**自动更新**：
- 填写重要事项后失焦自动更新简要视图
- 保存计划后更新简要视图
- 刷新统计数据时更新简要视图

### 3. 实现细节

#### 3.1 HTML结构
在 `index.html` 中添加简要视图区域：
```html
<!-- 折叠时显示的简要视图 -->
<div class="daily-plan-summary" id="daily-plan-summary" style="display: none;">
    <div class="summary-title">🎯 今天重要的三件事：</div>
    <ol class="summary-list" id="summary-important-things">
        <li class="summary-item-empty">还未填写</li>
    </ol>
</div>
```

#### 3.2 CSS样式
添加简要视图样式：
```css
/* 折叠时的简要视图 */
.daily-plan-summary {
    margin-top: 15px;
    padding: 15px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    backdrop-filter: blur(10px);
}

.summary-title {
    font-size: 16px;
    font-weight: bold;
    color: #ffd700;
    margin-bottom: 10px;
}

.summary-list {
    margin: 0;
    padding-left: 25px;
    list-style: decimal;
}

.summary-list li {
    padding: 5px 0;
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.95);
}

.summary-item-empty {
    opacity: 0.6;
    font-style: italic;
    list-style: none;
    margin-left: -25px;
}
```

#### 3.3 JavaScript逻辑

**新增方法**：
```javascript
updateSummaryView: function() {
    const summaryList = document.getElementById('summary-important-things');
    if (!summaryList || !this.currentPlan) return;
    
    const importantThings = this.currentPlan.importantThings || ['', '', ''];
    
    // 过滤空值
    const filledThings = importantThings.filter(thing => thing && thing.trim() !== '');
    
    if (filledThings.length === 0) {
        summaryList.innerHTML = '<li class="summary-item-empty">还未填写</li>';
    } else {
        const html = filledThings.map(thing => 
            `<li>${thing}</li>`
        ).join('');
        summaryList.innerHTML = html;
    }
}
```

**修改折叠逻辑**：
```javascript
toggleBtn.addEventListener('click', () => {
    const content = document.querySelector('.daily-plan-content');
    const summary = document.getElementById('daily-plan-summary');
    
    if (content && summary) {
        const isHidden = content.style.display === 'none';
        
        if (isHidden) {
            // 展开：显示完整内容，隐藏简要视图
            content.style.display = 'grid';
            summary.style.display = 'none';
            toggleBtn.textContent = '收起';
        } else {
            // 折叠：隐藏完整内容，显示简要视图
            content.style.display = 'none';
            summary.style.display = 'block';
            toggleBtn.textContent = '展开';
            // 更新简要视图
            this.updateSummaryView();
        }
    }
});
```

**自动更新触发点**：
1. 输入框失焦时（重要事项）
2. 保存计划后
3. 刷新统计数据后

### 4. 数据流

```
用户填写重要事项
  ↓
输入框失焦
  ↓
保存计划
  ↓
更新简要视图
  ↓
点击收起按钮
  ↓
显示简要视图
  ↓
展示重要的三件事
```

### 5. 用户体验优化

#### 5.1 视觉设计
- 简要视图使用半透明背景，与整体风格一致
- 金色标题突出重点
- 有序列表清晰展示任务
- 空状态提示用户填写

#### 5.2 交互优化
- 折叠展开流畅过渡
- 自动更新无需手动操作
- 按钮文字准确反映状态
- 过滤空值避免显示空白项

#### 5.3 功能增强
- 即使折叠也能看到核心任务
- 节省屏幕空间的同时保持信息可见
- 支持动态更新，实时同步

### 6. 测试要点

#### 功能测试
- [ ] 折叠时显示简要视图
- [ ] 展开时隐藏简要视图
- [ ] 按钮文字正确切换
- [ ] 已填写的事项正确显示
- [ ] 未填写时显示提示文字
- [ ] 只显示非空事项
- [ ] 填写后自动更新简要视图

#### 交互测试
- [ ] 点击收起按钮，面板折叠
- [ ] 点击展开按钮，面板展开
- [ ] 填写重要事项后失焦，简要视图更新
- [ ] 保存计划后，简要视图更新

#### 视觉测试
- [ ] 简要视图样式正确
- [ ] 列表样式美观
- [ ] 空状态提示清晰
- [ ] 响应式布局正常

### 7. 修改文件清单

- ✅ `/templates/index.html` - 添加简要视图HTML结构
- ✅ `/static/css/modules/daily-plan.css` - 添加简要视图样式
- ✅ `/static/js/modules/dailyPlan.js` - 添加更新逻辑和修改事件处理

### 8. 后续优化建议

#### 功能增强
1. **显示完成状态**：支持标记事项完成，显示删除线
2. **优先级标识**：为重要事项添加优先级标识
3. **时间提醒**：添加事项的截止时间提醒
4. **快捷操作**：在简要视图中支持快速编辑

#### 交互优化
1. **动画过渡**：添加折叠展开的平滑动画
2. **手势支持**：移动端支持滑动折叠展开
3. **快捷键**：支持键盘快捷键控制折叠展开

#### 数据展示
1. **进度显示**：显示重要事项完成进度
2. **统计信息**：在简要视图中显示今日统计数据
3. **情绪概览**：显示今日主要情绪

### 9. 技术要点

#### 状态管理
- 使用CSS `display` 属性控制显示/隐藏
- JavaScript维护折叠状态
- 动态更新DOM内容

#### 性能优化
- 只在需要时更新简要视图
- 过滤空值减少DOM操作
- 事件监听优化避免重复绑定

#### 代码质量
- 方法职责单一
- 逻辑清晰易维护
- 注释完善便于理解

## 更新日期
2025-10-18

## 修改人
Amy
