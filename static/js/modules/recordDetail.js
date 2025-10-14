/**
 * 时间记录器记录详情模块
 * 统一处理所有页面的记录详情显示功能
 */

import { TimeRecorderFrontendUtils } from './utils.js';
import { TimeRecorderAPI } from './api.js';

/**
 * 记录详情模块 - 处理记录详情显示和编辑功能
 */
export const TimeRecorderRecordDetail = {
    /**
     * 显示记录详情浮窗
     * @param {string|object} recordIdOrRecord - 记录ID或记录对象
     * @param {boolean} useSimpleDetail - 是否使用简化版详情
     */
    showRecordDetail: function(recordIdOrRecord, useSimpleDetail = false) {
        // 检查参数类型，如果是ID则需要获取记录详情
        if (typeof recordIdOrRecord === 'string') {
            const recordId = recordIdOrRecord;
            // 从当前记录中查找或通过API获取
            TimeRecorderAPI.getRecord(recordId)
                .then(data => {
                    if (data && data.success) {
                        this._renderRecordDetail(data.record, useSimpleDetail);
                    } else {
                        console.error('加载记录详情失败:', data ? data.error : '未知错误');
                    }
                })
                .catch(error => {
                    console.error('加载记录详情失败:', error);
                });
        } else {
            // 直接渲染记录详情
            this._renderRecordDetail(recordIdOrRecord, useSimpleDetail);
        }
    },
    
    /**
     * 渲染记录详情内容
     * @param {object} record - 记录对象
     * @param {boolean} useSimpleDetail - 是否使用简化版详情
     */
    _renderRecordDetail: function(record, useSimpleDetail) {
        const modal = document.getElementById('recordDetailModal');
        const content = document.getElementById('recordDetailContent');
        
        if (!modal || !content) {
            console.error('找不到模态框元素');
            return;
        }
        
        // 设置模态框标题为活动名称
        const titleElement = modal.querySelector('h2');
        if (titleElement) {
            titleElement.textContent = record.activity || '活动详情';
        }
        
        if (useSimpleDetail) {
            this._renderSimpleRecordDetail(record, modal, content);
        } else {
            this._renderFullRecordDetail(record, modal, content);
        }
        
        // 显示模态框
        modal.style.display = 'block';
        
        // 添加键盘事件监听器，支持ESC键关闭模态框
        document.addEventListener('keydown', this._handleKeyDown);
    },
    
    /**
     * 渲染简化版记录详情
     * @param {object} record - 记录对象
     * @param {HTMLElement} modal - 模态框元素
     * @param {HTMLElement} content - 内容容器元素
     */
    _renderSimpleRecordDetail: function(record, modal, content) {
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
                    <button type="button" class="simple-detail-btn simple-detail-edit-btn" onclick="TimeRecorderRecordDetail.editRecordDetail('${record.id}')">编辑</button>
                    <button type="button" class="simple-detail-btn simple-detail-cancel-btn" onclick="TimeRecorderRecordDetail.closeRecordDetailModal()">关闭</button>
                </div>
            </div>
        `;
        
        modal.className = 'simple-detail-modal';
        content.innerHTML = detailContent;
    },
    
    /**
     * 渲染完整版记录详情
     * @param {object} record - 记录对象
     * @param {HTMLElement} modal - 模态框元素
     * @param {HTMLElement} content - 内容容器元素
     */
    _renderFullRecordDetail: function(record, modal, content) {
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
                            <button type="button" class="delete-btn small" onclick="TimeRecorderRecordDetail.deleteSegment('${record.id}', ${segment.index})">删除</button>
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
                
                <div class="detail-section">
                    <h3>记录情绪 <button type="button" class="collapse-btn" onclick="TimeRecorderFrontendUtils.toggleSection(this, 'emotion-section')">折叠</button></h3>
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
                
                <div class="detail-section collapsed">
                    <h3>段落详情 <button type="button" class="collapse-btn" onclick="TimeRecorderFrontendUtils.toggleSection(this, 'segments-section')">展开</button></h3>
                    <div class="segments-display" style="display: none;">
                        ${segmentsDisplay}
                        <button type="button" class="control-btn" onclick="TimeRecorderRecordDetail.addSegment('${record.id}')">添加段落</button>
                    </div>
                </div>
                
                <div class="detail-section collapsed">
                    <h3>核心信息 <button type="button" class="collapse-btn" onclick="TimeRecorderFrontendUtils.toggleSection(this, 'core-section')">展开</button></h3>
                    <div class="highlight-field important-field" style="display: none;">
                        <label>活动名称:</label>
                        <input type="text" value="${record.activity || ''}" id="detail-activity" class="${activityClass}">
                    </div>
                    
                    <div class="highlight-field" style="display: none;">
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
                    
                    <div class="highlight-field" style="display: none;">
                        <label>记录日期:</label>
                        <input type="text" value="${record.date || (record.startTime ? record.startTime.substring(0, 10).replace(/-/g, '/') : '')}" id="detail-date" readonly>
                    </div>
                </div>
                
                <div class="detail-section collapsed">
                    <h3>时间信息 <button type="button" class="collapse-btn" onclick="TimeRecorderFrontendUtils.toggleSection(this, 'time-section')">展开</button></h3>
                    <div class="highlight-field" style="display: none;">
                        <label>开始时间:</label>
                        <input type="datetime-local" value="${record.startTime ? TimeRecorderFrontendUtils.formatDateTimeForInput(new Date(record.startTime)) : ''}" id="detail-start-time">
                    </div>
                    
                    <div class="highlight-field" style="display: none;">
                        <label>结束时间:</label>
                        <input type="datetime-local" value="${record.endTime ? TimeRecorderFrontendUtils.formatDateTimeForInput(new Date(record.endTime)) : ''}" id="detail-end-time">
                    </div>
                    
                    <div class="highlight-field" style="display: none;">
                        <label>时间跨度:</label>
                        <input type="text" value="${record.timeSpan ? TimeRecorderFrontendUtils.formatDuration(record.timeSpan) : '0分钟0秒'}" id="detail-time-span" readonly>
                    </div>
                    
                    <div class="highlight-field important-field" style="display: none;">
                        <label>计时时长:</label>
                        <input type="text" value="${TimeRecorderFrontendUtils.formatDuration(totalDuration)}" id="detail-duration" readonly class="duration-input">
                    </div>
                    
                    <div class="highlight-field important-field" style="display: none;">
                        <label>暂停次数:</label>
                        <input type="number" value="${record.pauseCount || 0}" id="detail-pause-count" min="0">
                    </div>
                </div>
                
                <div class="detail-actions">
                    <button type="button" class="save-btn" onclick="TimeRecorderRecordDetail.saveRecordDetail('${record.id}')">保存</button>
                    <button type="button" class="cancel-btn" onclick="TimeRecorderRecordDetail.closeRecordDetailModal()">关闭</button>
                </div>
            </form>
        `;
        
        content.innerHTML = detailContent;
        modal.className = 'modal';
        
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
                TimeRecorderRecordDetail._updateTimeSpan(record.id);
            });
        }
        
        if (endTimeElement) {
            endTimeElement.addEventListener('change', function() {
                TimeRecorderRecordDetail._updateTimeSpan(record.id);
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
            modal.classList.add('closing');
            setTimeout(() => {
                modal.style.display = 'none';
                if (modal.classList.contains('closing')) {
                    modal.classList.remove('closing');
                }
            }, 300);
        }
        
        // 移除键盘事件监听器
        document.removeEventListener('keydown', this._handleKeyDown);
    },
    
    /**
     * 处理键盘事件
     */
    _handleKeyDown: function(event) {
        // ESC键关闭模态框
        if (event && event.key === 'Escape') {
            TimeRecorderRecordDetail.closeRecordDetailModal();
        }
    },
    
    /**
     * 切换详情模式
     */
    toggleDetailMode: function(recordId) {
        // 这个功能需要在具体页面中实现，因为涉及到useSimpleDetail状态的管理
        console.warn('toggleDetailMode需要在具体页面中实现');
    },
    
    /**
     * 编辑记录详情
     */
    editRecordDetail: function(recordId) {
        // 显示完整版详情
        this.showRecordDetail(recordId, false);
    },
    
    /**
     * 更新时间跨度
     */
    _updateTimeSpan: function(recordId) {
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
                <button type="button" class="delete-btn small" onclick="TimeRecorderRecordDetail.deleteSegment('${recordId}', ${segmentCount})">删除</button>
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
            this._renumberSegments();
        }
    },
    
    /**
     * 重新编号段落
     */
    _renumberSegments: function() {
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
                    
                    this.closeRecordDetailModal();
                    // 通知页面更新记录表格和统计信息
                    if (window.TimeRecorderUI) {
                        window.TimeRecorderUI.updateRecordsTable();
                        window.TimeRecorderUI.updateStats();
                    }
                } else {
                    alert('更新记录失败: ' + (data.error || '未知错误'));
                }
            })
            .catch(error => {
                console.error('更新记录失败:', error);
                alert('更新记录失败，请查看控制台了解详情');
            });
    }
};