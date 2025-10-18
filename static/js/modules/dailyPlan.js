/**
 * 今日计划模块
 */

import { TimeRecorderAPI } from './api.js';
import { TimeRecorderFrontendUtils } from './utils.js';

export const DailyPlanModule = {
    currentPlan: null,
    currentPlanDate: null, // 当前显示的计划日期
    autoSaveTimer: null,
    autoSaveInterval: 3600000, // 1小时自动保存一次（原为30秒）
    
    /**
     * 初始化今日计划模块
     */
    init: function() {
        console.log('初始化今日计划模块');
        this.loadTodayPlan();
        this.bindEvents();
        this.startAutoSave();
        // 默认显示为折叠状态
        this.setCollapsedState(true);
        // 初始化日期选择器
        this.initDatePicker();
    },
    
    /**
     * 加载今日计划（使用北京时间）
     */
    loadTodayPlan: function() {
        // 获取当前北京时间
        const now = new Date();
        const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 转换为北京时间
        const today = beijingTime.toISOString().split('T')[0];
        this.loadDailyPlan(today);
    },
    
    /**
     * 加载指定日期的计划
     * @param {string} date - 日期字符串 (YYYY-MM-DD)
     */
    loadDailyPlan: function(date) {
        this.currentPlanDate = date;
        
        TimeRecorderAPI.loadDailyPlan(date)
            .then(plan => {
                console.log('[调试] 加载指定日期计划:', plan);
                this.currentPlan = plan;
                this.renderPlan(plan);
                // 更新日期显示
                this.updateDateDisplay(date);
            })
            .catch(error => {
                console.error('加载指定日期计划失败:', error);
                alert('加载计划失败，请刷新页面重试');
            });
    },
    
    /**
     * 渲染计划到页面
     */
    renderPlan: function(plan) {
        // 更新日期显示（使用北京时间格式）
        const dateElement = document.querySelector('.daily-plan-date');
        if (dateElement) {
            const dateObj = new Date(plan.date);
            const year = dateObj.getFullYear();
            const month = dateObj.getMonth() + 1;
            const day = dateObj.getDate();
            dateElement.textContent = `${year}年${month}月${day}日`;
        }
        
        // 填充重要的三件事
        if (Array.isArray(plan.importantThings)) {
            plan.importantThings.forEach((thing, index) => {
                const input = document.getElementById(`important-${index + 1}`);
                if (input) {
                    input.value = thing;
                }
            });
        }
        
        // 填充要尝试的三件事
        if (Array.isArray(plan.tryThings)) {
            plan.tryThings.forEach((thing, index) => {
                const input = document.getElementById(`try-${index + 1}`);
                if (input) {
                    input.value = thing;
                }
            });
        }
        
        // 填充其他事项
        const otherMattersInput = document.getElementById('other-matters');
        if (otherMattersInput) {
            otherMattersInput.value = plan.otherMatters || '';
        }
        
        // 填充阅读
        const readingInput = document.getElementById('reading');
        if (readingInput) {
            readingInput.value = plan.reading || '';
        }
        
        // 设置评分
        this.setScore(plan.score);
        
        // 填充评分原因
        const scoreReasonInput = document.getElementById('score-reason');
        if (scoreReasonInput) {
            scoreReasonInput.value = plan.scoreReason || '';
        }
        
        // 渲染统计数据
        this.renderStats(plan);
        
        // 渲染活动列表
        this.renderActivities(plan.activities);
        
        // 渲染情绪
        this.renderEmotions(plan.emotions);
        
        // 更新同步状态
        this.updateSyncStatus(plan);
        
        // 更新简要视图（默认折叠状态）
        this.updateSummaryView();
    },
    
    /**
     * 渲染统计数据
     */
    renderStats: function(plan) {
        console.log('[调试] 今日计划统计数据:', plan);
        
        // 总专注时长
        const totalDurationElement = document.getElementById('plan-total-duration');
        if (totalDurationElement) {
            totalDurationElement.textContent = TimeRecorderFrontendUtils.formatDuration(plan.totalDuration);
            console.log(`[调试] 总专注时长: ${plan.totalDuration}ms (${TimeRecorderFrontendUtils.formatDuration(plan.totalDuration)})`);
        }
        
        // 创作时长
        const creationDurationElement = document.getElementById('plan-creation-duration');
        if (creationDurationElement) {
            creationDurationElement.textContent = TimeRecorderFrontendUtils.formatDuration(plan.creationDuration);
            console.log(`[调试] 创作时长: ${plan.creationDuration}ms (${TimeRecorderFrontendUtils.formatDuration(plan.creationDuration)})`);
        }
        
        // 活动次数
        const activityCountElement = document.getElementById('plan-activity-count');
        if (activityCountElement) {
            activityCountElement.textContent = plan.activities.length;
            console.log(`[调试] 活动次数: ${plan.activities.length}`);
        }
    },
    
    /**
     * 渲染活动列表
     */
    renderActivities: function(activities) {
        const container = document.getElementById('plan-activities-list');
        if (!container) return;
        
        console.log('[调试] 今日活动列表:', activities);
        
        if (!activities || activities.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:20px; opacity:0.7;">暂无活动记录</div>';
            return;
        }
        
        const html = activities.map(activity => {
            const accurateDuration = TimeRecorderFrontendUtils.calculateSegmentsTotalTime(activity.segments) || activity.duration;
            console.log(`[调试] 活动: ${activity.activity}, 记录duration: ${activity.duration}ms, 准确时长: ${accurateDuration}ms`);
            return `
            <div class="plan-activity-item">
                <span class="activity-name">${activity.activity} <span style="opacity:0.7; font-size:11px;">(${activity.category})</span></span>
                <span class="activity-duration">${TimeRecorderFrontendUtils.formatDuration(accurateDuration)}</span>
            </div>
        `}).join('');
        
        container.innerHTML = html;
    },
    
    /**
     * 渲染情绪
     */
    renderEmotions: function(emotions) {
        const container = document.getElementById('plan-emotions-grid');
        if (!container) return;
        
        if (!emotions || emotions.length === 0) {
            container.innerHTML = '<div style="opacity:0.7;">暂无情绪记录</div>';
            return;
        }
        
        // 获取情绪颜色
        const getEmotionColor = (emotion) => {
            const emotionColors = {
                '惊奇': '#9C27B0', '兴奋': '#E91E63', '高兴': '#4CAF50', '愉悦': '#8BC34A',
                '安逸': '#00BCD4', '安心': '#2196F3', '满足': '#8BC34A', '宁静': '#009688', '放松': '#CDDC39',
                '悲伤': '#607D8B', '伤心': '#9E9E9E', '沮丧': '#F44336', '疲惫': '#795548',
                '惊恐': '#FF5722', '紧张': '#FF9800', '愤怒': '#F44336', '苦恼': '#FFC107'
            };
            return emotionColors[emotion] || '#999';
        };
        
        const html = emotions.map(emotion => `
            <span class="emotion-badge" style="background-color: ${getEmotionColor(emotion)};">
                ${emotion}
            </span>
        `).join('');
        
        container.innerHTML = html;
    },
    
    /**
     * 设置评分
     */
    setScore: function(score) {
        // 清除所有选中状态
        document.querySelectorAll('.score-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // 设置选中状态
        if (score) {
            const selectedOption = document.querySelector(`.score-option[data-score="${score}"]`);
            if (selectedOption) {
                selectedOption.classList.add('selected');
            }
        }
    },
    
    /**
     * 更新同步状态
     */
    updateSyncStatus: function(plan) {
        const statusElement = document.getElementById('sync-status');
        if (!statusElement) return;
        
        if (plan.syncedToFeishu && plan.lastFeishuSyncAt) {
            const syncTime = new Date(plan.lastFeishuSyncAt);
            const timeStr = TimeRecorderFrontendUtils.formatTime(syncTime);
            statusElement.innerHTML = `<span class="synced">✓ 已同步到飞书 (${timeStr})</span>`;
            statusElement.className = 'sync-status synced';
        } else {
            statusElement.innerHTML = '<span class="not-synced">✗ 未同步到飞书</span>';
            statusElement.className = 'sync-status not-synced';
        }
    },
    
    /**
     * 更新简要视图
     */
    updateSummaryView: function() {
        if (!this.currentPlan) return;
        
        // 更新重要的三件事
        const summaryImportantList = document.getElementById('summary-important-things');
        if (summaryImportantList) {
            const importantThings = this.currentPlan.importantThings || ['', '', ''];
            const filledImportant = importantThings.filter(thing => thing && thing.trim() !== '');
            
            if (filledImportant.length === 0) {
                summaryImportantList.innerHTML = '<li class="summary-item-empty">还未填写</li>';
            } else {
                const html = filledImportant.map(thing => 
                    `<li>${thing}</li>`
                ).join('');
                summaryImportantList.innerHTML = html;
            }
        }
        
        // 更新要尝试的三件事
        const summaryTryList = document.getElementById('summary-try-things');
        if (summaryTryList) {
            const tryThings = this.currentPlan.tryThings || ['', '', ''];
            const filledTry = tryThings.filter(thing => thing && thing.trim() !== '');
            
            if (filledTry.length === 0) {
                summaryTryList.innerHTML = '<li class="summary-item-empty">还未填写</li>';
            } else {
                const html = filledTry.map(thing => 
                    `<li>${thing}</li>`
                ).join('');
                summaryTryList.innerHTML = html;
            }
        }
        
        // 更新情绪集合
        const summaryEmotions = document.getElementById('summary-emotions');
        if (summaryEmotions) {
            const emotions = this.currentPlan.emotions || [];
            
            if (emotions.length === 0) {
                summaryEmotions.innerHTML = '<span class="summary-item-empty">还未记录</span>';
            } else {
                // 获取情绪颜色
                const getEmotionColor = (emotion) => {
                    const emotionColors = {
                        '惊奇': '#9C27B0', '兴奋': '#E91E63', '高兴': '#4CAF50', '愉悦': '#8BC34A',
                        '安逸': '#00BCD4', '安心': '#2196F3', '满足': '#8BC34A', '宁静': '#009688', '放松': '#CDDC39',
                        '悲伤': '#607D8B', '伤心': '#9E9E9E', '沮丧': '#F44336', '疲惫': '#795548',
                        '惊恐': '#FF5722', '紧张': '#FF9800', '愤怒': '#F44336', '苦恼': '#FFC107'
                    };
                    return emotionColors[emotion] || '#999';
                };
                
                const html = emotions.map(emotion => `
                    <span class="emotion-badge" style="background-color: ${getEmotionColor(emotion)};">
                        ${emotion}
                    </span>
                `).join('');
                summaryEmotions.innerHTML = html;
            }
        }
        
        // 更新活动类型集合
        const summaryCategories = document.getElementById('summary-categories');
        if (summaryCategories) {
            const activityCategories = this.currentPlan.activityCategories || [];
            
            if (activityCategories.length === 0) {
                summaryCategories.innerHTML = '<span class="summary-item-empty">还未记录</span>';
            } else {
                // 获取活动类别颜色
                const getCategoryColor = (category) => {
                    const categoryColors = {
                        '工作输出': '#3498db',
                        '大脑充电': '#2ecc71',
                        '身体充电': '#27ae60',
                        '修养生息': '#9b59b6',
                        '输出创作': '#e67e22',
                        '暂停一下': '#1abc9c',
                        '纯属娱乐': '#95a5a6'
                    };
                    return categoryColors[category] || '#999';
                };
                
                const html = activityCategories.map(category => `
                    <span class="category-badge" style="background-color: ${getCategoryColor(category)}; border-color: ${getCategoryColor(category)};">
                        ${category}
                    </span>
                `).join('');
                summaryCategories.innerHTML = html;
            }
        }
        
        // 更新全宽统计数据
        this.updateFullWidthStats();
    },
    
    /**
     * 更新全宽统计数据
     */
    updateFullWidthStats: function() {
        if (!this.currentPlan) return;
        
        // 更新统计数据
        const summaryTotalDuration = document.getElementById('summary-total-duration');
        if (summaryTotalDuration) {
            const totalDuration = this.currentPlan.totalDuration || 0;
            const totalMinutes = Math.floor(totalDuration / 60000);
            const totalHours = Math.floor(totalMinutes / 60);
            const remainingMinutes = totalMinutes % 60;
            summaryTotalDuration.textContent = totalHours > 0 ? 
                `${totalHours}小时${remainingMinutes}分` : 
                `${remainingMinutes}分钟`;
        }
        
        const summaryCreationDuration = document.getElementById('summary-creation-duration');
        if (summaryCreationDuration) {
            const creationDuration = this.currentPlan.creationDuration || 0;
            const creationMinutes = Math.floor(creationDuration / 60000);
            const creationHours = Math.floor(creationMinutes / 60);
            const remainingMinutes = creationMinutes % 60;
            summaryCreationDuration.textContent = creationHours > 0 ? 
                `${creationHours}小时${remainingMinutes}分` : 
                `${remainingMinutes}分钟`;
        }
        
        const summaryActivityCount = document.getElementById('summary-activity-count');
        if (summaryActivityCount) {
            const activities = this.currentPlan.activities || [];
            summaryActivityCount.textContent = `${activities.length}次`;
        }
    },
    
    /**
     * 初始化日期选择器
     */
    initDatePicker: function() {
        // 在计划标题旁边添加日期选择器
        const titleElement = document.querySelector('.daily-plan-title');
        if (titleElement) {
            // 创建日期选择器容器
            const datePickerContainer = document.createElement('div');
            datePickerContainer.className = 'daily-plan-date-picker';
            datePickerContainer.innerHTML = `
                <button id="prev-day" class="date-nav-btn">&lt;</button>
                <input type="date" id="plan-date-selector" class="date-selector" value="${this.currentPlanDate || new Date().toISOString().split('T')[0]}">
                <button id="next-day" class="date-nav-btn">&gt;</button>
            `;
            
            // 插入到标题元素中
            titleElement.appendChild(datePickerContainer);
            
            // 绑定日期选择事件
            const dateSelector = document.getElementById('plan-date-selector');
            if (dateSelector) {
                dateSelector.addEventListener('change', (e) => {
                    this.loadDailyPlan(e.target.value);
                });
            }
            
            // 绑定前一天按钮事件
            const prevDayBtn = document.getElementById('prev-day');
            if (prevDayBtn) {
                prevDayBtn.addEventListener('click', () => {
                    this.navigateToDate(-1);
                });
            }
            
            // 绑定后一天按钮事件
            const nextDayBtn = document.getElementById('next-day');
            if (nextDayBtn) {
                nextDayBtn.addEventListener('click', () => {
                    this.navigateToDate(1);
                });
            }
        }
    },
    
    /**
     * 更新日期显示（使用北京时间格式）
     * @param {string} date - 日期字符串 (YYYY-MM-DD)
     */
    updateDateDisplay: function(date) {
        // 更新日期选择器的值
        const dateSelector = document.getElementById('plan-date-selector');
        if (dateSelector) {
            dateSelector.value = date;
        }
        
        // 更新原有的日期显示文本
        const dateElement = document.querySelector('.daily-plan-date');
        if (dateElement) {
            const dateObj = new Date(date);
            const year = dateObj.getFullYear();
            const month = dateObj.getMonth() + 1;
            const day = dateObj.getDate();
            dateElement.textContent = `${year}年${month}月${day}日`;
        }
    },
    
    /**
     * 导航到指定偏移量的日期
     * @param {number} offset - 日期偏移量（-1表示前一天，1表示后一天）
     */
    navigateToDate: function(offset) {
        if (!this.currentPlanDate) return;
        
        const currentDate = new Date(this.currentPlanDate);
        currentDate.setDate(currentDate.getDate() + offset);
        const newDate = currentDate.toISOString().split('T')[0];
        this.loadDailyPlan(newDate);
    },
    
    /**
     * 绑定事件
     */
    bindEvents: function() {
        // 折叠/展开按钮
        const toggleBtn = document.getElementById('plan-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const content = document.querySelector('.daily-plan-content');
                const summary = document.getElementById('daily-plan-summary');
                
                if (content && summary) {
                    const isHidden = content.style.display === 'none';
                    // 如果是收起操作（当前是展开状态），先保存并同步到飞书
                    if (!isHidden) {
                        console.log('收起计划，自动保存并同步到飞书...');
                        this.savePlan();
                        // 检查并同步到飞书
                        this.checkAndSyncToFeishu();
                    }
                    this.setCollapsedState(!isHidden);
                }
            });
        }
        
        // 评分选项
        document.querySelectorAll('.score-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const score = e.target.dataset.score;
                this.setScore(score);
            });
        });
        
        // 输入框失焦保存
        const inputs = document.querySelectorAll('.plan-input, .plan-textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                // 如果是重要事项或尝试事项输入框，更新简要视图
                if (input.id && (input.id.startsWith('important-') || input.id.startsWith('try-'))) {
                    this.updateSummaryView();
                }
            });
        });
        
        // 注释掉同步到飞书按钮的事件监听器，因为按钮已被移除
        // const syncBtn = document.getElementById('sync-feishu-btn');
        // if (syncBtn) {
        //     syncBtn.addEventListener('click', () => {
        //         this.syncToFeishu();
        //     });
        // }
    },
    
    /**
     * 收集表单数据
     */
    collectFormData: function() {
        if (!this.currentPlan) return null;
        
        const plan = { ...this.currentPlan };
        
        // 确保计划日期是当前选择的日期
        if (this.currentPlanDate) {
            plan.date = this.currentPlanDate;
        }
        
        // 重要的三件事
        plan.importantThings = [
            document.getElementById('important-1')?.value || '',
            document.getElementById('important-2')?.value || '',
            document.getElementById('important-3')?.value || ''
        ];
        
        // 要尝试的三件事
        plan.tryThings = [
            document.getElementById('try-1')?.value || '',
            document.getElementById('try-2')?.value || '',
            document.getElementById('try-3')?.value || ''
        ];
        
        // 其他事项
        plan.otherMatters = document.getElementById('other-matters')?.value || '';
        
        // 阅读
        plan.reading = document.getElementById('reading')?.value || '';
        
        // 评分
        const selectedScore = document.querySelector('.score-option.selected');
        plan.score = selectedScore?.dataset.score || '';
        
        // 评分原因
        plan.scoreReason = document.getElementById('score-reason')?.value || '';
        
        return plan;
    },
    
    /**
     * 保存计划
     */
    savePlan: function(showMessage = false) {
        const plan = this.collectFormData();
        if (!plan) return;
        
        TimeRecorderAPI.saveDailyPlan(plan)
            .then(result => {
                if (result.success) {
                    this.currentPlan = result.plan;
                    // 更新简要视图
                    this.updateSummaryView();
                    if (showMessage) {
                        alert('保存成功!');
                    }
                    console.log('今日计划已自动保存');
                    
                    // 检查是否配置了飞书，如果已配置则自动同步
                    this.checkAndSyncToFeishu();
                }
            })
            .catch(error => {
                console.error('保存今日计划失败:', error);
                if (showMessage) {
                    alert('保存失败，请重试');
                }
            });
    },
    
    /**
     * 检查飞书配置并同步
     */
    checkAndSyncToFeishu: function() {
        // 检查是否配置了飞书（通过检查配置文件是否存在且有app_id）
        fetch('/api/feishu/config')
            .then(response => response.json())
            .then(data => {
                if (data && data.config && data.config.app_id) {
                    // 如果已配置飞书，则执行同步
                    this.syncToFeishuSilently();
                }
            })
            .catch(error => {
                // 配置不存在或无法获取，不执行同步
                console.log('飞书未配置，跳过同步');
            });
    },
    
    /**
     * 静默同步到飞书（无用户提示）
     */
    syncToFeishuSilently: function() {
        // 使用当前编辑的日期而不是强制切换到当前日期
        const currentDate = this.currentPlanDate || new Date().toISOString().split('T')[0];
        
        // 延迟一下确保保存完成
        setTimeout(() => {
            // 先同步今日计划到飞书
            TimeRecorderAPI.syncDailyPlanToFeishu(currentDate)
                .then(result => {
                    console.log('飞书同步API返回:', result);
                    if (result.success) {
                        console.log('同步今日计划到飞书成功!');
                        // 重新加载当前编辑的计划以更新同步状态
                        this.loadDailyPlan(currentDate);
                        
                        // 然后同步计时记录到飞书
                        this.syncRecordsToFeishu();
                    } else {
                        console.error('同步失败 - 返回结果:', result);
                    }
                })
                .catch(error => {
                    console.error('同步今日计划到飞书失败 - 详细错误:', error);
                    console.error('错误类型:', error.name);
                    console.error('错误消息:', error.message);
                    console.error('错误堆栈:', error.stack);
                });
        }, 500);
    },
    
    /**
     * 同步计时记录到飞书
     */
    syncRecordsToFeishu: function() {
        // 获取今天的记录并同步到飞书
        TimeRecorderAPI.loadRecords()
            .then(records => {
                // 如果有记录，则导出到飞书
                if (records && records.length > 0) {
                    // 发送到飞书多维表格
                    return fetch('/api/feishu/import-records', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ records: records })
                    });
                }
            })
            .then(response => {
                if (response) {
                    return response.json();
                }
            })
            .then(data => {
                if (data && data.success) {
                    console.log('计时记录同步到飞书成功!');
                } else if (data) {
                    console.error('计时记录同步到飞书失败:', data.error);
                }
            })
            .catch(error => {
                console.error('同步计时记录到飞书失败:', error);
            });
    },
    
    /**
     * 同步到飞书（带用户提示）
     */
    syncToFeishu: function() {
        // 使用当前编辑的日期而不是强制切换到当前日期
        const currentDate = this.currentPlanDate || new Date().toISOString().split('T')[0];
        
        // 先保存当前数据
        this.savePlan();
        
        // 延迟一下确保保存完成
        setTimeout(() => {
            TimeRecorderAPI.syncDailyPlanToFeishu(currentDate)
                .then(result => {
                    console.log('飞书同步API返回:', result);
                    if (result.success) {
                        alert('同步到飞书成功!');
                        // 重新加载当前编辑的计划以更新同步状态
                        this.loadDailyPlan(currentDate);
                    } else {
                        console.error('同步失败 - 返回结果:', result);
                        alert('同步失败: ' + (result.error || result.message || '未知错误'));
                    }
                })
                .catch(error => {
                    console.error('同步到飞书失败 - 详细错误:', error);
                    console.error('错误类型:', error.name);
                    console.error('错误消息:', error.message);
                    console.error('错误堆栈:', error.stack);
                    alert('同步失败，请检查飞书配置\n错误详情: ' + error.message);
                });
        }, 500);
    },
    
    /**
     * 刷新统计数据（使用当前编辑的日期）
     */
    refreshStats: function() {
        if (!this.currentPlan) return;
        
        // 使用当前编辑的日期而不是强制切换到当前日期
        const currentDate = this.currentPlanDate || new Date().toISOString().split('T')[0];
        TimeRecorderAPI.loadDailyPlan(currentDate)
            .then(plan => {
                this.currentPlan = plan;
                this.renderStats(plan);
                this.renderActivities(plan.activities);
                this.renderEmotions(plan.emotions);
                // 更新简要视图
                this.updateSummaryView();
            })
            .catch(error => {
                console.error('刷新统计数据失败:', error);
            });
    },
    
    /**
     * 开始自动保存
     */
    startAutoSave: function() {
        // 清除已有的定时器
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        // 计算到下一个整点的时间间隔（北京时间）
        const now = new Date();
        const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 转换为北京时间
        const minutes = beijingTime.getMinutes();
        const seconds = beijingTime.getSeconds();
        const milliseconds = beijingTime.getMilliseconds();
        
        // 计算到下一个整点的毫秒数
        const delayToNextHour = (60 - minutes) * 60 * 1000 - seconds * 1000 - milliseconds;
        
        // 先设置一个延迟到整点的定时器
        setTimeout(() => {
            // 执行第一次自动保存
            this.savePlan();
            
            // 然后设置每小时执行一次的定时器
            this.autoSaveTimer = setInterval(() => {
                this.savePlan();
            }, this.autoSaveInterval);
            
            console.log('今日计划自动保存已启动，将在每个整点自动保存');
        }, delayToNextHour);
        
        console.log(`今日计划自动保存已设置，将在${delayToNextHour/1000}秒后首次执行`);
    },
    
    /**
     * 停止自动保存
     */
    stopAutoSave: function() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
            console.log('今日计划自动保存已停止');
        }
    },
    
    /**
     * 设置折叠状态
     * @param {boolean} collapsed - true表示折叠，false表示展开
     */
    setCollapsedState: function(collapsed) {
        const content = document.querySelector('.daily-plan-content');
        const summary = document.getElementById('daily-plan-summary');
        const statsFullWidth = document.getElementById('daily-plan-stats-full-width');
        const toggleBtn = document.getElementById('plan-toggle-btn');
        
        if (!content || !summary || !toggleBtn) return;
        
        if (collapsed) {
            // 折叠：隐藏完整内容，显示简要视图和全宽统计数据
            content.style.display = 'none';
            summary.style.display = 'grid';
            if (statsFullWidth) {
                statsFullWidth.style.display = 'block';
            }
            toggleBtn.textContent = '展开';
            // 更新简要视图
            this.updateSummaryView();
        } else {
            // 展开：显示完整内容，隐藏简要视图和全宽统计数据
            content.style.display = 'grid';
            summary.style.display = 'none';
            if (statsFullWidth) {
                statsFullWidth.style.display = 'none';
            }
            toggleBtn.textContent = '收起';
        }
    }
};

// 导出供全局使用
window.DailyPlanModule = DailyPlanModule;
