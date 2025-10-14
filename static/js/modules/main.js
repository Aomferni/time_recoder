/**
 * 时间记录器主模块
 */

import { 
    currentActivity, 
    startTime, 
    elapsedTime, 
    timerInterval, 
    currentRecordId, 
    records, 
    currentUsername, 
    activityCategories, 
    useSimpleDetail,
    setCurrentActivity,
    setStartTime,
    setElapsedTime,
    setTimerInterval,
    setIsPaused,
    setCurrentRecordId,
    setRecords,
    setCurrentDetailRecordId,
    setCurrentUsername,
    setActivityCategories,
    setUseSimpleDetail
} from './config.js';

import { TimeRecorderFrontendUtils } from './utils.js';
import { TimeRecorderAPI } from './api.js';
import { TimeRecorderUI } from './ui.js';
import { TimeRecorderTimer } from './timer.js';
import { TimeRecorderRecordDetail } from './recordDetail.js';

// 将配置暴露到全局作用域，以便其他模块可以访问
window.TimeRecorderConfig = {
    currentActivity,
    startTime,
    elapsedTime,
    timerInterval,
    isPaused: false,
    currentRecordId,
    records,
    currentDetailRecordId: null,
    currentUsername,
    activityCategories,
    useSimpleDetail,
    activityCategoryClassMap,
    colorClassMap,
    emotionOptions
};

// 将模块暴露到全局作用域，以便HTML可以直接调用
window.TimeRecorderFrontendUtils = TimeRecorderFrontendUtils;
window.TimeRecorderUI = TimeRecorderUI;
window.TimeRecorderTimer = TimeRecorderTimer;
window.TimeRecorderRecordDetail = TimeRecorderRecordDetail;

/**
 * 解析时间字符串为毫秒数
 */
function parseDurationString(durationStr) {
    // 支持格式：1小时30分钟、90分钟、1.5小时等
    const hourMatch = durationStr.match(/(\d+(?:\.\d+)?)\s*小时/);
    const minuteMatch = durationStr.match(/(\d+(?:\.\d+)?)\s*分钟/);
    const secondMatch = durationStr.match(/(\d+(?:\.\d+)?)\s*秒/);
    
    let totalMs = 0;
    
    if (hourMatch) {
        totalMs += parseFloat(hourMatch[1]) * 3600000;
    }
    
    if (minuteMatch) {
        totalMs += parseFloat(minuteMatch[1]) * 60000;
    }
    
    if (secondMatch) {
        totalMs += parseFloat(secondMatch[1]) * 1000;
    }
    
    // 如果没有匹配到任何单位，尝试直接解析数字作为分钟
    if (totalMs === 0 && !isNaN(parseFloat(durationStr))) {
        totalMs = parseFloat(durationStr) * 60000;
    }
    
    return totalMs > 0 ? Math.round(totalMs) : null;
}

/**
 * 更新活动按钮的可用状态
 */
function updateActivityButtonsState() {
    const activityButtons = document.querySelectorAll('.activity-btn');
    if (!currentUsername || currentUsername === 'default') {
        // 未设置用户名，禁用所有活动按钮
        activityButtons.forEach(btn => {
            if (btn) {
                btn.disabled = true;
                btn.title = '请先设置用户名';
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            }
        });
    } else {
        // 已设置用户名，启用所有活动按钮
        activityButtons.forEach(btn => {
            if (btn) {
                btn.disabled = false;
                btn.title = '';
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            }
        });
    }
}

/**
 * 设置用户名
 */
function setUsername() {
    const usernameInput = document.getElementById('usernameInput');
    if (!usernameInput) {
        console.error('找不到用户名输入框');
        return;
    }
    
    const username = usernameInput.value.trim();
    
    if (!username) {
        alert('请输入用户名');
        return;
    }
    
    // 保存旧用户名
    const oldUsername = currentUsername;
    
    // 调用后端API设置用户名并迁移记录
    TimeRecorderAPI.setUsername(username, oldUsername)
        .then(data => {
            if (data && data.success) {
                setCurrentUsername(username);
                localStorage.setItem('timeRecorderUsername', username);
                
                // 重新加载记录
                loadRecords();
                
                // 更新活动按钮状态
                updateActivityButtonsState();
                
                alert(`用户名已设置为: ${username}`);
            } else {
                alert('设置用户名失败: ' + (data.error || '未知错误'));
            }
        })
        .catch(error => {
            console.error('设置用户名失败:', error);
            alert('设置用户名失败，请查看控制台了解详情');
        });
}

/**
 * 计算时间跨度（结束时间 - 开始时间）
 */
function calculateTimeSpan(startTime, endTime) {
    try {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const span = end - start;
        return span;
    } catch (e) {
        console.error('计算时间跨度时出错:', e);
        return 0;
    }
}

/**
 * 检查是否有从历史记录页面传递的继续活动信息
 */
