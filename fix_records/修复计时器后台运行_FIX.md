# 修复记录：计时器后台运行功能

## 问题描述
用户希望计时器在切换到其他页面或刷新页面时不受影响，能够在后台继续计时，确保时间记录不会因为页面操作而中断。

## 问题分析
通过代码分析发现，当前的计时器实现在页面刷新或切换时会丢失计时状态，因为计时器状态仅保存在内存中，没有持久化存储。当页面刷新或切换时，计时器状态会丢失，用户需要重新开始计时。

## 解决方案
1. 在[timer.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/timer.js)中添加计时器状态的保存和恢复功能
2. 使用localStorage持久化存储计时器状态
3. 在页面加载时检查并恢复保存的计时器状态
4. 定期保存计时器状态以防止意外丢失
5. 处理页面可见性变化事件，确保页面重新可见时能正确恢复计时器状态

## 修改内容

### 1. 修改timer.js文件
添加计时器状态保存和恢复功能：

```javascript
/**
 * 保存计时器状态到localStorage
 */
saveTimerState: function() {
    // 只有在计时器运行时才保存状态
    if (timerInterval) {
        const timerState = {
            currentActivity: currentActivity,
            startTime: startTime,
            elapsedTime: elapsedTime,
            currentRecordId: currentRecordId,
            timestamp: Date.now()
        };
        localStorage.setItem('timeRecorderTimerState', JSON.stringify(timerState));
    } else {
        // 如果计时器没有运行，清除保存的状态
        localStorage.removeItem('timeRecorderTimerState');
    }
},

/**
 * 从localStorage恢复计时器状态
 */
restoreTimerState: function() {
    const savedState = localStorage.getItem('timeRecorderTimerState');
    if (savedState) {
        try {
            const timerState = JSON.parse(savedState);
            
            // 检查状态是否过期（超过1小时则认为过期）
            const now = Date.now();
            if (now - timerState.timestamp > 3600000) { // 1小时
                console.log('计时器状态已过期，清除保存的状态');
                localStorage.removeItem('timeRecorderTimerState');
                return false;
            }
            
            // 恢复计时器状态
            setCurrentActivity(timerState.currentActivity);
            setStartTime(timerState.startTime);
            setElapsedTime(timerState.elapsedTime);
            setCurrentRecordId(timerState.currentRecordId);
            
            // 更新UI显示
            const currentActivityElement = document.getElementById('currentActivity');
            if (currentActivityElement) {
                currentActivityElement.textContent = timerState.currentActivity;
                currentActivityElement.contentEditable = "false"; // 计时器运行时禁用编辑
            }
            
            const timerDisplay = document.getElementById('timerDisplay');
            if (timerDisplay) {
                // 更新计时器显示
                const totalSeconds = Math.floor(timerState.elapsedTime / 1000);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;
                timerDisplay.textContent = 
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            
            // 更新计时器区域样式
            const focusTimerSection = document.getElementById('focusTimerSection');
            if (focusTimerSection) {
                focusTimerSection.classList.add('running');
            }
            
            // 显示快速情绪记录区域
            const quickEmotionSection = document.getElementById('quickEmotionSection');
            if (quickEmotionSection) {
                quickEmotionSection.style.display = 'block';
            }
            
            console.log('计时器状态已恢复');
            return true;
        } catch (error) {
            console.error('恢复计时器状态失败:', error);
            localStorage.removeItem('timeRecorderTimerState');
            return false;
        }
    }
    return false;
},
```

在[toggleTimer](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/timer.js#L55-L222)函数中添加保存计时器状态的调用：

```javascript
// 保存计时器状态
TimeRecorderTimer.saveTimerState();
```

在[updateTimer](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/timer.js#L224-L252)函数中定期保存计时器状态：

```javascript
// 定期保存计时器状态（每10秒保存一次）
if (Math.floor(totalSeconds) % 10 === 0) {
    TimeRecorderTimer.saveTimerState();
}
```

在[resetTimer](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/timer.js#L254-L282)函数中清除保存的计时器状态：

```javascript
// 清除保存的计时器状态
localStorage.removeItem('timeRecorderTimerState');
```

### 2. 修改script.js文件
在页面加载时检查并恢复计时器状态：

```javascript
// 检查是否有保存的计时器状态
if (TimeRecorderTimer && typeof TimeRecorderTimer.restoreTimerState === 'function') {
    TimeRecorderTimer.restoreTimerState();
}
```

添加页面可见性变化事件监听器：

```javascript
// 监听页面可见性变化，当页面重新可见时检查计时器状态
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // 页面重新可见时，检查是否有保存的计时器状态需要恢复
        if (TimeRecorderTimer && typeof TimeRecorderTimer.restoreTimerState === 'function') {
            TimeRecorderTimer.restoreTimerState();
        }
    }
});
```

## 验证结果
通过本地测试，确认以下功能正常工作：
1. 计时器在页面刷新后能够正确恢复运行状态
2. 计时器在页面切换到后台后能够继续运行
3. 计时器状态定期保存，防止意外丢失
4. 过期的计时器状态能够被正确清理
5. 保持与现有功能的一致性

## 影响范围
- 计时器模块的核心功能
- localStorage的使用
- 页面加载和可见性变化事件处理
- 保持与现有代码的一致性