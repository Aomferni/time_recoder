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
    activityCategories, 
    useSimpleDetail,
    setCurrentActivity,
    setStartTime,
    setElapsedTime,
    setTimerInterval,
    setCurrentRecordId,
    setRecords,
    setCurrentDetailRecordId,
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
        // 查找包含"选择活动"标题的section
        const sections = document.querySelectorAll('.section');
        let targetSection = null;
        
        // 遍历所有section，找到包含"选择活动"h2标题的section
        for (let i = 0; i < sections.length; i++) {
            const h2 = sections[i].querySelector('h2');
            if (h2 && h2.textContent === '选择活动') {
                targetSection = sections[i];
                break;
            }
        }
        
        if (!targetSection) {
            console.error('找不到包含"选择活动"标题的section元素');
            return;
        }
        
        // 检查是否有活动类别
        if (!Array.isArray(activityCategories) || activityCategories.length === 0) {
            console.warn('没有活动类别配置');
            return;
        }
        
        // 清空现有的活动按钮容器（只清空目标section中的）
        const existingCategoryLabels = targetSection.querySelectorAll('.category-label');
        const existingButtonGrids = targetSection.querySelectorAll('.button-grid');
        
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
            
            // 将分类标签和按钮网格添加到目标section中
            targetSection.appendChild(categoryLabel);
            targetSection.appendChild(buttonGrid);
            
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
        
        // 按开始时间倒序排列（最新的在前）
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
        // 使用统一的记录详情组件
        TimeRecorderRecordDetail.showRecordDetail(recordId, useSimpleDetail);
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
     * 编辑记录详情
     */
    editRecordDetail: function(recordId) {
        setUseSimpleDetail(false);
        TimeRecorderUI.showRecordDetail(recordId);
    },
    
    /**
     * 切换详情区域的折叠/展开状态
     */
    toggleSection: function(button, sectionType) {
        const section = button.closest('.detail-section');
        const isCollapsed = section.classList.contains('collapsed');
        
        if (isCollapsed) {
            // 展开
            section.classList.remove('collapsed');
            button.textContent = '折叠';
            
            // 显示该区域的所有子元素
            const elements = section.querySelectorAll('div:not(.emotion-checkboxes), .emotion-checkboxes, .segments-display, .highlight-field');
            elements.forEach(el => {
                if (el !== section.querySelector('h3')) {
                    el.style.display = '';
                }
            });
        } else {
            // 折叠
            section.classList.add('collapsed');
            button.textContent = '展开';
            
            // 隐藏该区域的所有子元素
            const elements = section.querySelectorAll('div:not(.emotion-checkboxes), .emotion-checkboxes, .segments-display, .highlight-field');
            elements.forEach(el => {
                if (el !== section.querySelector('h3')) {
                    el.style.display = 'none';
                }
            });
        }
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
                    TimeRecorderUI.updateRecordsTable();
                    
                    // 开始计时器
                    if (timerInterval) {
                        clearInterval(timerInterval);
                    }
                    setTimerInterval(setInterval(TimeRecorderTimer.updateTimer, 1000));
                    
                    // 显示快速情绪记录区域
                    const quickEmotionSection = document.getElementById('quickEmotionSection');
                    if (quickEmotionSection) {
                        quickEmotionSection.style.display = 'block';
                    }
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
            currentActivityElement.textContent = record.activity;
            // 保存活动类别信息到data属性
            currentActivityElement.setAttribute('data-category', record.activityCategory || '');
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
        
        // 更新计时器区域的颜色
        const focusTimerSection = document.getElementById('focusTimerSection');
        if (focusTimerSection && record.activityCategory) {
            // 移除所有类别颜色类
            const colorClasses = ['btn-work-output', 'btn-charge', 'btn-rest', 'btn-create', 'btn-gap', 'btn-entertainment'];
            colorClasses.forEach(cls => {
                focusTimerSection.classList.remove(cls);
            });
            
            // 添加新的类别颜色类
            const categoryClass = TimeRecorderFrontendUtils.getActivityCategoryClass(record.activityCategory);
            focusTimerSection.classList.add(categoryClass);
            
            // 更新计时器中的类别显示
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
            categoryElement.textContent = record.activityCategory;
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
                    
                    // 显示快速情绪记录区域
                    const quickEmotionSection = document.getElementById('quickEmotionSection');
                    if (quickEmotionSection) {
                        quickEmotionSection.style.display = 'block';
                    }
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
        // 今日累计时长部分已移除，不再更新相关元素
        TimeRecorderAPI.getStats()
            .then(stats => {
                // 不再更新已删除的统计元素
                console.log('统计信息已更新:', stats);
            })
            .catch(error => {
                console.error('加载统计信息失败:', error);
            });
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
        
        // 调用后端API设置用户名
        TimeRecorderAPI.setUsername(username)
            .then(data => {
                if (data && data.success) {
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