function checkContinueActivity() {
    const continueActivityData = localStorage.getItem('continueActivity');
    if (continueActivityData) {
        try {
            const data = JSON.parse(continueActivityData);
            
            // 设置当前活动
            if (data.activity) {
                setCurrentActivity(data.activity);
                const currentActivityElement = document.getElementById('currentActivity');
                if (currentActivityElement) {
                    currentActivityElement.textContent = `当前活动：${data.activity}`;
                    currentActivityElement.contentEditable = "true";
                }
            }
            
            // 如果有记录ID，保存它
            if (data.recordId) {
                setCurrentRecordId(data.recordId);
            }
            
            // 清除localStorage中的数据
            localStorage.removeItem('continueActivity');
            
            // 如果需要自动开始计时
            if (data.autoStart) {
                // 延迟一小段时间确保DOM更新完成后再开始计时
                setTimeout(() => {
                    if (TimeRecorderTimer && TimeRecorderTimer.toggleTimer) {
                        TimeRecorderTimer.toggleTimer();
                    }
                }, 100);
            }
        } catch (e) {
            console.error('解析继续活动数据时出错:', e);
            localStorage.removeItem('continueActivity');
        }
    }
}

/**
 * 从后端加载记录
 */
function loadRecords() {
    TimeRecorderAPI.loadRecords()
        .then(recordsData => {
            setRecords(Array.isArray(recordsData) ? recordsData : []);
            // 按开始时间倒序排列
            records.sort((a, b) => {
                if (!a || !a.startTime || !b || !b.startTime) return 0;
                return new Date(b.startTime) - new Date(a.startTime);
            });
            TimeRecorderUI.updateRecordsTable();
            TimeRecorderUI.updateStats();
        })
        .catch(error => {
            console.error('加载记录失败:', error);
        });
}

/**
 * 加载活动类别配置
 */
function loadActivityCategories() {
    TimeRecorderAPI.loadActivityCategories()
        .then(categories => {
            console.log('加载活动类别配置成功:', categories); // 添加日志
            setActivityCategories(Array.isArray(categories) ? categories : []);
            // 更新活动按钮显示
            TimeRecorderUI.updateActivityButtons();
        })
        .catch(error => {
            console.error('加载活动类别配置失败:', error);
            // 如果加载失败，使用默认配置
            const defaultCategories = [
                {
                    "name": "工作输出",
                    "color": "blue",
                    "activities": ["梳理方案", "开会", "探索新方法", "执行工作", "复盘"]
                },
                {
                    "name": "大脑充电",
                    "color": "green",
                    "activities": ["和智者对话", "做调研"]
                }
            ];
            setActivityCategories(defaultCategories);
            TimeRecorderUI.updateActivityButtons();
        });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，开始初始化...'); // 添加日志
    
    // 设置当前日期显示
    const today = new Date();
    const dateString = today.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        currentDateElement.textContent = dateString;
    }
    
    // 初始化用户名
    const savedUsername = localStorage.getItem('timeRecorderUsername');
    if (savedUsername) {
        setCurrentUsername(savedUsername);
        const usernameInputElement = document.getElementById('usernameInput');
        if (usernameInputElement) {
            usernameInputElement.value = savedUsername;
        }
        console.log('已设置用户名:', savedUsername); // 添加日志
    }
    
    // 根据用户名状态设置活动按钮的可用性
    updateActivityButtonsState();
    
    // 加载活动类别配置
    console.log('开始加载活动类别配置...'); // 添加日志
    loadActivityCategories();
    
    // 绑定设置用户名按钮事件
    const setUsernameBtn = document.getElementById('setUsernameBtn');
    if (setUsernameBtn) {
        setUsernameBtn.addEventListener('click', function() {
            setUsername();
            // 用户名设置后更新活动按钮状态
            setTimeout(updateActivityButtonsState, 100);
        });
    }
    
    // 修改"查看历史记录"链接，添加用户名参数
    const historyLink = document.querySelector('a[href="/records"]');
    if (historyLink) {
        historyLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentUsername && currentUsername !== 'default') {
                window.location.href = `/records?username=${encodeURIComponent(currentUsername)}`;
            } else {
                window.location.href = '/records';
            }
        });
    }
    
    // 加载今日记录
    loadRecords();
    
    // 检查是否有从历史记录页面传递的继续活动信息
    checkContinueActivity();
    
    // 绑定控制按钮事件
    const toggleBtn = document.getElementById('toggleBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', TimeRecorderTimer.toggleTimer);
    }
    
    // 点击表格外区域关闭浮窗
    document.addEventListener('click', function(event) {
        if (event && event.target) {
            const modal = document.getElementById('recordDetailModal');
            if (modal && event.target === modal) {
                TimeRecorderUI.closeRecordDetailModal();
            }
        }
    });
});