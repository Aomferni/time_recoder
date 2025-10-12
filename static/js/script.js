// 导入所有模块
import { 
    currentActivity, 
    startTime, 
    elapsedTime, 
    timerInterval, 
    isPaused, 
    currentRecordId, 
    records, 
    expandedRecordId, 
    currentDetailRecordId, 
    currentUsername, 
    activityCategories, 
    useSimpleDetail,
    activityCategoryClassMap,
    colorClassMap,
    emotionOptions,
    setCurrentActivity,
    setStartTime,
    setElapsedTime,
    setTimerInterval,
    setIsPaused,
    setCurrentRecordId,
    setRecords,
    setExpandedRecordId,
    setCurrentDetailRecordId,
    setCurrentUsername,
    setActivityCategories,
    setUseSimpleDetail
} from './modules/config.js';

import { TimeRecorderFrontendUtils } from './modules/utils.js';
import { TimeRecorderAPI } from './modules/api.js';
import { TimeRecorderUI } from './modules/ui.js';
import { TimeRecorderTimer } from './modules/timer.js';

// 将配置暴露到全局作用域，以便其他模块可以访问
window.TimeRecorderConfig = {
    currentActivity,
    startTime,
    elapsedTime,
    timerInterval,
    isPaused,
    currentRecordId,
    records,
    expandedRecordId,
    currentDetailRecordId,
    currentUsername,
    activityCategories,
    useSimpleDetail,
    activityCategoryClassMap,
    colorClassMap,
    emotionOptions
};

// 将模块暴露到全局作用域，以便HTML可以直接调用
window.TimeRecorderFrontendUtils = TimeRecorderFrontendUtils;
window.TimeRecorderAPI = TimeRecorderAPI;
window.TimeRecorderUI = TimeRecorderUI;
window.TimeRecorderTimer = TimeRecorderTimer;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 设置当前日期显示
    const today = new Date();
    const dateString = today.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    document.getElementById('currentDate').textContent = dateString;
    
    // 初始化用户名
    const savedUsername = localStorage.getItem('timeRecorderUsername');
    if (savedUsername) {
        setCurrentUsername(savedUsername);
        document.getElementById('usernameInput').value = savedUsername;
    }
    
    // 根据用户名状态设置活动按钮的可用性
    TimeRecorderUI.updateActivityButtonsState();
    
    // 加载活动类别配置
    TimeRecorderAPI.loadActivityCategories()
        .then(categories => {
            setActivityCategories(categories);
            // 更新活动按钮显示
            TimeRecorderUI.updateActivityButtons();
        })
        .catch(error => {
            console.error('加载活动类别配置失败:', error);
        });
    
    // 绑定设置用户名按钮事件
    document.getElementById('setUsernameBtn').addEventListener('click', function() {
        TimeRecorderUI.setUsername();
        // 用户名设置后更新活动按钮状态
        setTimeout(TimeRecorderUI.updateActivityButtonsState, 100);
    });
    
    // 修改"查看历史记录"链接，添加用户名参数
    const historyLink = document.querySelector('a[href="/records"]');
    if (historyLink) {
        historyLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (window.TimeRecorderConfig.currentUsername && window.TimeRecorderConfig.currentUsername !== 'default') {
                window.location.href = `/records?username=${encodeURIComponent(window.TimeRecorderConfig.currentUsername)}`;
            } else {
                window.location.href = '/records';
            }
        });
    }
    
    // 加载今日记录
    TimeRecorderAPI.loadRecords()
        .then(recordsData => {
            setRecords(recordsData);
            // 按开始时间倒序排列
            records.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
            TimeRecorderUI.updateRecordsTable();
            TimeRecorderUI.updateStats();
        })
        .catch(error => {
            console.error('加载记录失败:', error);
        });
    
    // 检查是否有从历史记录页面传递的继续活动信息
    TimeRecorderUI.checkContinueActivity();
    
    // 绑定控制按钮事件
    document.getElementById('toggleBtn').addEventListener('click', TimeRecorderTimer.toggleTimer);
    
    // 点击表格外区域关闭浮窗
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('recordDetailModal');
        if (event.target === modal) {
            TimeRecorderUI.closeRecordDetailModal();
        }
    });
});