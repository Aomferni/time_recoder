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
    setActivityCategories,
    setUseSimpleDetail
} from './modules/config.js';

import { TimeRecorderFrontendUtils } from './modules/utils.js';
import { TimeRecorderAPI } from './modules/api.js';
import { TimeRecorderUI } from './modules/ui.js';
import { TimeRecorderTimer } from './modules/timer.js';
import { TimeRecorderRecordDetail } from './modules/recordDetail.js';

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
window.TimeRecorderRecordDetail = TimeRecorderRecordDetail;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 设置当前日期显示
    const today = new Date();
    const dateString = today.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    document.getElementById('currentDate').textContent = dateString;
    
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
    const setUsernameBtn = document.getElementById('setUsernameBtn');
    if (setUsernameBtn) {
        setUsernameBtn.addEventListener('click', function() {
            TimeRecorderUI.setUsername();
        });
    }
    
    // 修改"查看历史记录"链接
    const historyLink = document.querySelector('a[href="/records"]');
    if (historyLink) {
        historyLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/records';
        });
    }
    
    // 加载今日记录
    TimeRecorderAPI.loadRecords()
        .then(recordsData => {
            setRecords(recordsData);
            // 按开始时间倒序排列
            records.sort((a, b) => {
                if (!a.startTime || !b.startTime) return 0;
                return new Date(b.startTime) - new Date(a.startTime);
            });
            TimeRecorderUI.updateRecordsTable();
            TimeRecorderUI.updateStats();
        })
        .catch(error => {
            console.error('加载记录失败:', error);
        });
    
    // 检查是否有从历史记录页面传递的继续活动信息
    TimeRecorderUI.checkContinueActivity();
    
    // 绑定控制按钮事件
    const toggleBtn = document.getElementById('toggleBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', TimeRecorderTimer.toggleTimer);
        console.log('开始按钮事件监听器已绑定');
    } else {
        console.error('找不到开始按钮元素');
    }
    
    // 点击表格外区域关闭浮窗
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('recordDetailModal');
        if (event.target === modal) {
            TimeRecorderUI.closeRecordDetailModal();
        }
    });
});