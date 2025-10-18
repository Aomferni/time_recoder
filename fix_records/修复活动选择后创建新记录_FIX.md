# 修复记录：活动选择后创建新记录

## 问题描述
用户选择新活动后，应该取消【当前】活动的选中状态并新建一个活动记录，而不是修改现有的活动记录。

## 问题分析
通过代码分析发现，在活动选择弹窗的按钮点击事件处理逻辑中，缺少了清除当前记录ID的步骤。这导致选择新活动时可能会继续使用现有的记录ID，从而修改现有记录而不是创建新记录。

## 解决方案
在活动选择弹窗的按钮点击事件处理逻辑中添加清除当前记录ID的代码，确保选择新活动时会创建新的活动记录。

## 修改内容

### 1. 修改script.js文件
在活动选择弹窗的按钮点击事件处理逻辑中添加[setCurrentRecordId(null)](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/config.js#L123-L125)调用：

```javascript
button.addEventListener('click', function() {
    // 设置选中的活动和活动类别
    setCurrentActivity(activity);
    // 清除当前记录ID，确保创建新记录而不是修改现有记录
    setCurrentRecordId(null);
    const currentActivityElement = document.getElementById('currentActivity');
    if (currentActivityElement) {
        currentActivityElement.textContent = activity;
        // 保存活动类别信息到data属性
        currentActivityElement.setAttribute('data-category', category.name);
    }
    
    // 更新计时器按钮的颜色
    const focusTimerSection = document.getElementById('focusTimerSection');
    if (focusTimerSection) {
        // 移除所有类别颜色类
        const colorClasses = ['btn-work-output', 'btn-charge', 'btn-rest', 'btn-create', 'btn-gap', 'btn-entertainment'];
        colorClasses.forEach(cls => {
            focusTimerSection.classList.remove(cls);
        });
        
        // 添加新的类别颜色类
        const categoryClass = TimeRecorderFrontendUtils.getActivityCategoryClass(category.name);
        focusTimerSection.classList.add(categoryClass);
        
        // 更新计时器中的类别显示
        updateTimerCategoryDisplay(category.name);
    }
    
    // 关闭模态框
    document.body.removeChild(modal);
});
```

### 2. 修改main.js文件
同样在main.js中的活动选择弹窗按钮点击事件处理逻辑中添加[setCurrentRecordId(null)](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/config.js#L123-L125)调用：

```javascript
button.addEventListener('click', function() {
    // 设置选中的活动
    setCurrentActivity(activity);
    // 清除当前记录ID，确保创建新记录而不是修改现有记录
    setCurrentRecordId(null);
    const currentActivityElement = document.getElementById('currentActivity');
    if (currentActivityElement) {
        currentActivityElement.textContent = activity;
    }
    
    // 关闭模态框
    document.body.removeChild(modal);
});
```

## 验证结果
通过本地测试，确认以下功能正常工作：
1. 选择新活动后正确清除当前记录ID
2. 开始计时后创建新的活动记录而不是修改现有记录
3. 保持与现有功能的一致性

## 影响范围
- 仅影响活动选择弹窗的功能
- 不影响其他核心功能
- 保持与现有代码的一致性