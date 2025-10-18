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
import { DailyPlanModule } from './modules/dailyPlan.js';
import { FeishuConfigModule } from './modules/feishuConfig.js';

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
// FeishuConfigModule 已经在自己的模块中暴露到全局作用域

// 查找活动类别函数
function findActivityCategory(activityName) {
    if (Array.isArray(activityCategories)) {
        for (const category of activityCategories) {
            if (Array.isArray(category.activities) && category.activities.includes(activityName)) {
                return category;
            }
        }
    }
    return null;
}

// 更新计时器类别显示函数
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

// 快速记录情绪函数
function recordQuickEmotion(emotion) {
    // 检查是否有正在运行的计时器
    if (!timerInterval || !currentRecordId) {
        alert('请先开始计时再记录情绪');
        return;
    }
    
    // 获取当前记录
    const recordIndex = records.findIndex(r => r && r.id === currentRecordId);
    if (recordIndex === -1) {
        alert('未找到当前活动记录');
        return;
    }
    
    const record = records[recordIndex];
    
    // 更新情绪字段
    let emotions = [];
    if (record.emotion) {
        // 如果已有情绪，拆分为数组
        emotions = record.emotion.split(', ').filter(e => e.trim() !== '');
    }
    
    // 检查情绪是否已存在
    const isExistingEmotion = emotions.includes(emotion);
    
    if (isExistingEmotion) {
        // 如果情绪已存在，则移除它
        emotions = emotions.filter(e => e !== emotion);
    } else {
        // 添加新情绪（避免重复）
        emotions.push(emotion);
    }
    
    // 更新记录
    const updateData = {
        emotion: emotions.join(', ')
    };
    
    // 发送到后端更新
    TimeRecorderAPI.updateRecord(currentRecordId, updateData)
        .then(data => {
            if (data && data.success) {
                // 更新本地记录
                records[recordIndex] = {...records[recordIndex], ...data.record};
                TimeRecorderUI.updateRecordsTable();
                TimeRecorderUI.updateStats();
                
                // 更新快速情绪按钮的选中状态
                updateQuickEmotionButtons(emotions);
                
                // 不再显示提示信息
                // alert(`已记录情绪: ${emotion}`);
            } else {
                alert('记录情绪失败: ' + (data.error || '未知错误'));
            }
        })
        .catch(error => {
            console.error('记录情绪失败:', error);
            alert('记录情绪失败，请查看控制台了解详情');
        });
}

// 更新快速情绪按钮的选中状态
function updateQuickEmotionButtons(selectedEmotions) {
    // 获取所有快速情绪按钮
    const quickEmotionButtons = document.querySelectorAll('.emotion-btn');
    
    quickEmotionButtons.forEach(button => {
        const emotion = button.getAttribute('data-emotion');
        
        // 移除之前可能添加的选中标记
        const existingCheckmark = button.querySelector('.emotion-checkmark');
        if (existingCheckmark) {
            existingCheckmark.remove();
        }
        
        // 移除选中类
        button.classList.remove('selected');
        
        // 如果情绪已选中，添加选中标记和类
        if (selectedEmotions.includes(emotion)) {
            button.classList.add('selected');
            
            const checkmark = document.createElement('span');
            checkmark.className = 'emotion-checkmark';
            checkmark.innerHTML = '✓';
            button.appendChild(checkmark);
        }
    });
}

// 初始化快速情绪按钮状态
function initializeQuickEmotionButtons() {
    // 如果有当前记录且计时器正在运行，初始化按钮状态
    if (currentRecordId && timerInterval) {
        const recordIndex = records.findIndex(r => r && r.id === currentRecordId);
        if (recordIndex !== -1) {
            const record = records[recordIndex];
            let emotions = [];
            if (record.emotion) {
                emotions = record.emotion.split(', ').filter(e => e.trim() !== '');
            }
            updateQuickEmotionButtons(emotions);
        }
    }
}

