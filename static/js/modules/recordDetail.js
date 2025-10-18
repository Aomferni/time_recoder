/**
 * 时间记录器记录详情模块
 * 统一处理所有页面的记录详情显示功能
 */

import { TimeRecorderFrontendUtils } from './utils.js';
import { TimeRecorderAPI } from './api.js';
import { TimeRecorderLogger } from './logger.js';

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
        TimeRecorderLogger.info('RecordDetail', '显示记录详情浮窗', { useSimpleDetail: useSimpleDetail });
        // 检查参数类型，如果是ID则需要获取记录详情
        if (typeof recordIdOrRecord === 'string') {
            const recordId = recordIdOrRecord;
            TimeRecorderLogger.debug('RecordDetail', '通过API获取记录详情', { recordId: recordId });
            // 从当前记录中查找或通过API获取
            TimeRecorderAPI.getRecord(recordId)
                .then(data => {
                    if (data && data.success) {
                        TimeRecorderLogger.info('RecordDetail', '记录详情获取成功', { recordId: recordId });
                        this._renderRecordDetail(data.record, useSimpleDetail);
                    } else {
                        TimeRecorderLogger.error('RecordDetail', '加载记录详情失败', data ? data.error : '未知错误');
                        console.error('加载记录详情失败:', data ? data.error : '未知错误');
                    }
                })
                .catch(error => {
                    TimeRecorderLogger.error('RecordDetail', '加载记录详情异常', error);
                    console.error('加载记录详情失败:', error);
                });
        } else {
            // 直接渲染记录详情
            TimeRecorderLogger.debug('RecordDetail', '直接渲染记录详情');
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
                        ${(() => {
                            // 按象限分组情绪选项
                            const emotionGroups = {
                                '正向+专注': { emotions: ['惊奇', '兴奋', '高兴', '愉悦'], color: '#9C27B0' },
                                '正向+松弛': { emotions: ['安逸', '安心', '满足', '宁静', '放松'], color: '#00BCD4' },
                                '负面+松弛': { emotions: ['悲伤', '伤心', '沮丧', '疲惫'], color: '#546E7A' },
                                '负面+专注': { emotions: ['惊恐', '紧张', '愤怒', '苦恼'], color: '#424242' }
                            };
                            
                            return Object.entries(emotionGroups).map(([groupName, groupData]) => `
                                <div class="emotion-quadrant">
                                    <div class="emotion-quadrant-title">${groupName}</div>
                                    <div class="emotion-quadrant-grid">
                                        ${groupData.emotions.map(emotion => {
                                            const isSelected = record.emotion && record.emotion.includes(emotion);
                                            // 使用工具类获取情绪颜色
                                            const emotionColor = TimeRecorderFrontendUtils.getEmotionColor(emotion);
                                            // 获取情绪对应的emoji
                                            const emotionEmoji = TimeRecorderFrontendUtils.getEmotionEmoji(emotion);
                                            return `
                                            <div class="emotion-checkbox ${isSelected ? 'selected' : ''}" 
                                                data-emotion="${emotion}" 
                                                style="background-color: ${emotionColor};">
                                                <input type="checkbox" id="emotion-${emotion}" value="${emotion}" 
                                                    ${isSelected ? 'checked' : ''}>
                                                <label for="emotion-${emotion}">${emotionEmoji} ${emotion}</label>
                                                ${isSelected ? '<div class="checkmark">✓</div>' : ''}
                                            </div>
                                        `}).join('')}
                                    </div>
                                </div>
                            `).join('');
                        })()}
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
                            <!-- 活动类别选项将动态加载 -->
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
        
        // 绑定情绪按钮点击事件
        this._bindEmotionClickEvents();
        
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
        
        // 动态加载活动类别并填充下拉框
        const categoryElement = document.getElementById('detail-activity-category');
        const activityElement = document.getElementById('detail-activity');
        
        if (categoryElement) {
            // 加载活动类别配置
            TimeRecorderAPI.loadActivityCategories()
                .then(categories => {
                    // 清空现有选项
                    categoryElement.innerHTML = '';
                    
                    // 添加默认选项
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = '请选择活动类别';
                    categoryElement.appendChild(defaultOption);
                    
                    // 为每个类别添加选项
                    categories.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.name;
                        option.textContent = category.name;
                        option.selected = record.activityCategory === category.name;
                        categoryElement.appendChild(option);
                    });
                    
                    // 如果记录已经有活动类别但不在选项中，添加它
                    if (record.activityCategory && !categories.some(cat => cat.name === record.activityCategory)) {
                        const option = document.createElement('option');
                        option.value = record.activityCategory;
                        option.textContent = record.activityCategory;
                        option.selected = true;
                        categoryElement.appendChild(option);
                    }
                })
                .catch(error => {
                    console.error('加载活动类别失败:', error);
                    // 如果加载失败，使用默认选项
                    categoryElement.innerHTML = `
                        <option value="工作输出" ${record.activityCategory === '工作输出' ? 'selected' : ''}>工作输出</option>
                        <option value="大脑充电" ${record.activityCategory === '大脑充电' ? 'selected' : ''}>大脑充电</option>
                        <option value="身体充电" ${record.activityCategory === '身体充电' ? 'selected' : ''}>身体充电</option>
                        <option value="修养生息" ${record.activityCategory === '修养生息' ? 'selected' : ''}>修养生息</option>
                        <option value="暂停一下" ${record.activityCategory === '暂停一下' ? 'selected' : ''}>暂停一下</option>
                        <option value="输出创作" ${record.activityCategory === '输出创作' ? 'selected' : ''}>输出创作</option>
                        <option value="纯属娱乐" ${record.activityCategory === '纯属娱乐' ? 'selected' : ''}>纯属娱乐</option>
                    `;
                });
            
            // 绑定活动类别更改事件，更新活动输入框的样式
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
                if (activityElement && activityClass) {
                    activityElement.classList.add(activityClass);
                }
            });
        }
    },
    
    /**
     * 记录当前选中的所有情绪
     */
    _logSelectedEmotions: function() {
        const emotionCheckboxes = document.querySelectorAll('#detail-emotion input[type="checkbox"]:checked');
        const emotions = Array.from(emotionCheckboxes).map(cb => cb.value);
        console.log('[情绪选择] 当前选中的情绪:', emotions);
        
        // 同时也记录通过selected类选中的情绪
        const selectedEmotions = document.querySelectorAll('#detail-emotion .emotion-checkbox.selected');
        const selectedEmotionNames = Array.from(selectedEmotions).map(el => el.getAttribute('data-emotion'));
        console.log('[情绪选择] 通过selected类选中的情绪:', selectedEmotionNames);
        
        // 同时也记录所有情绪元素的状态，用于调试
        const allEmotionElements = document.querySelectorAll('#detail-emotion .emotion-checkbox');
        const allEmotionStates = Array.from(allEmotionElements).map(el => ({
            emotion: el.getAttribute('data-emotion'),
            selected: el.classList.contains('selected'),
            checked: el.querySelector('input[type="checkbox"]')?.checked
        }));
        console.log('[情绪选择] 所有情绪元素状态:', allEmotionStates);
    },
    
    /**
     * 关闭记录详情浮窗
     */
    closeRecordDetailModal: function() {
        console.log('[记录详情] 关闭记录详情浮窗');
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
     * 绑定情绪按钮点击事件
     */
    _bindEmotionClickEvents: function() {
        const emotionContainer = document.getElementById('detail-emotion');
        if (emotionContainer) {
            console.log('[情绪选择] 绑定情绪按钮点击事件');
            // 使用事件委托处理情绪按钮点击
            emotionContainer.addEventListener('click', (event) => {
                console.log('[情绪选择] 情绪按钮被点击, 事件目标:', event.target);
                
                // 防止事件重复处理
                if (event.hasOwnProperty('_emotionHandled')) {
                    console.log('[情绪选择] 事件已被处理，忽略重复处理');
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }
                
                // 标记事件已被处理
                event._emotionHandled = true;
                
                // 查找被点击的元素或其父元素是否为情绪按钮
                let emotionElement = event.target.closest('.emotion-checkbox');
                
                // 如果没有找到情绪按钮元素，检查是否点击了label元素
                if (!emotionElement) {
                    // 检查是否点击了label元素
                    if (event.target.tagName === 'LABEL' && event.target.htmlFor) {
                        const checkboxId = event.target.htmlFor;
                        const checkbox = document.getElementById(checkboxId);
                        if (checkbox) {
                            const emotionName = checkboxId.replace('emotion-', '');
                            emotionElement = document.querySelector(`.emotion-checkbox[data-emotion="${emotionName}"]`);
                        }
                    }
                }
                
                // 如果仍然没有找到情绪按钮元素，检查是否点击了checkbox元素
                if (!emotionElement) {
                    // 检查是否点击了checkbox元素
                    if (event.target.tagName === 'INPUT' && event.target.type === 'checkbox' && event.target.id) {
                        const emotionName = event.target.id.replace('emotion-', '');
                        emotionElement = document.querySelector(`.emotion-checkbox[data-emotion="${emotionName}"]`);
                    }
                }
                
                // 如果仍然没有找到情绪按钮元素，直接返回
                if (!emotionElement) {
                    console.log('[情绪选择] 点击的不是情绪按钮');
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }
                
                // 阻止事件冒泡和默认行为，防止重复触发
                event.preventDefault();
                event.stopPropagation();
                
                // 获取情绪名称
                const emotion = emotionElement.getAttribute('data-emotion');
                console.log('[情绪选择] 点击的情绪:', emotion);
                if (emotion) {
                    // 移除点击间隔限制，允许用户快速选择情绪
                    // 添加处理标记，防止重复点击
                    if (emotionElement.classList.contains('processing')) {
                        console.log('[情绪选择] 正在处理中，忽略重复点击');
                        return;
                    }
                    
                    // 添加处理标记
                    emotionElement.classList.add('processing');
                    
                    // 调用选择或取消选择情绪函数
                    this.toggleEmotion(emotion);
                    
                    // 移除处理标记
                    setTimeout(() => {
                        if (emotionElement && emotionElement.classList.contains('processing')) {
                            emotionElement.classList.remove('processing');
                        }
                    }, 300);
                }
            });
        }
    },
    
    /**
     * 选择或取消选择情绪
     */
    toggleEmotion: function(emotion) {
        TimeRecorderLogger.info('RecordDetail', '选择或取消选择情绪', { emotion: emotion });
        const emotionElement = document.querySelector(`.emotion-checkbox[data-emotion="${emotion}"]`);
        const checkbox = document.getElementById(`emotion-${emotion}`);
        
        console.log('[情绪选择] 选择或取消选择情绪:', emotion);
        console.log('[情绪选择] 找到情绪元素:', !!emotionElement);
        console.log('[情绪选择] 找到复选框:', !!checkbox);
        
        if (emotionElement && checkbox) {
            // 切换选中状态
            const isSelected = emotionElement.classList.contains('selected');
            TimeRecorderLogger.debug('RecordDetail', '当前情绪选中状态', { emotion: emotion, isSelected: isSelected });
            console.log('[情绪选择] 当前选中状态:', isSelected);
            
            if (isSelected) {
                console.log('[情绪选择] 取消选择情绪:', emotion);
                emotionElement.classList.remove('selected');
                checkbox.checked = false;
                // 移除选中标识
                const checkmark = emotionElement.querySelector('.checkmark');
                if (checkmark) {
                    console.log('[情绪选择] 移除checkmark元素');
                    // 使用动画移除checkmark元素
                    checkmark.style.transform = 'scale(0)';
                    setTimeout(() => {
                        if (checkmark && checkmark.parentNode === emotionElement) {
                            emotionElement.removeChild(checkmark);
                        }
                    }, 200);
                }
                TimeRecorderLogger.debug('RecordDetail', '取消选择情绪', { emotion: emotion });
            } else {
                console.log('[情绪选择] 选择情绪:', emotion);
                emotionElement.classList.add('selected');
                checkbox.checked = true;
                
                // 添加选中标识
                // 首先检查是否已存在checkmark元素
                let checkmark = emotionElement.querySelector('.checkmark');
                if (!checkmark) {
                    console.log('[情绪选择] 创建新的checkmark元素');
                    checkmark = document.createElement('div');
                    checkmark.className = 'checkmark';
                    checkmark.innerHTML = '✓';
                    // 确保checkmark元素在正确的位置
                    emotionElement.appendChild(checkmark);
                } else {
                    console.log('[情绪选择] 使用现有的checkmark元素');
                }
                // 确保checkmark元素显示并触发动画
                checkmark.style.display = 'flex';
                // 强制重绘以确保动画生效
                checkmark.offsetHeight;
                checkmark.style.transform = 'scale(1)';
                console.log('[情绪选择] checkmark元素已显示');
                
                // 添加触觉反馈（如果设备支持）
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                TimeRecorderLogger.debug('RecordDetail', '选中情绪', { emotion: emotion });
            }
            
            // 立即移除processing类，允许用户进行下一次点击
            if (emotionElement.classList.contains('processing')) {
                console.log('[情绪选择] 移除processing类');
                emotionElement.classList.remove('processing');
            }
            
            // 触发自定义事件，便于其他组件监听
            const event = new CustomEvent('emotionToggled', {
                detail: { emotion: emotion, selected: !isSelected }
            });
            document.dispatchEvent(event);
            
            // 显示当前选中的所有情绪
            this._logSelectedEmotions();
        } else {
            TimeRecorderLogger.error('RecordDetail', '找不到情绪元素', { emotion: emotion });
            console.error('[情绪选择] 找不到情绪元素或复选框', { emotion: emotion, emotionElement: emotionElement, checkbox: checkbox });
            
            // 如果找不到元素，也要确保移除processing类
            if (emotionElement && emotionElement.classList.contains('processing')) {
                emotionElement.classList.remove('processing');
            }
        }
    },
    
    /**
     * 保存记录详情
     */
    saveRecordDetail: function(recordId) {
        console.log('[保存记录] 开始保存记录详情, 记录ID:', recordId);
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
        
        // 验证活动类别不为空
        if (!activityCategory) {
            alert('请选择活动类别');
            activityCategoryElement.focus();
            return;
        }
        
        // 获取选中的情绪
        const emotionCheckboxes = document.querySelectorAll('#detail-emotion input[type="checkbox"]:checked');
        const emotions = Array.from(emotionCheckboxes).map(cb => cb.value).join(', ');
        console.log('[保存记录] 选中的情绪:', emotions);
        
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
        
        console.log('[保存记录] 准备更新的数据:', updateData);
        
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
                console.log('[保存记录] 后端响应数据:', data);
                if (data && data.success) {
                    console.log('[保存记录] 记录更新成功');
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
                    
                    // 刷新情绪墙和活动墙
                    this.refreshMoodAndActivityWalls();
                    
                    // 刷新所有页面的数据显示
                    this.refreshAllPages();
                    
                    // 如果在首页且有正在运行的计时器，显示快速情绪记录区域
                    if (window.location.pathname === '/' && window.TimeRecorderConfig && window.TimeRecorderConfig.timerInterval) {
                        const quickEmotionSection = document.getElementById('quickEmotionSection');
                        if (quickEmotionSection) {
                            quickEmotionSection.style.display = 'block';
                        }
                    }
                } else {
                    console.error('[保存记录] 更新记录失败:', data.error || '未知错误');
                    alert('更新记录失败: ' + (data.error || '未知错误'));
                }
            })
            .catch(error => {
                console.error('[保存记录] 更新记录失败:', error);
                alert('更新记录失败，请查看控制台了解详情');
            });
    },
    
    /**
     * 刷新所有页面的数据显示
     */
    refreshAllPages: function() {
        // 刷新当前页面
        this.refreshCurrentPage();
        
        // 尝试刷新其他页面
        this.refreshOtherPages();
    },
    
    /**
     * 刷新当前页面的数据显示
     */
    refreshCurrentPage: function() {
        // 检查当前页面并刷新相应数据
        if (window.location.pathname === '/mood_wall') {
            // 刷新情绪墙页面
            if (typeof loadWallData === 'function') {
                loadWallData();
            }
        } else if (window.location.pathname === '/records') {
            // 刷新历史记录页面
            if (window.timeRecorderRecords && typeof window.timeRecorderRecords.loadRecords === 'function') {
                window.timeRecorderRecords.loadRecords();
            }
        } else if (window.location.pathname === '/') {
            // 刷新首页
            if (window.TimeRecorderUI && typeof window.TimeRecorderUI.loadRecords === 'function') {
                window.TimeRecorderUI.loadRecords();
            }
            if (window.TimeRecorderUI && typeof window.TimeRecorderUI.updateStats === 'function') {
                window.TimeRecorderUI.updateStats();
            }
            // 刷新今日计划模块
            if (window.DailyPlanModule && typeof window.DailyPlanModule.refreshStats === 'function') {
                window.DailyPlanModule.refreshStats();
            }
        } else if (window.location.pathname === '/manage_categories') {
            // 刷新活动类别管理页面
            if (typeof loadActivityCategories === 'function') {
                loadActivityCategories();
            }
        }
    },
    
    /**
     * 尝试刷新其他页面的数据显示
     */
    refreshOtherPages: function() {
        // 通过localStorage或sessionStorage传递刷新信号
        // 使用时间戳确保唯一性
        const refreshSignal = {
            timestamp: Date.now(),
            sourcePage: window.location.pathname
        };
        
        // 存储刷新信号到localStorage
        localStorage.setItem('timeRecorderRefreshSignal', JSON.stringify(refreshSignal));
        
        // 设置一个定时器，在一段时间后清除刷新信号
        setTimeout(() => {
            localStorage.removeItem('timeRecorderRefreshSignal');
        }, 5000);
    },
    
    /**
     * 刷新情绪墙和活动墙
     */
    refreshMoodAndActivityWalls: function() {
        // 检查当前是否在情绪墙页面
        if (window.location.pathname === '/mood_wall') {
            // 重新加载情绪墙数据
            if (typeof loadWallData === 'function') {
                loadWallData();
            }
        }
        
        // 检查当前是否在记录页面
        if (window.location.pathname === '/records') {
            // 重新加载记录数据
            if (window.timeRecorderRecords && typeof window.timeRecorderRecords.loadRecords === 'function') {
                window.timeRecorderRecords.loadRecords();
            }
        }
        
        // 如果在首页，刷新统计信息
        if (window.location.pathname === '/') {
            if (window.TimeRecorderUI && typeof window.TimeRecorderUI.updateStats === 'function') {
                window.TimeRecorderUI.updateStats();
            }
        }
    }
};