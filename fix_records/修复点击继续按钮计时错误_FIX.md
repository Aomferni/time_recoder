# 修复点击【继续】按钮计时错误问题

## 问题描述
用户报告点击【继续】按钮后，计时显示不正确，存在时间计算错误的问题。

## 问题分析
经过代码分析，发现以下问题：

1. 在[continueActivity](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/ui.js#L957-L1032)函数中，设置开始时间时使用了错误的时间处理逻辑
2. 时间处理不一致，应该统一使用UTC时间存储，但在某些地方错误地添加了8小时的时区偏移
3. 计时器更新逻辑中时间计算存在问题

## 修复方案
1. 修正[continueActivity](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/ui.js#L957-L1032)函数中的时间处理逻辑
2. 确保所有时间处理逻辑统一使用UTC时间存储
3. 修正计时器更新逻辑中的时间计算

## 代码修改

### 修改文件: `/static/js/modules/ui.js`

在[continueActivity](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/ui.js#L957-L1032)函数中:

```javascript
// 设置开始时间为当前时间（用于当前段落计时）
// 使用UTC时间存储
setStartTime(new Date().getTime());
// elapsedTime应该从0开始计时
setElapsedTime(0);
```

### 修改文件: `/static/js/modules/timer.js`

在[updateTimer](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/timer.js#L209-L231)函数中:

```javascript
/**
 * 更新计时器显示
 */
updateTimer: function() {
    // 使用UTC时间存储，但显示时转换为北京时间
    const now = new Date().getTime();
    setElapsedTime(now - startTime);
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
        timerDisplay.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // 同步更新表格中的计时时长
    // 直接更新表格显示，因为计算逻辑已在工具类中处理
    TimeRecorderUI.updateRecordsTable();
}
```

## 验证方法
1. 点击历史记录中的【继续】按钮
2. 观察计时器显示是否正确
3. 检查时间记录是否准确

## 影响范围
- 点击【继续】按钮后的计时准确性
- 时间记录的存储和显示

## 注意事项
- 确保所有时间处理逻辑统一使用UTC时间存储
- 显示时正确转换为北京时间
- 保持前后端时间处理逻辑的一致性