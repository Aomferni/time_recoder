# 修复点击【继续】按钮计时器颜色问题

## 问题描述
用户报告点击【继续】按钮后，计时器区域的颜色没有根据活动类别进行更新，导致视觉上不一致。

## 问题分析
经过代码分析，发现以下问题：

1. 在[continueActivity](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/ui.js#L957-L1032)函数中，虽然设置了当前活动和活动类别，但没有更新计时器区域的颜色
2. 与活动选择弹窗中的实现相比，缺少了更新计时器颜色的逻辑

## 修复方案
1. 在[continueActivity](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/ui.js#L957-L1032)函数中添加更新计时器颜色的逻辑
2. 确保计时器区域的颜色与活动类别保持一致
3. 同时更新计时器中的类别显示文本

## 代码修改

### 修改文件: `/static/js/modules/ui.js`

在[continueActivity](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/ui.js#L957-L1032)函数中添加以下代码：

```javascript
// 更新计时器区域的颜色
const focusTimerSection = document.getElementById('focusTimerSection');
if (focusTimerSection && record.activityCategory) {
    // 移除所有类别颜色类
    const colorClasses = ['btn-work-output', 'btn-charge', 'btn-rest', 'btn-create', 'btn-gap', 'btn-entertainment'];
    colorClasses.forEach(cls => {
        focusTimerSection.classList.remove(cls);
    });
    
    // 添加新的类别颜色类
    const categoryClass = TimeRecorderFrontendUtils.getActivityCategoryClass(record.activityCategory);
    focusTimerSection.classList.add(categoryClass);
    
    // 更新计时器中的类别显示
    // 查找或创建类别显示元素
    let categoryElement = focusTimerSection.querySelector('.focus-category');
    if (!categoryElement) {
        categoryElement = document.createElement('div');
        categoryElement.className = 'focus-category';
        // 插入到timer-display之后
        const timerDisplay = focusTimerSection.querySelector('.timer-display');
        if (timerDisplay) {
            timerDisplay.parentNode.insertBefore(categoryElement, timerDisplay.nextSibling);
        }
    }
    categoryElement.textContent = record.activityCategory;
}
```

## 验证方法
1. 在历史记录中选择一个有活动类别的记录
2. 点击【继续】按钮
3. 观察计时器区域颜色是否正确更新为对应活动类别的颜色
4. 检查计时器下方是否显示了正确的活动类别名称

## 影响范围
- 点击【继续】按钮后的计时器颜色显示
- 计时器区域的类别文本显示

## 注意事项
- 确保在更新计时器颜色时正确处理了所有可能的活动类别
- 保持与活动选择弹窗中颜色更新逻辑的一致性