// 将活动选择弹窗函数暴露到全局作用域
window.showActivitySelectionModal = function() {
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
    
    // 按类别分组添加活动按钮
    if (Array.isArray(activityCategories)) {
        activityCategories.forEach(category => {
            if (Array.isArray(category.activities) && category.activities.length > 0) {
                // 创建类别容器
                const categoryBox = document.createElement('div');
                categoryBox.className = 'activity-category-box';
                
                // 创建类别标题
                const categoryTitle = document.createElement('h3');
                categoryTitle.className = 'activity-category-title';
                categoryTitle.textContent = category.name;
                categoryBox.appendChild(categoryTitle);
                
                // 为每个活动创建按钮并添加到统一容器中
                category.activities.forEach(activity => {
                    const button = document.createElement('button');
                    button.className = `activity-btn ${TimeRecorderFrontendUtils.getActivityCategoryClass(category.name)}`;
                    button.textContent = activity;
                    
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
                    
                    activitiesContainer.appendChild(button);
                });
            }
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
};

window.showFeishuConfig = async function() {
    try {
        // 获取当前飞书配置
        const response = await fetch('/api/feishu/config');
        const feishuData = await response.json();
        
        // 获取应用配置
        const appConfigResponse = await fetch('/api/app-config');
        const appConfigData = await appConfigResponse.json();
        
        if (feishuData.success) {
            // 填充飞书配置信息
            const appIdElement = document.getElementById('feishuAppId');
            const appSecretElement = document.getElementById('feishuAppSecret');
            
            if (appIdElement) {
                appIdElement.value = feishuData.config.app_id || '';
            }
            
            if (appSecretElement) {
                appSecretElement.value = ''; // 不返回secret
            }
            
            // 填充自动同步配置
            if (appConfigData.success) {
                const autoSyncEnabled = appConfigData.config.feishu.auto_sync_enabled || false;
                const autoSyncElement = document.getElementById('feishuAutoSync');
                if (autoSyncElement) {
                    autoSyncElement.checked = autoSyncEnabled;
                }
            }
            
            // 显示模态框
            const modal = document.getElementById('feishuConfigModal');
            if (modal) {
                modal.style.display = 'block';
            }
        } else {
            throw new Error(feishuData.error || '获取飞书配置失败');
        }
    } catch (error) {
        console.error('获取飞书配置失败:', error);
        alert('获取飞书配置失败: ' + error.message);
    }
};

window.closeFeishuConfig = function() {
    const modal = document.getElementById('feishuConfigModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.saveFeishuConfig = async function() {
    try {
        const appIdElement = document.getElementById('feishuAppId');
        const appSecretElement = document.getElementById('feishuAppSecret');
        const autoSyncElement = document.getElementById('feishuAutoSync');
        
        // 检查元素是否存在
        if (!appIdElement) {
            throw new Error('找不到App ID输入元素');
        }
        
        const appId = appIdElement.value.trim();
        const appSecret = appSecretElement ? appSecretElement.value.trim() : '';
        const autoSyncEnabled = autoSyncElement ? autoSyncElement.checked : false;
        
        // 验证输入
        if (!appId) {
            alert('请输入App ID');
            return;
        }
        
        // 如果用户没有输入新的App Secret，则不更新
        const updateData = {
            app_id: appId
        };
        
        // 只有当用户输入了新的App Secret时才更新
        if (appSecret) {
            updateData.app_secret = appSecret;
        }
        
        // 发送飞书配置更新请求
        const feishuResponse = await fetch('/api/feishu/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        const feishuData = await feishuResponse.json();
        
        if (!feishuData.success) {
            throw new Error(feishuData.error || '保存飞书配置失败');
        }
        
        // 发送应用配置更新请求
        const appConfigResponse = await fetch('/api/app-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                feishu: {
                    auto_sync_enabled: autoSyncEnabled
                }
            })
        });
        
        const appConfigData = await appConfigResponse.json();
        
        if (appConfigData.success) {
            alert('飞书配置保存成功');
            window.closeFeishuConfig();
        } else {
            throw new Error(appConfigData.error || '保存应用配置失败');
        }
    } catch (error) {
        console.error('保存飞书配置失败:', error);
        alert('保存飞书配置失败: ' + error.message);
    }
};

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
            
            // 刷新今日计划的统计数据
            if (window.DailyPlanModule && DailyPlanModule.refreshStats) {
                DailyPlanModule.refreshStats();
            }
        })
        .catch(error => {
            console.error('加载记录失败:', error);
        });
    
    // 检查是否有从历史记录页面传递的继续活动信息
    TimeRecorderUI.checkContinueActivity();
    
    // 检查是否有保存的计时器状态
    if (TimeRecorderTimer && typeof TimeRecorderTimer.restoreTimerState === 'function') {
        TimeRecorderTimer.restoreTimerState();
    }
    
    // 绑定控制按钮事件
    const toggleBtn = document.getElementById('toggleBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', TimeRecorderTimer.toggleTimer);
        console.log('开始按钮事件监听器已绑定');
    } else {
        console.error('找不到开始按钮元素');
    }
    
    // 添加计时器区域点击事件监听器
    const focusTimerSection = document.getElementById('focusTimerSection');
    if (focusTimerSection) {
        focusTimerSection.addEventListener('click', function(e) {
            // 防止事件冒泡
            e.stopPropagation();
            TimeRecorderTimer.toggleTimer();
        });
        console.log('计时器区域事件监听器已绑定');
    } else {
        console.error('找不到计时器区域元素');
    }
    
    // 添加快速情绪按钮点击事件监听器
    const quickEmotionButtons = document.querySelectorAll('.emotion-btn');
    quickEmotionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const emotion = this.getAttribute('data-emotion');
            recordQuickEmotion(emotion);
        });
    });
    
    // 初始化快速情绪按钮状态
    initializeQuickEmotionButtons();
    
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
                if (window.showActivitySelectionModal) {
                    window.showActivitySelectionModal();
                }
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
                
                // 如果是手动输入的活动名称，尝试匹配活动类别
                const category = findActivityCategory(newActivityName);
                if (category) {
                    this.setAttribute('data-category', category.name);
                    
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
                }
            }
        });
        
        // 按Enter键时保存修改
        currentActivityElement.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur(); // 触发blur事件保存修改
            }
        });
        console.log('当前活动区域事件监听器已绑定');
    } else {
        console.error('找不到当前活动区域元素');
    }
    
    // 点击表格外区域关闭浮窗
    document.addEventListener('click', function(event) {
        const recordModal = document.getElementById('recordDetailModal');
        if (event.target === recordModal) {
            TimeRecorderUI.closeRecordDetailModal();
        }
        
        // 点击飞书配置模态框外区域关闭
        const feishuModal = document.getElementById('feishuConfigModal');
        if (event.target === feishuModal) {
            window.closeFeishuConfig();
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
                                
                                // 刷新今日计划的统计数据
                                if (window.DailyPlanModule && DailyPlanModule.refreshStats) {
                                    DailyPlanModule.refreshStats();
                                }
                            })
                            .catch(error => {
                                console.error('重新加载记录失败:', error);
                            });
                        
                        // 重新加载活动类别配置
                        TimeRecorderAPI.loadActivityCategories()
                            .then(categories => {
                                setActivityCategories(categories);
                                // 更新活动按钮显示
                                TimeRecorderUI.updateActivityButtons();
                            })
                            .catch(error => {
                                console.error('重新加载活动类别配置失败:', error);
                            });
                    }
                } catch (error) {
                    console.error('解析刷新信号失败:', error);
                }
            }
        }
    });
    
    // 监听页面可见性变化，当页面重新可见时检查计时器状态
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            // 页面重新可见时，检查是否有保存的计时器状态需要恢复
            if (TimeRecorderTimer && typeof TimeRecorderTimer.restoreTimerState === 'function') {
                TimeRecorderTimer.restoreTimerState();
            }
        }
    });
});