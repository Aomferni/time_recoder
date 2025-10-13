/**
 * 时间记录器UI模块
 */

import { TimeRecorderFrontendUtils } from './utils.js';
import { TimeRecorderAPI } from './api.js';
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
    setCurrentRecordId,
    setRecords,
    setCurrentDetailRecordId,
    setCurrentUsername,
    setActivityCategories,
    setUseSimpleDetail
} from './config.js';

/**
 * UI模块 - 处理用户界面相关的功能
 */
export const TimeRecorderUI = {
    /**
     * 更新活动按钮显示
     */
    updateActivityButtons: function() {
        // 检查必要的DOM元素是否存在
        const section = document.querySelector('.section');
        if (!section) {
            console.error('找不到.section元素');
            return;
        }
        
        // 查找导航区域（现在在用户区域中）
        const navigation = document.querySelector('.top-navigation');
        
        // 检查是否有活动类别
        if (!Array.isArray(activityCategories) || activityCategories.length === 0) {
            console.warn('没有活动类别配置');
            return;
        }
        
        // 清空现有的活动按钮容器
        const existingCategoryLabels = section.querySelectorAll('.category-label');
        const existingButtonGrids = section.querySelectorAll('.button-grid');
        
        existingCategoryLabels.forEach(label => {
            if (label && label.parentNode) {
                label.parentNode.removeChild(label);
            }
        });
        existingButtonGrids.forEach(grid => {
            if (grid && grid.parentNode) {
                grid.parentNode.removeChild(grid);
            }
        });
        
        // 根据活动类别配置重新生成活动按钮
        activityCategories.forEach(category => {
            // 检查类别对象是否有效
            if (!category || !category.name) {
                console.warn('无效的类别对象:', category);
                return;
            }
            
            // 创建分类标签
            const categoryLabel = document.createElement('div');
            categoryLabel.className = 'category-label';
            categoryLabel.textContent = category.name;
            
            // 创建按钮网格
            const buttonGrid = document.createElement('div');
            buttonGrid.className = 'button-grid';
            
            // 将分类标签和按钮网格添加到section中
            section.appendChild(categoryLabel);
            section.appendChild(buttonGrid);
            
            // 检查是否有活动
            if (!Array.isArray(category.activities) || category.activities.length === 0) {
                console.warn('类别没有活动:', category.name);
                return;
            }
            
            // 为该类别下的每个活动创建按钮
            category.activities.forEach(activity => {
                // 检查活动名称是否有效
                if (!activity) {
                    console.warn('无效的活动名称:', activity);
                    return;
                }
                
                const button = document.createElement('button');
                button.className = `activity-btn ${TimeRecorderFrontendUtils.getActivityCategoryClass(category.name)}`;
                button.textContent = activity;
                button.dataset.activity = activity;
                
                // 添加事件监听器
                button.addEventListener('click', function() {
                    // 检查用户名
                    if (!TimeRecorderUI.checkUsernameBeforeActivity()) {
                        return;
                    }
                    
                    // 更新活动按钮的激活状态
                    const allButtons = document.querySelectorAll('.activity-btn');
                    allButtons.forEach(b => {
                        if (b && b.classList) {
                            b.classList.remove('active');
                        }
                    });
                    
                    if (this && this.classList) {
                        this.classList.add('active');
                    }
                    
                    // 更新当前活动
                    setCurrentActivity(this.dataset.activity);
                    
                    // 清除当前记录ID，取消今日记录的【当前】选中
                    setCurrentRecordId(null);
                    
                    // 更新当前活动显示
                    const currentActivityElement = document.getElementById('currentActivity');
                    if (currentActivityElement) {
                        currentActivityElement.textContent = `当前活动：${currentActivity}`;
                        // 启用编辑功能
                        currentActivityElement.contentEditable = "true";
                        currentActivityElement.focus();
                    }
                    
                    // 更新记录表格，移除之前的选中状态
                    TimeRecorderUI.updateRecordsTable();
                });
                
                buttonGrid.appendChild(button);
            });
        });
    },
    
    /**
     * 更新记录表格
     */
    updateRecordsTable: function() {
        const tbody = document.getElementById('recordsBody');
        if (!tbody) {
            console.error('找不到#recordsBody元素');
            return;
        }
        
        tbody.innerHTML = '';
        
        // 检查records是否为有效数组
        if (!Array.isArray(records)) {
            console.warn('records不是有效数组:', records);
            return;
        }
        
        // 按开始时间倒序排列
        const sortedRecords = [...records].sort((a, b) => {
            if (!a || !a.startTime || !b || !b.startTime) return 0;
            return new Date(b.startTime) - new Date(a.startTime);
        });
        
        // 检查是否有计时器正在运行
        const isTimerRunning = !!timerInterval;
        
        sortedRecords.forEach((record, index) => {
            // 检查记录对象是否有效
            if (!record || !record.id) {
                console.warn('无效的记录对象:', record);
                return;
            }
            
            const activityClass = TimeRecorderFrontendUtils.getActivityClass(record.activity, record.activityCategory);
            
            // 使用工具类计算总时长
            const totalDuration = TimeRecorderFrontendUtils.calculateRecordTotalTime(record, timerInterval ? elapsedTime : 0);
            
            const row = tbody.insertRow();
            
            // 检查是否是当前选中的记录
            const isSelected = currentRecordId === record.id;
            row.className = isSelected ? 'selected-record' : '';
            
            // 创建表格行内容
            const activityCell = row.insertCell(0);
            const timeCell = row.insertCell(1);
            const durationCell = row.insertCell(2);
            const actionsCell = row.insertCell(3);
            
            // 活动单元格
            const activitySpan = document.createElement('span');
            activitySpan.className = `activity-label ${activityClass}`;
            activitySpan.textContent = `${record.activity}${isSelected ? ' (当前)' : ''}`;
            activitySpan.addEventListener('click', () => TimeRecorderUI.showRecordDetail(record.id));
            activityCell.appendChild(activitySpan);
            
            // 时间单元格
            timeCell.textContent = record.startTime ? TimeRecorderFrontendUtils.formatTime(new Date(record.startTime)) : '';
            
            // 时长单元格
            durationCell.textContent = TimeRecorderFrontendUtils.formatDuration(totalDuration);
            
            // 操作单元格
            const continueBtn = document.createElement('button');
            continueBtn.className = 'continue-btn';
            continueBtn.textContent = '继续';
            continueBtn.disabled = isTimerRunning;
            continueBtn.addEventListener('click', () => TimeRecorderUI.continueActivity(record.id));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '删除';
            deleteBtn.addEventListener('click', () => TimeRecorderUI.deleteRecord(record.id));
            
            actionsCell.appendChild(continueBtn);
            actionsCell.appendChild(deleteBtn);
        });
    },
    
    /**
     * 显示记录详情浮窗
     */
    showRecordDetail: function(recordId) {
        // 检查records是否为有效数组
        if (!Array.isArray(records)) {
            console.error('records不是有效数组');
            return;
        }
        
        const record = records.find(r => r && r.id === recordId);
        if (!record) {
            console.error('找不到记录:', recordId);
            return;
        }
        
        setCurrentDetailRecordId(recordId);
        
        if (useSimpleDetail) {
            TimeRecorderUI.showSimpleRecordDetail(record);
        } else {
            TimeRecorderUI.showFullRecordDetail(record);
        }
        
        // 添加键盘事件监听器，支持ESC键关闭模态框
        document.addEventListener('keydown', TimeRecorderUI.handleKeyDown);
    },
    
    /**
     * 处理键盘事件
     */
    handleKeyDown: function(event) {
        // ESC键关闭模态框
        if (event && event.key === 'Escape') {
            TimeRecorderUI.closeRecordDetailModal();
        }
    },
    
    /**
     * 显示简化版记录详情
     */
    showSimpleRecordDetail: function(record) {
        const modal = document.getElementById('recordDetailModal');
        const content = document.getElementById('recordDetailContent');
        
        if (!modal || !content) {
            console.error('找不到模态框元素');
            return;
        }
        
        // 根据规范，duration记录所有segments累计的时间
        // 重新计算段落总时间以确保准确性
        let totalDuration = 0;
        if (record.segments && Array.isArray(record.segments)) {
            // 使用工具类计算所有段落的总时间
            totalDuration = TimeRecorderFrontendUtils.calculateSegmentsTotalTime(record.segments);
        }
        // 如果计算结果为0，使用record.duration作为后备值
        if (totalDuration === 0) {
            totalDuration = (record && record.duration) || 0;
        }
        
        // 处理情绪显示
        const emotionDisplay = record.emotion ? 
            record.emotion.split(', ').map(e => {
                const span = document.createElement('span');
                span.className = 'simple-detail-emotion';
                span.style.backgroundColor = TimeRecorderFrontendUtils.getEmotionColor(e);
                span.textContent = e;
                return span.outerHTML;
            }).join(' ') : '无';
        
        // 计算段落信息
        let segmentInfo = '无段落信息';
        if (record.segments && Array.isArray(record.segments) && record.segments.length > 0) {
            const segmentDetails = record.segments.map((segment, index) => {
                if (!segment || !segment.start || !segment.end) return null;
                
                try {
                    // 数据存储的是UTC时间，需要转换为北京时间显示
                    const start = new Date(new Date(segment.start).getTime());
                    const end = new Date(new Date(segment.end).getTime());
                    const duration = end - start;
                    return {
                        index,
                        start,
                        end,
                        duration
                    };
                } catch (e) {
                    console.error('处理段落信息时出错:', e);
                    return null;
                }
            }).filter(Boolean); // 过滤掉无效的段落
            
            if (segmentDetails.length > 0) {
                const totalSegmentDuration = segmentDetails.reduce((total, segment) => total + segment.duration, 0);
                segmentInfo = `段落数量: ${segmentDetails.length}, 总时长: ${TimeRecorderFrontendUtils.formatDuration(totalSegmentDuration)}`;
            }
        }
        
        // 构建简化版详情内容
        const detailContent = `
            <div class="simple-detail-content">
                <div class="simple-detail-section">
                    <h3>基本信息</h3>
                    <div class="simple-detail-item">
                        <span class="simple-detail-label">活动名称:</span>
                        <span class="simple-detail-value simple-detail-highlight">${record.activity || ''}</span>
                    </div>
                    <div class="simple-detail-item">
                        <span class="simple-detail-label">活动类别:</span>
                        <span class="simple-detail-value">${record.activityCategory || '未分类'}</span>
                    </div>
                    <div class="simple-detail-item">
                        <span class="simple-detail-label">记录日期:</span>
                        <span class="simple-detail-value">${record.date || (record.startTime ? record.startTime.substring(0, 10).replace(/-/g, '/') : '')}</span>
                    </div>
                </div>
                
                <div class="simple-detail-section">
                    <h3>时间信息</h3>
                    <div class="simple-detail-item">
                        <span class="simple-detail-label">开始时间:</span>
                        <span class="simple-detail-value">${record.startTime ? TimeRecorderFrontendUtils.formatTime(new Date(record.startTime)) : ''}</span>
                    </div>
                    <div class="simple-detail-item">
                        <span class="simple-detail-label">结束时间:</span>
                        <span class="simple-detail-value">${record.endTime ? TimeRecorderFrontendUtils.formatTime(new Date(record.endTime)) : ''}</span>
                    </div>
                    <div class="simple-detail-item">
                        <span class="simple-detail-label">时间跨度:</span>
                        <span class="simple-detail-value">${record.timeSpan ? TimeRecorderFrontendUtils.formatDuration(record.timeSpan) : '0分钟0秒'}</span>
                    </div>
                    <div class="simple-detail-item">
                        <span class="simple-detail-label">计时时长:</span>
                        <span class="simple-detail-value simple-detail-duration">${TimeRecorderFrontendUtils.formatDuration(totalDuration)}</span>
                    </div>
                    <div class="simple-detail-item">
                        <span class="simple-detail-label">暂停次数:</span>
                        <span class="simple-detail-value">${record.pauseCount || 0}</span>
                    </div>
                </div>
                
                <div class="simple-detail-section" style="background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%); border-left: 5px solid #4CAF50; box-shadow: 0 6px 20px rgba(76, 175, 80, 0.3); animation: highlightGlow 3s infinite;">
                    <h3 style="color: #1B5E20; font-size: 1.5rem; text-align: center; margin-bottom: 15px;">🎯 记录收获</h3>
                    <div class="simple-detail-item">
                        <span class="simple-detail-value" style="font-size: 1.2rem; line-height: 1.7; color: #1B5E20; font-weight: 500;">${record.remark || '暂无收获记录'}</span>
                    </div>
                </div>
                
                <div class="simple-detail-section">
                    <h3>其他信息</h3>
                    <div class="simple-detail-item">
                        <span class="simple-detail-label">记录情绪:</span>
                        <span class="simple-detail-value">${emotionDisplay}</span>
                    </div>
                    <div class="simple-detail-item">
                        <span class="simple-detail-label">段落信息:</span>
                        <span class="simple-detail-value">${segmentInfo}</span>
                    </div>
                </div>
                
                <div class="simple-detail-actions">
                    <button type="button" class="simple-detail-btn simple-detail-edit-btn" onclick="TimeRecorderUI.editRecordDetail('${record.id}')">编辑</button>
                    <button type="button" class="simple-detail-btn simple-detail-cancel-btn" onclick="TimeRecorderUI.closeRecordDetailModal()">关闭</button>
                </div>
            </div>
        `;
        
        modal.className = 'simple-detail-modal';
        modal.style.display = 'block';
    },
    
    /**
     * 显示完整版记录详情
     */
    showFullRecordDetail: function(record) {
        const modal = document.getElementById('recordDetailModal');
        const content = document.getElementById('recordDetailContent');
        
        if (!modal || !content) {
            console.error('找不到模态框元素');
            return;
        }
        
        const activityClass = record.activityCategory ? 
            TimeRecorderFrontendUtils.getActivityCategoryClass(record.activityCategory) : 
            TimeRecorderFrontendUtils.getActivityClass(record.activity, record.activityCategory);
        
        // 根据规范，duration记录所有segments累计的时间
        // 重新计算段落总时间以确保准确性
        let totalDuration = 0;
        if (record.segments && Array.isArray(record.segments)) {
            // 使用工具类计算所有段落的总时间
            totalDuration = TimeRecorderFrontendUtils.calculateSegmentsTotalTime(record.segments);
        }
        // 如果计算结果为0，使用record.duration作为后备值
        if (totalDuration === 0) {
            totalDuration = (record && record.duration) || 0;
        }
        
        // 处理情绪显示，添加颜色
        let emotionDisplay = '';
        if (record.emotion) {
            const emotions = record.emotion.split(', ');
            emotionDisplay = emotions.map(e => {
                const span = document.createElement('span');
                span.className = 'emotion-tag';
                span.style.backgroundColor = TimeRecorderFrontendUtils.getEmotionColor(e);
                span.textContent = e;
                return span.outerHTML;
            }).join(' ');
        }
        
        // 处理段落信息显示
        let segmentsDisplay = '';
        if (record.segments && Array.isArray(record.segments) && record.segments.length > 0) {
            // 计算每个段落的持续时间
            const segmentDetails = record.segments.map((segment, index) => {
                if (!segment || !segment.start || !segment.end) return null;
                
                try {
                    // 数据存储的是UTC时间，需要转换为北京时间显示
                    const start = new Date(segment.start);
                    const end = new Date(segment.end);
                    // 转换为北京时间（UTC+8）
                    const beijingStart = new Date(start.getTime());
                    const beijingEnd = new Date(end.getTime());
                    const duration = beijingEnd - beijingStart;
                    return {
                        index,
                        start: beijingStart,
                        end: beijingEnd,
                        duration
                    };
                } catch (e) {
                    console.error('处理段落信息时出错:', e);
                    return null;
                }
            }).filter(Boolean); // 过滤掉无效的段落
            
            if (segmentDetails.length > 0) {
                // 生成段落显示内容
                segmentsDisplay = segmentDetails.map(segment => {
                    return `
                        <div class="segment-row" data-segment-index="${segment.index}">
                            <span>段落 ${segment.index + 1}:</span>
                            <input type="datetime-local" class="segment-start" value="${TimeRecorderFrontendUtils.formatDateTimeForInput(segment.start)}">
                            <span> - </span>
                            <input type="datetime-local" class="segment-end" value="${TimeRecorderFrontendUtils.formatDateTimeForInput(segment.end)}">
                            <span>(${TimeRecorderFrontendUtils.formatDuration(segment.duration)})</span>
                            <button type="button" class="delete-btn small" onclick="TimeRecorderUI.deleteSegment('${record.id}', ${segment.index})">删除</button>
                        </div>
                    `;
                }).join('');
                
                // 添加段落统计信息
                const totalSegmentDuration = segmentDetails.reduce((total, segment) => total + segment.duration, 0);
                segmentsDisplay += `
                    <div class="segment-summary">
                        <p>段落数量: ${segmentDetails.length}</p>
                        <p>段落总时长: ${TimeRecorderFrontendUtils.formatDuration(totalSegmentDuration)}</p>
                    </div>
                `;
            } else {
                segmentsDisplay = '<div class="segment-row">暂无有效段落记录</div>';
            }
        } else {
            segmentsDisplay = '<div class="segment-row">暂无段落记录</div>';
        }
        
        // 构建详情内容
        const detailContent = `
            <form id="recordDetailForm" class="detail-form">
                <div class="detail-section highlight-section">
                    <h3>记录收获</h3>
                    <textarea id="detail-remark" class="highlight-field important-field" placeholder="记录这次活动的收获和感悟...">${record.remark || ''}</textarea>
                </div>
                
                <div class="detail-section highlight-section">
                    <h3>核心信息</h3>
                    <div class="highlight-field important-field">
                        <label>活动名称:</label>
                        <input type="text" value="${record.activity || ''}" id="detail-activity" class="${activityClass}">
                    </div>
                    
                    <div class="highlight-field">
                        <label>活动类别:</label>
                        <select id="detail-activity-category" class="${activityClass}">
                            <option value="工作输出" ${record.activityCategory === '工作输出' ? 'selected' : ''}>工作输出</option>
                            <option value="大脑充电" ${record.activityCategory === '大脑充电' ? 'selected' : ''}>大脑充电</option>
                            <option value="身体充电" ${record.activityCategory === '身体充电' ? 'selected' : ''}>身体充电</option>
                            <option value="修养生息" ${record.activityCategory === '修养生息' ? 'selected' : ''}>修养生息</option>
                            <option value="暂停一下" ${record.activityCategory === '暂停一下' ? 'selected' : ''}>暂停一下</option>
                            <option value="输出创作" ${record.activityCategory === '输出创作' ? 'selected' : ''}>输出创作</option>
                            <option value="纯属娱乐" ${record.activityCategory === '纯属娱乐' ? 'selected' : ''}>纯属娱乐</option>
                        </select>
                    </div>
                    
                    <div class="highlight-field">
                        <label>记录日期:</label>
                        <input type="text" value="${record.date || (record.startTime ? record.startTime.substring(0, 10).replace(/-/g, '/') : '')}" id="detail-date" readonly>
                    </div>
                </div>
                
                <div class="detail-section highlight-section">
                    <h3>时间信息</h3>
                    <div class="highlight-field">
                        <label>开始时间:</label>
                        <input type="datetime-local" value="${record.startTime ? TimeRecorderFrontendUtils.formatDateTimeForInput(new Date(record.startTime)) : ''}" id="detail-start-time">
                    </div>
                    
                    <div class="highlight-field">
                        <label>结束时间:</label>
                        <input type="datetime-local" value="${record.endTime ? TimeRecorderFrontendUtils.formatDateTimeForInput(new Date(record.endTime)) : ''}" id="detail-end-time">
                    </div>
                    
                    <div class="highlight-field">
                        <label>时间跨度:</label>
                        <input type="text" value="${record.timeSpan ? TimeRecorderFrontendUtils.formatDuration(record.timeSpan) : '0分钟0秒'}" id="detail-time-span" readonly>
                    </div>
                    
                    <div class="highlight-field important-field">
                        <label>计时时长:</label>
                        <input type="text" value="${TimeRecorderFrontendUtils.formatDuration(totalDuration)}" id="detail-duration" readonly class="duration-input">
                    </div>
                    
                    <div class="highlight-field important-field">
                        <label>暂停次数:</label>
                        <input type="number" value="${record.pauseCount || 0}" id="detail-pause-count" min="0">
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>记录情绪</h3>
                    <div class="emotion-checkboxes" id="detail-emotion">
                        ${(window.TimeRecorderConfig && Array.isArray(window.TimeRecorderConfig.emotionOptions) ? 
                            window.TimeRecorderConfig.emotionOptions.map(emotion => `
                                <div class="emotion-checkbox">
                                    <input type="checkbox" id="emotion-${emotion}" value="${emotion}" 
                                        ${record.emotion && record.emotion.includes(emotion) ? 'checked' : ''}>
                                    <label for="emotion-${emotion}" style="color: ${TimeRecorderFrontendUtils.getEmotionColor(emotion)};">${emotion}</label>
                                </div>
                            `).join('') : 
                            '')}
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>段落详情</h3>
                    <div class="segments-display">
                        ${segmentsDisplay}
                        <button type="button" class="control-btn" onclick="TimeRecorderUI.addSegment('${record.id}')">添加段落</button>
                    </div>
                </div>
                
                <div class="detail-actions">
                    <button type="button" class="save-btn" onclick="TimeRecorderUI.saveRecordDetail('${record.id}')">保存</button>
                    <button type="button" class="cancel-btn" onclick="TimeRecorderUI.closeRecordDetailModal()">关闭</button>
                    <button type="button" class="cancel-btn" id="toggleDetailModeBtn" onclick="TimeRecorderUI.toggleDetailMode()">
                        ${useSimpleDetail ? '切换到完整版详情' : '切换到简化版详情'}
                    </button>
                </div>
            </form>
        `;
        
        content.innerHTML = detailContent;
        modal.className = 'modal';
        modal.style.display = 'block';
        
        // 添加欢迎动画效果
        const modalContent = document.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('welcome-animation');
            setTimeout(() => {
                if (modalContent.classList.contains('welcome-animation')) {
                    modalContent.classList.remove('welcome-animation');
                }
            }, 1000);
        }
        
        // 绑定开始时间和结束时间的更改事件
        const startTimeElement = document.getElementById('detail-start-time');
        const endTimeElement = document.getElementById('detail-end-time');
        
        if (startTimeElement) {
            startTimeElement.addEventListener('change', function() {
                TimeRecorderUI.updateTimeSpan(record.id);
            });
        }
        
        if (endTimeElement) {
            endTimeElement.addEventListener('change', function() {
                TimeRecorderUI.updateTimeSpan(record.id);
            });
        }
        
        // 绑定活动类别更改事件，更新活动输入框的样式
        const categoryElement = document.getElementById('detail-activity-category');
        const activityElement = document.getElementById('detail-activity');
        
        if (categoryElement && activityElement) {
            categoryElement.addEventListener('change', function() {
                const selectedCategory = this.value;
                const activityClass = TimeRecorderFrontendUtils.getActivityCategoryClass(selectedCategory);
                
                // 移除所有可能的类别类
                if (window.TimeRecorderConfig && window.TimeRecorderConfig.activityCategoryClassMap) {
                    Object.values(window.TimeRecorderConfig.activityCategoryClassMap).forEach(cls => {
                        activityElement.classList.remove(cls);
                    });
                }
                
                // 添加新的类别类
                activityElement.classList.add(activityClass);
            });
        }
    },
    
    /**
     * 关闭记录详情浮窗
     */
    closeRecordDetailModal: function() {
        const modal = document.getElementById('recordDetailModal');
        if (modal) {
            // 添加关闭动画效果
            if (useSimpleDetail) {
                modal.classList.add('closing');
                setTimeout(() => {
                    modal.style.display = 'none';
                    if (modal.classList.contains('closing')) {
                        modal.classList.remove('closing');
                    }
                }, 300);
            } else {
                modal.classList.add('closing');
                setTimeout(() => {
                    modal.style.display = 'none';
                    if (modal.classList.contains('closing')) {
                        modal.classList.remove('closing');
                    }
                }, 300);
            }
        }
        setCurrentDetailRecordId(null);
        
        // 移除键盘事件监听器
        document.removeEventListener('keydown', TimeRecorderUI.handleKeyDown);
    },
    
    /**
     * 切换详情模式
     */
    toggleDetailMode: function() {
        setUseSimpleDetail(!useSimpleDetail);
        // 更新按钮文本
        const toggleBtn = document.getElementById('toggleDetailModeBtn');
        if (toggleBtn) {
            toggleBtn.textContent = useSimpleDetail ? '切换到完整版详情' : '切换到简化版详情';
        }
        if (window.TimeRecorderConfig && window.TimeRecorderConfig.currentDetailRecordId) {
            TimeRecorderUI.showRecordDetail(window.TimeRecorderConfig.currentDetailRecordId);
        }
    },
    
    /**
     * 编辑记录详情
     */
    editRecordDetail: function(recordId) {
        setUseSimpleDetail(false);
        TimeRecorderUI.showRecordDetail(recordId);
    },
    
    /**
     * 更新时间跨度
     */
    updateTimeSpan: function(recordId) {
        const startTimeElement = document.getElementById('detail-start-time');
        const endTimeElement = document.getElementById('detail-end-time');
        const timeSpanElement = document.getElementById('detail-time-span');
        
        if (!startTimeElement || !endTimeElement || !timeSpanElement) {
            console.error('更新时间跨度失败：缺少必要的表单元素');
            return;
        }
        
        const startTimeStr = startTimeElement.value;
        const endTimeStr = endTimeElement.value;
        
        if (startTimeStr && endTimeStr) {
            try {
                const startDate = new Date(startTimeStr);
                const endDate = new Date(endTimeStr);
                
                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                    const timeSpan = endDate - startDate;
                    timeSpanElement.value = TimeRecorderFrontendUtils.formatDuration(timeSpan);
                } else {
                    timeSpanElement.value = '无效时间';
                }
            } catch (e) {
                console.error('计算时间跨度时出错:', e);
                timeSpanElement.value = '计算错误';
            }
        } else {
            timeSpanElement.value = '0分钟0秒';
        }
    },
    
    /**
     * 添加段落
     */
    addSegment: function(recordId) {
        const segmentsContainer = document.querySelector('.segments-display');
        
        // 检查容器是否存在
        if (!segmentsContainer) {
            console.error('添加段落失败：找不到段落容器');
            return;
        }
        
        const segmentRows = segmentsContainer.querySelectorAll('.segment-row[data-segment-index]');
        const segmentCount = segmentRows.length;
        
        // 获取当前时间作为默认时间（使用北京时间）
        const now = new Date();
        const beijingNow = new Date(now.getTime());
        const defaultTime = TimeRecorderFrontendUtils.formatDateTimeForInput(beijingNow);
        
        const newSegment = `
            <div class="segment-row" data-segment-index="${segmentCount}">
                <span>段落 ${segmentCount + 1}:</span>
                <input type="datetime-local" class="segment-start" value="${defaultTime}">
                <span> - </span>
                <input type="datetime-local" class="segment-end" value="${defaultTime}">
                <span>(0秒)</span>
                <button type="button" class="delete-btn small" onclick="TimeRecorderUI.deleteSegment('${recordId}', ${segmentCount})">删除</button>
            </div>
        `;
        
        // 查找添加按钮
        const addButton = segmentsContainer.querySelector('.control-btn');
        
        // 如果找到了添加按钮，则在其前插入新段落
        if (addButton) {
            // 创建临时容器来解析HTML
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = newSegment;
            const segmentElement = tempContainer.firstElementChild;
            
            if (segmentElement) {
                segmentsContainer.insertBefore(segmentElement, addButton);
            }
        } else {
            // 如果没有找到添加按钮，直接添加到容器末尾
            segmentsContainer.insertAdjacentHTML('beforeend', newSegment);
        }
    },
    
    /**
     * 删除段落
     */
    deleteSegment: function(recordId, segmentIndex) {
        const segmentRow = document.querySelector(`.segment-row[data-segment-index="${segmentIndex}"]`);
        if (segmentRow && segmentRow.parentNode) {
            segmentRow.parentNode.removeChild(segmentRow);
            // 重新编号剩余的段落
            TimeRecorderUI.renumberSegments();
        }
    },
    
    /**
     * 重新编号段落
     */
    renumberSegments: function() {
        const segmentRows = document.querySelectorAll('.segment-row[data-segment-index]');
        segmentRows.forEach((row, index) => {
            row.setAttribute('data-segment-index', index);
            const span = row.querySelector('span');
            if (span) {
                span.textContent = `段落 ${index + 1}:`;
            }
            const deleteButton = row.querySelector('.delete-btn');
            if (deleteButton) {
                // 更新删除按钮的onclick属性
                const onclickAttr = deleteButton.getAttribute('onclick');
                if (onclickAttr) {
                    deleteButton.setAttribute('onclick', onclickAttr.replace(/\d+$/, index));
                }
            }
        });
    },
    
    /**
     * 保存记录详情
     */
    saveRecordDetail: function(recordId) {
        // 安全地获取表单元素的值
        const activityElement = document.getElementById('detail-activity');
        const activityCategoryElement = document.getElementById('detail-activity-category');
        const startTimeElement = document.getElementById('detail-start-time');
        const endTimeElement = document.getElementById('detail-end-time');
        const remarkElement = document.getElementById('detail-remark');
        const pauseCountElement = document.getElementById('detail-pause-count');
        
        // 检查所有必需的元素是否存在，并提供具体的错误信息
        if (!activityElement) {
            console.error('保存记录详情失败：找不到活动名称元素 (detail-activity)');
            alert('保存记录详情失败：活动名称元素缺失');
            return;
        }
        
        if (!activityCategoryElement) {
            console.error('保存记录详情失败：找不到活动类别元素 (detail-activity-category)');
            alert('保存记录详情失败：活动类别元素缺失');
            return;
        }
        
        if (!startTimeElement) {
            console.error('保存记录详情失败：找不到开始时间元素 (detail-start-time)');
            alert('保存记录详情失败：开始时间元素缺失');
            return;
        }
        
        if (!endTimeElement) {
            console.error('保存记录详情失败：找不到结束时间元素 (detail-end-time)');
            alert('保存记录详情失败：结束时间元素缺失');
            return;
        }
        
        if (!remarkElement) {
            console.error('保存记录详情失败：找不到备注信息元素 (detail-remark)');
            alert('保存记录详情失败：备注信息元素缺失');
            return;
        }
        
        if (!pauseCountElement) {
            console.error('保存记录详情失败：找不到暂停次数元素 (detail-pause-count)');
            alert('保存记录详情失败：暂停次数元素缺失');
            return;
        }
        
        const activity = activityElement.value;
        const activityCategory = activityCategoryElement.value;
        const startTimeStr = startTimeElement.value;
        const endTimeStr = endTimeElement.value;
        const remark = remarkElement.value;
        const pauseCount = pauseCountElement.value;
        
        // 获取选中的情绪
        const emotionCheckboxes = document.querySelectorAll('#detail-emotion input[type="checkbox"]:checked');
        const emotions = Array.from(emotionCheckboxes).map(cb => cb.value).join(', ');
        
        // 获取段落信息
        const segmentRows = document.querySelectorAll('.segment-row[data-segment-index]');
        let segments = [];
        segmentRows.forEach(row => {
            const startInput = row.querySelector('.segment-start');
            const endInput = row.querySelector('.segment-end');
            
            if (startInput && endInput) {
                const startIndex = startInput.value;
                const endIndex = endInput.value;
                
                if (startIndex && endIndex) {
                    try {
                        // 输入框中的时间已经是北京时间格式，需要转换为UTC时间存储
                        const beijingStart = new Date(startIndex);
                        const beijingEnd = new Date(endIndex);
                        // 转换为UTC时间存储（减去8小时偏移）
                        const utcStart = new Date(beijingStart.getTime());
                        const utcEnd = new Date(beijingEnd.getTime());
                        
                        if (!isNaN(utcStart.getTime()) && !isNaN(utcEnd.getTime())) {
                            segments.push({
                                start: utcStart.toISOString(),
                                end: utcEnd.toISOString()
                            });
                        }
                    } catch (e) {
                        console.error('处理段落时间时出错:', e);
                    }
                }
            }
        });
        
        // 按开始时间排序段落
        segments.sort((a, b) => {
            const startA = new Date(a.start).getTime();
            const startB = new Date(b.start).getTime();
            return startA - startB;
        });
        
        // 构造更新数据
        const updateData = {
            activity: activity,
            activityCategory: activityCategory,
            remark: remark,
            emotion: emotions,
            pauseCount: parseInt(pauseCount) || 0,
            segments: segments
        };
        
        // 更新时间字段
        if (segments.length > 0) {
            // 根据规范，startTime应为第一个段落的开始时间
            const firstSegment = segments[0];
            updateData.startTime = firstSegment.start;
            
            // 根据规范，endTime应为最后一个段落的结束时间（这是关键修复点）
            const lastSegment = segments[segments.length - 1];
            updateData.endTime = lastSegment.end;
            
            // 重新计算时间跨度
            try {
                const firstStart = new Date(firstSegment.start).getTime();
                const lastEnd = new Date(lastSegment.end).getTime();
                if (!isNaN(firstStart) && !isNaN(lastEnd)) {
                    updateData.timeSpan = lastEnd - firstStart;
                }
            } catch (e) {
                console.error('计算时间跨度时出错:', e);
            }
        } else if (startTimeStr && endTimeStr) {
            // 如果没有段落但有手动设置的时间
            try {
                // 输入框中的时间已经是北京时间格式，需要转换为UTC时间存储
                const beijingStartDate = new Date(startTimeStr);
                const beijingEndDate = new Date(endTimeStr);
                // 转换为UTC时间存储（减去8小时偏移）
                const utcStartDate = new Date(beijingStartDate.getTime());
                const utcEndDate = new Date(beijingEndDate.getTime());
                
                if (!isNaN(utcStartDate.getTime()) && !isNaN(utcEndDate.getTime())) {
                    updateData.startTime = utcStartDate.toISOString();
                    updateData.endTime = utcEndDate.toISOString();
                    
                    // 重新计算时间跨度
                    const timeSpan = utcEndDate - utcStartDate;
                    updateData.timeSpan = timeSpan;
                }
            } catch (e) {
                console.error('处理时间时出错:', e);
            }
        }
        
        // 发送到后端更新
        TimeRecorderAPI.updateRecord(recordId, updateData)
            .then(data => {
                if (data && data.success) {
                    // 更新本地记录
                    const index = records.findIndex(r => r && r.id === recordId);
                    if (index !== -1) {
                        records[index] = {...records[index], ...data.record};
                    }
                    
                    // 触发保存成功动画
                    // 确保只选择当前模态框中的保存按钮
                    const modal = document.getElementById('recordDetailModal');
                    if (modal) {
                        const saveBtn = modal.querySelector('.save-btn');
                        if (saveBtn) {
                            saveBtn.classList.add('save-success');
                            setTimeout(() => {
                                if (saveBtn.classList.contains('save-success')) {
                                    saveBtn.classList.remove('save-success');
                                }
                            }, 500);
                        }
                    }
                    
                    TimeRecorderUI.closeRecordDetailModal();
                    TimeRecorderUI.updateRecordsTable();
                    TimeRecorderUI.updateStats();
                } else {
                    alert('更新记录失败: ' + (data.error || '未知错误'));
                }
            })
            .catch(error => {
                console.error('更新记录失败:', error);
                alert('更新记录失败，请查看控制台了解详情');
            });
    },
    
    /**
     * 继续选中的活动
     */
    continueActivity: function(recordId) {
        // 检查records是否为有效数组
        if (!Array.isArray(records)) {
            console.error('records不是有效数组');
            return;
        }
        
        const record = records.find(r => r && r.id === recordId);
        if (!record) {
            console.error('找不到记录:', recordId);
            return;
        }
        
        // 1. 将对应的活动标题，更新在【请选择活动】处
        setCurrentActivity(record.activity);
        const currentActivityElement = document.getElementById('currentActivity');
        if (currentActivityElement) {
            currentActivityElement.textContent = `当前活动：${record.activity}`;
            currentActivityElement.contentEditable = "true";
        }
        
        // 2. 将计时时长同步在【请选择活动】处
        // 根据新定义，duration记录的是所有segments累计的时间
        let accumulatedTime = record.duration || 0;
        
        // 保存当前记录ID，以便继续更新这个记录
        setCurrentRecordId(recordId);
        
        // 重置计时器状态
        TimeRecorderTimer.resetTimer();
        
        // 设置开始时间为当前时间（用于当前段落计时）
        // 使用UTC时间存储
        setStartTime(new Date().getTime());
        // elapsedTime应该从0开始计时
        setElapsedTime(0);
        
        // 更新计时器显示
        TimeRecorderTimer.updateTimer();
        
        // 更新按钮状态
        const toggleBtn = document.getElementById('toggleBtn');
        if (toggleBtn) {
            toggleBtn.textContent = '停止';
        }
        
        // 3. 新增一个segment开始时间
        // 4. 继续计时
        // 根据新定义，startTime应为唯一的不修改的值，是第一个segments的start时间
        // endTime为最后一个segments的end时间
        // timeSpan记录的是startTime到endTime的时间跨度
        // pauseCount记录的是segments的个数
        const updateData = {
            // startTime保持不变，不更新
            // endTime将在停止时更新
            // duration保持不变，不更新
            pauseCount: (record.segments && Array.isArray(record.segments) ? record.segments.length : 0) + 1, // pauseCount记录的是segments的个数
            segments: {
                // 使用UTC时间创建Date对象
                start: new Date(startTime).toISOString(),
                end: new Date(startTime).toISOString() // 初始结束时间与开始时间相同
            }
        };
        
        // 发送到后端更新
        TimeRecorderAPI.updateRecord(recordId, updateData)
            .then(data => {
                if (data && data.success) {
                    // 更新本地记录
                    const index = records.findIndex(r => r && r.id === recordId);
                    if (index !== -1) {
                        records[index] = {...records[index], ...data.record};
                    }
                    TimeRecorderUI.updateRecordsTable();
                    
                    // 开始计时器
                    if (timerInterval) {
                        clearInterval(timerInterval);
                    }
                    setTimerInterval(setInterval(TimeRecorderTimer.updateTimer, 1000));
                } else {
                    alert('更新记录失败: ' + (data.error || '未知错误'));
                }
            })
            .catch(error => {
                console.error('更新记录失败:', error);
                alert('更新记录失败，请查看控制台了解详情');
            });
    },
    
    /**
     * 删除记录
     */
    deleteRecord: function(recordId) {
        if (!confirm('确定要删除这条记录吗？')) {
            return;
        }
        
        TimeRecorderAPI.deleteRecord(recordId)
            .then(data => {
                if (data && data.success) {
                    setRecords(records.filter(record => record && record.id !== recordId));
                    // 如果删除的是当前记录，重置currentRecordId
                    if (currentRecordId === recordId) {
                        setCurrentRecordId(null);
                    }
                    // 如果删除的是详情浮窗的记录，关闭浮窗
                    if (window.TimeRecorderConfig && window.TimeRecorderConfig.currentDetailRecordId === recordId) {
                        TimeRecorderUI.closeRecordDetailModal();
                    }
                    TimeRecorderUI.updateRecordsTable();
                    TimeRecorderUI.updateStats();
                } else {
                    alert('删除记录失败: ' + (data.error || '未知错误'));
                }
            })
            .catch(error => {
                console.error('删除记录失败:', error);
                alert('删除记录失败，请查看控制台了解详情');
            });
    },
    
    /**
     * 更新统计信息
     */
    updateStats: function() {
        TimeRecorderAPI.getStats()
            .then(stats => {
                const totalTimeElement = document.getElementById('totalTime');
                const activityCountElement = document.getElementById('activityCount');
                
                if (totalTimeElement) {
                    totalTimeElement.textContent = `${stats.totalHours || 0}小时${stats.totalMinutes || 0}分`;
                }
                
                if (activityCountElement) {
                    activityCountElement.textContent = `${stats.activityCount || 0}次`;
                }
            })
            .catch(error => {
                console.error('加载统计信息失败:', error);
            });
    },
    
    /**
     * 检查用户名，没有设置用户名前不能记录活动
     */
    checkUsernameBeforeActivity: function() {
        if (!currentUsername || currentUsername === 'default') {
            alert('请先设置用户名后再记录活动');
            return false;
        }
        return true;
    },
    
    /**
     * 更新活动按钮的可用状态
     */
    updateActivityButtonsState: function() {
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
    },
    
    /**
     * 设置用户名
     */
    setUsername: function() {
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
                    TimeRecorderUI.loadRecords();
                    
                    // 更新活动按钮状态
                    TimeRecorderUI.updateActivityButtonsState();
                    
                    alert(`用户名已设置为: ${username}`);
                } else {
                    alert('设置用户名失败: ' + (data.error || '未知错误'));
                }
            })
            .catch(error => {
                console.error('设置用户名失败:', error);
                alert('设置用户名失败，请查看控制台了解详情');
            });
    },
    
    /**
     * 从后端加载记录
     */
    loadRecords: function() {
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
    },
    
    /**
     * 检查是否有从历史记录页面传递的继续活动信息
     */
    checkContinueActivity: function() {
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
                        if (window.TimeRecorderTimer && window.TimeRecorderTimer.toggleTimer) {
                            window.TimeRecorderTimer.toggleTimer();
                        }
                    }, 100);
                }
            } catch (e) {
                console.error('解析继续活动数据时出错:', e);
                localStorage.removeItem('continueActivity');
            }
        }
    }
};