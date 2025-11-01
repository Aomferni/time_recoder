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
import { DailyPlanModule } from './dailyPlan.js';

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
                    currentActivityElement.textContent = data.activity;
                    currentActivityElement.contentEditable = "true";
                }
            }
            
            // 如果有记录ID，保存它
            if (data.recordId) {
                setCurrentRecordId(data.recordId);
                // 初始化快速情绪按钮状态
                if (window.initializeQuickEmotionButtons) {
                    window.initializeQuickEmotionButtons();
                }
            }
            
            // 如果有情绪信息，初始化快速情绪按钮状态
            if (data.emotion) {
                // 直接更新快速情绪按钮状态
                const emotions = data.emotion.split(', ').filter(e => e.trim() !== '');
                if (window.updateQuickEmotionButtons) {
                    window.updateQuickEmotionButtons(emotions);
                }
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
            
            // 刷新今日计划的统计数据
            if (window.DailyPlanModule && DailyPlanModule.refreshStats) {
                DailyPlanModule.refreshStats();
            }
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
    
    // 添加计时器区域点击事件监听器
    const focusTimerSection = document.getElementById('focusTimerSection');
    if (focusTimerSection) {
        focusTimerSection.addEventListener('click', function(e) {
            // 防止事件冒泡
            e.stopPropagation();
            TimeRecorderTimer.toggleTimer();
        });
    }
    
    // 添加当前活动区域点击事件监听器
    const currentActivityElement = document.getElementById('currentActivity');
    if (currentActivityElement) {
        // 单击事件 - 弹窗选择活动
        let clickTimeout;
        currentActivityElement.addEventListener('click', function() {
            // 清除已存在的双击检测
            clearTimeout(clickTimeout);
            
            // 如果计时器正在运行，不允许修改活动
            if (timerInterval) {
                return;
            }
            
            // 延迟执行单击操作，以便区分单击和双击
            clickTimeout = setTimeout(() => {
                // 显示活动选择弹窗
                showActivitySelectionModal();
            }, 300);
        });
        
        // 双击事件 - 直接修改活动名称
        currentActivityElement.addEventListener('dblclick', function(e) {
            // 阻止双击事件冒泡
            e.stopPropagation();
            
            // 清除单击事件
            clearTimeout(clickTimeout);
            
            // 如果计时器正在运行，不允许修改活动
            if (timerInterval) {
                return;
            }
            
            // 启用编辑模式
            this.contentEditable = "true";
            this.classList.add('editing');
            this.focus();
            
            // 选中所有文本以便编辑
            const range = document.createRange();
            range.selectNodeContents(this);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        });
        
        // 失去焦点时保存修改
        currentActivityElement.addEventListener('blur', function() {
            // 禁用编辑模式
            this.contentEditable = "false";
            this.classList.remove('editing');
            
            // 保存修改后的活动名称
            const newActivityName = this.textContent.trim();
            if (newActivityName && newActivityName !== '请选择活动') {
                setCurrentActivity(newActivityName);
            }
        });
        
        // 按Enter键时保存修改
        currentActivityElement.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur(); // 触发blur事件保存修改
            }
        });
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
    
    // 初始化今日计划模块
    console.log('开始初始化今日计划模块...');
    if (DailyPlanModule && DailyPlanModule.init) {
        DailyPlanModule.init();
    }
    
    // 监听其他页面的刷新信号
    window.addEventListener('storage', function(e) {
        if (e.key === 'timeRecorderRefreshSignal') {
            // 当检测到刷新信号时，重新加载数据
            if (e.newValue) {
                try {
                    const signal = JSON.parse(e.newValue);
                    // 检查信号是否来自其他页面（避免自己刷新自己）
                    if (signal.sourcePage !== window.location.pathname) {
                        console.log('检测到其他页面的刷新信号，正在刷新当前页面数据...');
                        
                        // 重新加载记录
                        loadRecords();
                        
                        // 重新加载活动类别配置
                        loadActivityCategories();
                        
                        // 刷新今日计划模块
                        if (DailyPlanModule && typeof DailyPlanModule.refreshStats === 'function') {
                            DailyPlanModule.refreshStats();
                        }
                    }
                } catch (error) {
                    console.error('解析刷新信号失败:', error);
                }
            }
        }
    });
});

/**
 * 更新计时器类别显示函数
 */
function updateTimerCategoryDisplay(categoryName) {
    const focusTimerSection = document.getElementById('focusTimerSection');
    if (focusTimerSection) {
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
        categoryElement.textContent = categoryName;
    }
}

/**
 * 显示活动选择弹窗
 */
function showActivitySelectionModal() {
    // 如果已存在模态框，先移除
    const existingModal = document.getElementById('activitySelectionModal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'activitySelectionModal';
    modal.style.display = 'block';
    
    // 创建模态框内容
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // 创建关闭按钮
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = function() {
        document.body.removeChild(modal);
    };
    
    // 创建标题
    const title = document.createElement('h2');
    title.textContent = '选择活动';
    title.style.textAlign = 'center';
    title.style.marginBottom = '20px';
    title.style.color = '#333';
    title.style.fontSize = '24px';
    title.style.fontWeight = '600';
    
    // 创建活动按钮容器
    const activitiesContainer = document.createElement('div');
    activitiesContainer.className = 'activities-selection-container';
    
    // 按类别分组添加活动按钮，按列排列
    if (Array.isArray(activityCategories)) {
        // 首先收集所有类别和活动信息
        const categoryMap = {};
        const allCategories = [];
        
        activityCategories.forEach(category => {
            if (Array.isArray(category.activities) && category.activities.length > 0) {
                if (!categoryMap[category.name]) {
                    categoryMap[category.name] = {
                        name: category.name,
                        activities: []
                    };
                    allCategories.push(category.name);
                }
                categoryMap[category.name].activities.push(...category.activities);
            }
        });
        
        // 创建列容器
        const columnContainers = [];
        
        // 为每个类别创建列
        allCategories.forEach((categoryName, categoryIndex) => {
            const category = categoryMap[categoryName];
            
            // 为每个类别创建列容器
            const columnContainer = document.createElement('div');
            columnContainer.className = 'activity-category-column';
            
            // 创建类别标题
            const categoryTitle = document.createElement('div');
            categoryTitle.className = 'activity-category-title';
            categoryTitle.textContent = category.name;
            categoryTitle.style.marginBottom = '10px';
            categoryTitle.style.textAlign = 'center';
            columnContainer.appendChild(categoryTitle);
            
            // 为该类别下的每个活动创建按钮
            category.activities.forEach(activity => {
                const button = document.createElement('button');
                button.className = `activity-btn ${TimeRecorderFrontendUtils.getActivityCategoryClass(category.name)}`;
                button.textContent = activity;
                button.style.marginBottom = '8px';
                
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
                
                columnContainer.appendChild(button);
            });
            
            columnContainers.push(columnContainer);
        });
        
        // 将所有列容器添加到活动容器中
        columnContainers.forEach(column => {
            activitiesContainer.appendChild(column);
        });
    }
    
    // 组装模态框
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(title);
    modalContent.appendChild(activitiesContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // 点击模态框外部关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}
