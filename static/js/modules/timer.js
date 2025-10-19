/**
 * 时间记录器计时器模块
 */

import { TimeRecorderFrontendUtils } from './utils.js';
import { TimeRecorderAPI } from './api.js';
import { TimeRecorderUI } from './ui.js';
import { 
    currentActivity, 
    startTime, 
    elapsedTime, 
    timerInterval, 
    currentRecordId, 
    records, 
    setStartTime,
    setElapsedTime,
    setTimerInterval,
    setCurrentRecordId,
    setRecords
} from './config.js';

/**
 * 计时器模块 - 处理计时相关的功能
 */
export const TimeRecorderTimer = {
    /**
     * 保存计时器状态到localStorage
     */
    saveTimerState: function() {
        // 只有在计时器运行时才保存状态
        if (timerInterval) {
            const timerState = {
                currentActivity: currentActivity,
                startTime: startTime,
                elapsedTime: elapsedTime,
                currentRecordId: currentRecordId,
                timestamp: Date.now()
            };
            localStorage.setItem('timeRecorderTimerState', JSON.stringify(timerState));
        } else {
            // 如果计时器没有运行，清除保存的状态
            localStorage.removeItem('timeRecorderTimerState');
        }
    },
    
    /**
     * 从localStorage恢复计时器状态
     */
    restoreTimerState: function() {
        const savedState = localStorage.getItem('timeRecorderTimerState');
        if (savedState) {
            try {
                const timerState = JSON.parse(savedState);
                
                // 检查状态是否过期（超过1小时则认为过期）
                const now = Date.now();
                if (now - timerState.timestamp > 3600000) { // 1小时
                    console.log('计时器状态已过期，清除保存的状态');
                    localStorage.removeItem('timeRecorderTimerState');
                    return false;
                }
                
                // 恢复计时器状态
                setCurrentActivity(timerState.currentActivity);
                setStartTime(timerState.startTime);
                setElapsedTime(timerState.elapsedTime);
                setCurrentRecordId(timerState.currentRecordId);
                
                // 更新UI显示
                const currentActivityElement = document.getElementById('currentActivity');
                if (currentActivityElement) {
                    currentActivityElement.textContent = timerState.currentActivity;
                    currentActivityElement.contentEditable = "false"; // 计时器运行时禁用编辑
                }
                
                const timerDisplay = document.getElementById('timerDisplay');
                if (timerDisplay) {
                    // 更新计时器显示
                    const totalSeconds = Math.floor(timerState.elapsedTime / 1000);
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    const seconds = totalSeconds % 60;
                    timerDisplay.textContent = 
                        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }
                
                // 更新计时器区域样式
                const focusTimerSection = document.getElementById('focusTimerSection');
                if (focusTimerSection) {
                    focusTimerSection.classList.add('running');
                }
                
                // 显示快速情绪记录区域
                const quickEmotionSection = document.getElementById('quickEmotionSection');
                if (quickEmotionSection) {
                    quickEmotionSection.style.display = 'block';
                }
                
                console.log('计时器状态已恢复');
                return true;
            } catch (error) {
                console.error('恢复计时器状态失败:', error);
                localStorage.removeItem('timeRecorderTimerState');
                return false;
            }
        }
        return false;
    },
    
    /**
     * 切换计时器（开始/停止）
     */
    toggleTimer: function() {
        console.log('计时器区域被点击');
        const focusTimerSection = document.getElementById('focusTimerSection');
        const currentActivityElement = document.getElementById('currentActivity');
        
        if (!currentActivityElement) {
            console.error('找不到当前活动元素');
            alert('页面元素缺失，请刷新页面');
            return;
        }
        
        // 获取当前活动名称
        let currentActivityValue = currentActivity;
        if (currentActivityElement.textContent.startsWith('当前活动：')) {
            currentActivityValue = currentActivityElement.textContent.replace('当前活动：', '');
        } else {
            currentActivityValue = currentActivityElement.textContent;
        }
        
        console.log('当前活动:', currentActivityValue);
        
        // 检查是否选择了活动
        if (!currentActivityValue || currentActivityValue === '请选择活动') {
            // 显示更友好的提醒消息
            alert('请先选择或输入活动名称！');
            // 显示活动选择弹窗
            if (window.showActivitySelectionModal) {
                window.showActivitySelectionModal();
            }
            return;
        }
        
        if (timerInterval) {
            // 当前正在运行，停止计时器
            TimeRecorderTimer.stopTimer(); // 调用stopTimer函数处理停止逻辑，避免重复计算
            
            // 停止计时逻辑
            if (currentActivityValue) { // 移除了elapsedTime > 0的检查，确保总是更新记录
                // 使用UTC时间存储，但显示时转换为北京时间
                const endTime = new Date().getTime();
                
                // 更新记录的结束时间和时长
                if (currentRecordId) {
                    // 根据新定义更新数据
                    const recordIndex = records.findIndex(r => r && r.id === currentRecordId);
                    if (recordIndex !== -1) {
                        const record = records[recordIndex];
                        
                        // 根据data_definition.md规范更新数据
                        const updateData = {
                            // endTime为最后一个segments的end时间
                            endTime: new Date(endTime).toISOString(),
                            // 更新最后一个段落的结束时间
                            segments: {
                                index: record.segments && Array.isArray(record.segments) ? record.segments.length - 1 : 0,
                                end: new Date(endTime).toISOString()
                            }
                        };
                        
                        // duration记录所有segments累计的时间
                        if (record.segments && Array.isArray(record.segments) && record.segments.length > 0) {
                            // 使用工具类计算所有段落的总时间
                            updateData.duration = TimeRecorderFrontendUtils.calculateSegmentsTotalTime(record.segments);
                        }
                        
                        // timeSpan记录的是第一个段落的start到最后一个段落的end的时间跨度
                        if (record.segments && Array.isArray(record.segments) && record.segments.length > 0) {
                            const firstSegmentStart = new Date(record.segments[0].start).getTime();
                            updateData.timeSpan = endTime - firstSegmentStart;
                        }
                        
                        // 发送到后端更新
                        TimeRecorderAPI.updateRecord(currentRecordId, updateData)
                            .then(data => {
                                if (data && data.success) {
                                    // 更新本地记录
                                    records[recordIndex] = {...records[recordIndex], ...data.record};
                                    TimeRecorderUI.updateRecordsTable();
                                    TimeRecorderUI.updateStats();
                                    
                                    // 同步当前记录到飞书
                                    this.syncRecordToFeishu(currentRecordId);
                                } else {
                                    alert('更新记录失败: ' + (data.error || '未知错误'));
                                }
                            })
                            .catch(error => {
                                console.error('更新记录失败:', error);
                                alert('更新记录失败，请查看控制台了解详情');
                            });
                    }
                } else {
                    // 添加新记录
                    // 根据规范，创建新记录时startTime是第一个segments的start时间且唯一不可修改
                    // endTime为最后一个segments的end时间
                    // 使用UTC时间创建Date对象
                    const utcStartTime = new Date(startTime);
                    const utcEndTime = new Date(endTime);
                                        
                    const record = {
                        activity: currentActivityValue,
                        startTime: utcStartTime.toISOString(), // startTime是第一个segments的start时间
                        endTime: utcEndTime.toISOString(), // endTime为最后一个segments的end时间
                        // duration记录所有segments累计的时间
                        duration: elapsedTime,
                        // timeSpan记录从第一个段落的start到最后一个段落的end的时间跨度
                        timeSpan: utcEndTime - utcStartTime,
                        remark: '',
                        emotion: '',
                        // pauseCount记录segments的个数
                        pauseCount: 1,
                        segments: [{
                            start: utcStartTime.toISOString(),
                            end: utcEndTime.toISOString()
                        }]
                    };
                    
                    TimeRecorderTimer.addRecord(record);
                }
            }
            
            // 更新计时器区域样式
            if (focusTimerSection) {
                focusTimerSection.classList.remove('running');
            }
            // 停止后重新启用编辑
            currentActivityElement.contentEditable = "true";
        } else {
            // 开始计时
            // 使用UTC时间存储
            setStartTime(new Date().getTime());
            // 如果没有elapsedTime（即首次开始计时），则设置为0
            if (elapsedTime === 0 && !currentRecordId) {
                setElapsedTime(0);
            }
            // 开始计时后禁用编辑
            currentActivityElement.contentEditable = "false";
            
            // 更新计时器区域样式
            if (focusTimerSection) {
                focusTimerSection.classList.add('running');
            }
            
            // 显示快速情绪记录区域
            const quickEmotionSection = document.getElementById('quickEmotionSection');
            if (quickEmotionSection) {
                quickEmotionSection.style.display = 'block';
            }
            
            // 创建新记录或更新现有记录
            // 使用UTC时间创建Date对象
            const utcStartTime = new Date(startTime);
            
            const record = {
                activity: currentActivityValue,
                startTime: utcStartTime.toISOString(),
                endTime: utcStartTime.toISOString(), // 初始结束时间与开始时间相同
                duration: 0, // 初始duration为0，会在停止时更新
                timeSpan: 0, // 初始timeSpan为0，会在停止时更新
                remark: '',
                emotion: '',
                // pauseCount记录segments的个数
                pauseCount: currentRecordId ? (records.find(r => r && r.id === currentRecordId)?.segments?.length || 0) + 1 : 1
            };
            
            // 如果是创建新记录，初始化segments数组
            if (!currentRecordId) {
                // 使用UTC时间创建Date对象
                const utcStartTime = new Date(startTime);
                record.segments = [{
                    start: utcStartTime.toISOString(),
                    end: utcStartTime.toISOString() // 初始结束时间与开始时间相同
                }];
            }
            
            // 如果是继续现有记录，添加新的段落
            if (currentRecordId) {
                // 使用UTC时间创建Date对象
                const utcStartTime = new Date(startTime);
                record.segments = {
                    start: utcStartTime.toISOString(),
                    end: utcStartTime.toISOString()
                };
                
                // 更新现有记录
                TimeRecorderAPI.updateRecord(currentRecordId, record)
                    .then(data => {
                        if (data && data.success) {
                            // 更新本地记录
                            const index = records.findIndex(r => r && r.id === currentRecordId);
                            if (index !== -1) {
                                records[index] = {...records[index], ...data.record};
                            }
                            TimeRecorderUI.updateRecordsTable();
                        } else {
                            alert('更新记录失败: ' + (data.error || '未知错误'));
                        }
                    })
                    .catch(error => {
                        console.error('更新记录失败:', error);
                        alert('更新记录失败，请查看控制台了解详情');
                    });
            } else {
                // 创建新记录
                TimeRecorderTimer.addRecord(record);
            }
            
            setTimerInterval(setInterval(TimeRecorderTimer.updateTimer, 1000));
        }
        
        // 保存计时器状态
        TimeRecorderTimer.saveTimerState();
    },
    
    /**
     * 更新计时器显示
     */
    updateTimer: function() {
        // 使用UTC时间存储，但显示时转换为北京时间
        const now = new Date().getTime();
        setElapsedTime(now - startTime);
        const totalSeconds = Math.floor(elapsedTime / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            timerDisplay.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // 同步更新表格中的计时时长
        // 直接更新表格显示，因为计算逻辑已在工具类中处理
        TimeRecorderUI.updateRecordsTable();
        
        // 定期保存计时器状态（每10秒保存一次）
        if (Math.floor(totalSeconds) % 10 === 0) {
            TimeRecorderTimer.saveTimerState();
        }
    },
    
    /**
     * 重置计时器
     */
    resetTimer: function() {
        if (timerInterval) {
            clearInterval(timerInterval);
            setTimerInterval(null);
        }
        setStartTime(null);
        setElapsedTime(0);
        // 不清除currentRecordId，因为我们可能需要继续更新这个记录
        // setCurrentRecordId(null);
        
        // 重置显示
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            timerDisplay.textContent = '00:00:00';
        }
        
        // 更新计时器区域样式
        const focusTimerSection = document.getElementById('focusTimerSection');
        if (focusTimerSection) {
            focusTimerSection.classList.remove('running');
        }
        
        // 启用编辑
        const currentActivityElement = document.getElementById('currentActivity');
        if (currentActivityElement) {
            currentActivityElement.contentEditable = "true";
        }
        
        // 清除保存的计时器状态
        localStorage.removeItem('timeRecorderTimerState');
    },
    
    /**
     * 停止计时
     */
    stopTimer: function() {
        // 注意：根据data_definition.md规范，stopTimer函数现在只负责清理计时器和重置UI
        // 实际的时间更新逻辑已经在toggleTimer函数中处理，避免重复计算
        
        if (timerInterval) {
            clearInterval(timerInterval);
            setTimerInterval(null);
        }
        
        // 重置计时器状态
        TimeRecorderTimer.resetTimer();
        
        // 更新计时器区域样式
        const focusTimerSection = document.getElementById('focusTimerSection');
        if (focusTimerSection) {
            focusTimerSection.classList.remove('running');
        }
        
        // 隐藏快速情绪记录区域
        const quickEmotionSection = document.getElementById('quickEmotionSection');
        if (quickEmotionSection) {
            quickEmotionSection.style.display = 'none';
        }
        
        // 重新启用活动名称编辑
        const currentActivityElement = document.getElementById('currentActivity');
        if (currentActivityElement) {
            currentActivityElement.contentEditable = "true";
        }
    },
    
    /**
     * 同步记录到飞书
     */
    syncRecordToFeishu: function(recordId) {
        // 检查是否配置了飞书
        fetch('/api/feishu/config')
            .then(response => response.json())
            .then(data => {
                if (data && data.config && data.config.app_id) {
                    // 如果已配置飞书，则同步当前记录到飞书
                    console.log('[飞书同步] 开始同步记录到飞书，记录ID:', recordId);
                    
                    // 获取记录详情
                    return TimeRecorderAPI.getRecord(recordId);
                }
            })
            .then(data => {
                if (data && data.success) {
                    // 发送到飞书多维表格
                    console.log('[飞书同步] 发送记录到飞书多维表格');
                    return fetch('/api/feishu/import-records', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ records: [data.record] })
                    });
                }
            })
            .then(response => {
                if (response) {
                    console.log('[飞书同步] 飞书导入记录API响应状态:', response.status);
                    return response.json();
                }
            })
            .then(data => {
                if (data && data.success) {
                    console.log('[飞书同步] 记录同步到飞书成功!');
                } else if (data) {
                    console.error('[飞书同步] 记录同步到飞书失败:', data.error);
                }
            })
            .catch(error => {
                console.error('[飞书同步] 同步记录到飞书失败:', error);
            });
    },
    
    /**
     * 添加记录到后端
     */
    addRecord: function(record) {
        // 检查参数有效性
        if (!record) {
            console.error('添加记录失败：记录数据为空');
            alert('添加记录失败：记录数据为空');
            return;
        }
        
        // 确保记录包含活动类别
        if (!record.activityCategory) {
            // 从当前活动元素的data-category属性获取类别
            const currentActivityElement = document.getElementById('currentActivity');
            if (currentActivityElement) {
                const categoryFromElement = currentActivityElement.getAttribute('data-category');
                if (categoryFromElement) {
                    record.activityCategory = categoryFromElement;
                }
            }
        }
        
        // 如果已经有currentRecordId，说明是在继续一个现有记录，不需要创建新记录
        // 但在toggleTimer函数中，如果是创建新记录，currentRecordId应该是null
        if (currentRecordId && Array.isArray(records) && records.some(r => r && r.id === currentRecordId)) {
            // 更新现有记录
            const updateData = {
                ...record,
                username: window.TimeRecorderConfig && window.TimeRecorderConfig.currentUsername
            };
            
            // 发送到后端更新
            TimeRecorderAPI.updateRecord(currentRecordId, updateData)
                .then(data => {
                    if (data && data.success) {
                        // 更新本地记录
                        const index = records.findIndex(r => r && r.id === currentRecordId);
                        if (index !== -1) {
                            records[index] = {...records[index], ...data.record};
                        }
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
        } else {
            TimeRecorderAPI.addRecord(record)
                .then(data => {
                    if (data && data.success) {
                        if (Array.isArray(records)) {
                            records.push(data.record);
                        }
                        setCurrentRecordId(data.record.id); // 保存当前记录ID
                        TimeRecorderUI.updateRecordsTable();
                        TimeRecorderUI.updateStats();
                        
                        // 同步新创建的记录到飞书
                        this.syncRecordToFeishu(data.record.id);
                    } else {
                        alert('保存记录失败: ' + (data.error || '未知错误'));
                    }
                })
                .catch(error => {
                    console.error('添加记录失败:', error);
                    alert('添加记录失败，请查看控制台了解详情');
                });
        }
    }
};