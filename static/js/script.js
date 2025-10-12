let currentActivity = '';
let startTime = null;
let elapsedTime = 0;
let timerInterval = null;
let isPaused = false;
let currentRecordId = null; // 用于跟踪当前记录的ID
let records = [];
let expandedRecordId = null; // 用于跟踪当前展开的记录ID
let currentDetailRecordId = null; // 用于跟踪当前详情浮窗的记录ID
let currentUsername = 'default'; // 当前用户名

// 活动类别到CSS类的映射
const activityCategoryClassMap = {
    // 工作输出类 - 蓝色系
    '工作输出': 'btn-work-output',
    
    // 大脑充电类 - 绿色系
    '大脑充电': 'btn-brain-charge',
    
    // 修养生息类 - 紫色系
    '修养生息': 'btn-rest',
    
    // 身体改善类 - 橙色系
    '身体改善': 'btn-body',
    
    // 沟通交流类 - 青色系
    '沟通交流': 'btn-communication',
    
    // 探索新方法类 - 深紫系
    '探索新方法': 'btn-explore',
    
    // 纯属娱乐类 - 粉色系
    '纯属娱乐': 'btn-entertainment',
    
    // 保持学习类 - 蓝绿系
    '保持学习': 'btn-learning',
    
    // 生活计划类 - 黄绿系
    '生活计划': 'btn-planning',
    
    // 规律作息类 - 灰色系
    '规律作息': 'btn-routine'
};

// 获取活动类别对应的CSS类
function getActivityCategoryClass(activityCategory) {
    return activityCategoryClassMap[activityCategory] || 'btn-work-output'; // 默认使用工作输出类颜色
}

// 获取活动对应的CSS类（基于活动类别）
function getActivityClass(activity, activityCategory) {
    if (activityCategory) {
        return getActivityCategoryClass(activityCategory);
    }
    // 如果没有活动类别，使用原来的映射
    const activityClassMap = {
        // 工作输出类 - 蓝色系
        '做调研': 'btn-work-output',
        '梳理方案': 'btn-work-output',
        '执行工作': 'btn-work-output',
        '开会': 'btn-work-output',
        '复盘': 'btn-work-output',
        '探索新方法': 'btn-work-output',
        
        // 大脑充电类 - 绿色系
        '和智者对话': 'btn-brain-charge',
        '玩玩具': 'btn-entertainment',
        
        
        
        // 身体改善类 - 橙色系
        '健身': 'btn-body',
        '创作/写作': 'btn-body',
        
        // 沟通交流类 - 青色系
        '交流心得': 'btn-communication',
        '散步': 'btn-communication',
        '记录|反思|计划': 'btn-communication',
        // 修养生息类 - 紫色系
        '睡觉仪式': 'btn-rest',
        '处理日常': 'btn-rest',
        '进入工作状态': 'btn-rest',
    };
    
    return activityClassMap[activity] || 'btn-work-output'; // 默认使用工作输出类颜色
}

// 情绪选项
const emotionOptions = ['开心', '专注', '疲惫', '焦虑', '兴奋', '平静', '沮丧', '满足', '无聊'];

// 情绪颜色映射
const emotionColorMap = {
    '开心': '#4CAF50',    // 绿色
    '专注': '#2196F3',    // 蓝色
    '疲惫': '#9E9E9E',    // 灰色
    '焦虑': '#FF9800',    // 橙色
    '兴奋': '#E91E63',    // 粉色
    '平静': '#00BCD4',    // 青色
    '沮丧': '#F44336',    // 红色
    '满足': '#8BC34A',    // 黄绿色
    '无聊': '#795548'     // 棕色
};

// 获取情绪颜色
function getEmotionColor(emotion) {
    return emotionColorMap[emotion] || '#607D8B'; // 默认灰色
}

// 解析时间字符串为毫秒数
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

// 检查用户名，没有设置用户名前不能记录活动
function checkUsernameBeforeActivity() {
    if (!currentUsername || currentUsername === 'default') {
        alert('请先设置用户名后再记录活动');
        return false;
    }
    return true;
}

// 更新活动按钮的可用状态
function updateActivityButtonsState() {
    const activityButtons = document.querySelectorAll('.activity-btn');
    if (!currentUsername || currentUsername === 'default') {
        // 未设置用户名，禁用所有活动按钮
        activityButtons.forEach(btn => {
            btn.disabled = true;
            btn.title = '请先设置用户名';
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });
    } else {
        // 已设置用户名，启用所有活动按钮
        activityButtons.forEach(btn => {
            btn.disabled = false;
            btn.title = '';
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });
    }
}

// 设置用户名
function setUsername() {
    const usernameInput = document.getElementById('usernameInput');
    const username = usernameInput.value.trim();
    
    if (!username) {
        alert('请输入用户名');
        return;
    }
    
    // 保存旧用户名
    const oldUsername = currentUsername;
    
    // 调用后端API设置用户名并迁移记录
    fetch('/api/set-username', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            oldUsername: oldUsername
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUsername = username;
            localStorage.setItem('timeRecorderUsername', username);
            
            // 重新加载记录
            loadRecords();
            
            // 更新活动按钮状态
            updateActivityButtonsState();
            
            alert(`用户名已设置为: ${username}`);
        } else {
            alert('设置用户名失败: ' + data.error);
        }
    })
    .catch(error => {
        console.error('设置用户名失败:', error);
        alert('设置用户名失败，请查看控制台了解详情');
    });
}

// 计算时间跨度（结束时间 - 开始时间）
function calculateTimeSpan(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const span = end - start;
    return span;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 设置当前日期显示
    const today = new Date();
    const dateString = today.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    document.getElementById('currentDate').textContent = dateString;
    
    // 初始化用户名
    const savedUsername = localStorage.getItem('timeRecorderUsername');
    if (savedUsername) {
        currentUsername = savedUsername;
        document.getElementById('usernameInput').value = savedUsername;
    }
    
    // 根据用户名状态设置活动按钮的可用性
    updateActivityButtonsState();
    
    // 绑定设置用户名按钮事件
    document.getElementById('setUsernameBtn').addEventListener('click', function() {
        setUsername();
        // 用户名设置后更新活动按钮状态
        setTimeout(updateActivityButtonsState, 100);
    });
    
    // 加载今日记录
    loadRecords();
    
    // 检查是否有从历史记录页面传递的继续活动信息
    checkContinueActivity();
    
    // 绑定活动按钮事件
    document.querySelectorAll('.activity-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // 检查用户名
            if (!checkUsernameBeforeActivity()) {
                return;
            }
            
            document.querySelectorAll('.activity-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentActivity = this.dataset.activity;
            const currentActivityElement = document.getElementById('currentActivity');
            currentActivityElement.textContent = `当前活动：${currentActivity}`;
            // 启用编辑功能
            currentActivityElement.contentEditable = "true";
            currentActivityElement.focus();
        });
    });

    // 绑定当前活动区域的事件
    const currentActivityElement = document.getElementById('currentActivity');
    currentActivityElement.addEventListener('blur', function() {
        // 失去焦点时更新活动名称
        if (currentActivityElement.textContent.startsWith('当前活动：')) {
            currentActivity = currentActivityElement.textContent.replace('当前活动：', '');
        } else {
            currentActivity = currentActivityElement.textContent;
            currentActivityElement.textContent = `当前活动：${currentActivity}`;
        }
    });

    currentActivityElement.addEventListener('keydown', function(e) {
        // 按回车键时保存并失去焦点
        if (e.key === 'Enter') {
            e.preventDefault();
            currentActivityElement.blur();
        }
    });

    // 绑定控制按钮事件
    document.getElementById('toggleBtn').addEventListener('click', toggleTimer);
    document.getElementById('stopBtn').addEventListener('click', stopTimer);
    
    // 点击表格外区域关闭浮窗
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('recordDetailModal');
        if (event.target === modal) {
            closeRecordDetailModal();
        }
    });
});

// 检查是否有从历史记录页面传递的继续活动信息
function checkContinueActivity() {
    const continueActivityData = localStorage.getItem('continueActivity');
    if (continueActivityData) {
        const data = JSON.parse(continueActivityData);
        
        // 设置当前活动
        currentActivity = data.activity;
        const currentActivityElement = document.getElementById('currentActivity');
        currentActivityElement.textContent = `当前活动：${currentActivity}`;
        currentActivityElement.contentEditable = "true";
        
        // 如果有记录ID，保存它
        if (data.recordId) {
            currentRecordId = data.recordId;
        }
        
        // 清除localStorage中的数据
        localStorage.removeItem('continueActivity');
        
        // 如果有备注信息，可以在这里处理
        // 如果有情绪信息，可以在这里处理
    }
}

// 切换计时器（开始/暂停）
function toggleTimer() {
    const toggleBtn = document.getElementById('toggleBtn');
    
    if (!currentActivity) {
        alert('请先选择活动！');
        return;
    }
    
    // 确保当前活动名称是最新的
    const currentActivityElement = document.getElementById('currentActivity');
    if (currentActivityElement.textContent.startsWith('当前活动：')) {
        currentActivity = currentActivityElement.textContent.replace('当前活动：', '');
    } else {
        currentActivity = currentActivityElement.textContent;
    }
    
    if (timerInterval) {
        // 当前正在运行，需要暂停
        clearInterval(timerInterval);
        timerInterval = null;
        isPaused = true;
        toggleBtn.textContent = '继续';
        // 暂停后重新启用编辑
        currentActivityElement.contentEditable = "true";
    } else {
        // 当前已暂停或未开始
        if (isPaused) {
            // 从暂停状态恢复
            isPaused = false;
            startTime = Date.now() - elapsedTime;
            toggleBtn.textContent = '暂停';
            // 继续计时后禁用编辑
            currentActivityElement.contentEditable = "false";
        } else {
            // 首次开始计时或继续计时
            startTime = Date.now();
            // 如果没有elapsedTime（即首次开始计时），则设置为0
            if (elapsedTime === 0 && !currentRecordId) {
                elapsedTime = 0;
            }
            toggleBtn.textContent = '暂停';
            // 开始计时后禁用编辑
            currentActivityElement.contentEditable = "false";
            
            // 创建新记录或更新现有记录
            const record = {
                activity: currentActivity,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(startTime).toISOString(), // 初始结束时间与开始时间相同
                duration: elapsedTime,
                timeSpan: elapsedTime,
                remark: '',
                emotion: '',
                pauseCount: 0
            };
            
            addRecord(record);
        }
        
        timerInterval = setInterval(updateTimer, 1000);
    }
}

// 更新记录表格
function updateRecordsTable() {
    const tbody = document.getElementById('recordsBody');
    tbody.innerHTML = '';
    
    // 按开始时间倒序排列
    const sortedRecords = [...records].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    sortedRecords.forEach((record, index) => {
        const activityClass = getActivityClass(record.activity, record.activityCategory);
        const row = tbody.insertRow();
        
        // 显示简要信息，删除编辑按钮
        row.innerHTML = `
            <td><span class="activity-label ${activityClass}" onclick="showRecordDetail('${record.id}')">${record.activity}</span></td>
            <td>${formatTime(new Date(record.startTime))}</td>
            <td>${formatDuration(record.duration)}</td>
            <td>
                <button class="continue-btn" onclick="continueActivity('${record.id}')">继续</button>
                <button class="delete-btn" onclick="deleteRecord('${record.id}')">删除</button>
            </td>
        `;
    });
}

// 继续选中的活动
function continueActivity(recordId) {
    const record = records.find(r => r.id === recordId);
    if (!record) return;
    
    // 设置当前活动
    currentActivity = record.activity;
    const currentActivityElement = document.getElementById('currentActivity');
    currentActivityElement.textContent = `当前活动：${currentActivity}`;
    currentActivityElement.contentEditable = "true";
    
    // 保存当前记录ID，以便继续更新这个记录
    currentRecordId = recordId;
    
    // 重置计时器状态
    resetTimer();
    
    // 设置开始时间为当前时间
    startTime = Date.now();
    // 如果记录中有segments，则计算累计时间
    let accumulatedTime = 0;
    if (record.segments && record.segments.length > 0) {
        record.segments.forEach(segment => {
            const segmentStart = new Date(segment.start).getTime();
            const segmentEnd = new Date(segment.end).getTime();
            accumulatedTime += (segmentEnd - segmentStart);
        });
    }
    elapsedTime = accumulatedTime;
    
    // 更新计时器显示
    updateTimer();
    
    // 更新按钮状态
    const toggleBtn = document.getElementById('toggleBtn');
    toggleBtn.textContent = '暂停';
    
    // 不再创建新记录，而是继续更新现有记录
    // 更新记录的开始时间
    const updateData = {
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(startTime).toISOString(), // 初始结束时间与开始时间相同
        duration: accumulatedTime,
        timeSpan: accumulatedTime
    };
    
    // 发送到后端更新
    fetch(`/api/records/${recordId}?username=${encodeURIComponent(currentUsername)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 更新本地记录
            const index = records.findIndex(r => r.id === recordId);
            if (index !== -1) {
                records[index] = {...records[index], ...data.record};
            }
            updateRecordsTable();
        } else {
            alert('更新记录失败: ' + data.error);
        }
    })
    .catch(error => {
        console.error('更新记录失败:', error);
        alert('更新记录失败，请查看控制台了解详情');
    });
}

// 更新计时器显示
function updateTimer() {
    elapsedTime = Date.now() - startTime;
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    document.getElementById('timerDisplay').textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 重置计时器
function resetTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    startTime = null;
    elapsedTime = 0;
    isPaused = false;
    // 不清除currentRecordId，因为我们可能需要继续更新这个记录
    // currentRecordId = null;
    
    // 重置显示
    document.getElementById('timerDisplay').textContent = '00:00:00';
    const toggleBtn = document.getElementById('toggleBtn');
    toggleBtn.textContent = '开始';
    toggleBtn.disabled = false;
    
    // 启用编辑
    const currentActivityElement = document.getElementById('currentActivity');
    currentActivityElement.contentEditable = "true";
}

// 停止计时
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // 确保当前活动名称是最新的
    const currentActivityElement = document.getElementById('currentActivity');
    if (currentActivityElement.textContent.startsWith('当前活动：')) {
        currentActivity = currentActivityElement.textContent.replace('当前活动：', '');
    } else {
        currentActivity = currentActivityElement.textContent;
    }
    
    if (currentActivity && elapsedTime > 0) {
        const endTime = Date.now();
        
        // 更新记录的结束时间和时长
        updateRecordEndTime(currentRecordId, endTime);
        
        // 添加段落记录
        addSegmentToRecord(currentRecordId, startTime, endTime);
    }
    
    // 重置
    resetTimer();
}

// 为记录添加段落信息
function addSegmentToRecord(recordId, segmentStart, segmentEnd) {
    if (!recordId) return;
    
    const updateData = {
        segments: {
            start: new Date(segmentStart).toISOString(),
            end: new Date(segmentEnd).toISOString()
        }
    };
    
    // 发送到后端更新
    fetch(`/api/records/${recordId}?username=${encodeURIComponent(currentUsername)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 更新本地记录
            const index = records.findIndex(r => r.id === recordId);
            if (index !== -1) {
                if (!records[index].segments) {
                    records[index].segments = [];
                }
                records[index].segments.push(updateData.segments);
            }
        }
    })
    .catch(error => {
        console.error('更新记录段落信息失败:', error);
    });
}

// 显示记录详情浮窗
function showRecordDetail(recordId) {
    const record = records.find(r => r.id === recordId);
    if (!record) return;
    
    currentDetailRecordId = recordId;
    const activityClass = getActivityClass(record.activity, record.activityCategory);
    
    // 处理情绪显示，添加颜色
    const emotionDisplay = record.emotion ? 
        record.emotion.split(', ').map(e => 
            `<span class="emotion-tag" style="background-color: ${getEmotionColor(e)};">${e}</span>`
        ).join(' ') : '';
    
    // 处理段落信息显示
    let segmentsDisplay = '';
    if (record.segments && record.segments.length > 0) {
        segmentsDisplay = record.segments.map((segment, index) => {
            return `
                <div class="segment-row">
                    <span>段落 ${index + 1}:</span>
                    <span>${formatTime(new Date(segment.start))} - ${formatTime(new Date(segment.end))}</span>
                    <span>(${formatDuration(new Date(segment.end) - new Date(segment.start))})</span>
                </div>
            `;
        }).join('');
    } else {
        segmentsDisplay = '<div class="segment-row">暂无段落记录</div>';
    }
    
    // 构建详情内容
    const detailContent = `
        <form id="recordDetailForm" class="detail-form">
            <label>活动:</label>
            <input type="text" value="${record.activity}" id="detail-activity" class="${activityClass}">
            
            <label>活动类别:</label>
            <select id="detail-activity-category" class="${activityClass}">
                <option value="工作输出" ${record.activityCategory === '工作输出' ? 'selected' : ''}>工作输出</option>
                <option value="大脑充电" ${record.activityCategory === '大脑充电' ? 'selected' : ''}>大脑充电</option>
                <option value="修养生息" ${record.activityCategory === '修养生息' ? 'selected' : ''}>修养生息</option>
                <option value="身体改善" ${record.activityCategory === '身体改善' ? 'selected' : ''}>身体改善</option>
                <option value="沟通交流" ${record.activityCategory === '沟通交流' ? 'selected' : ''}>沟通交流</option>
                <option value="探索新方法" ${record.activityCategory === '探索新方法' ? 'selected' : ''}>探索新方法</option>
                <option value="纯属娱乐" ${record.activityCategory === '纯属娱乐' ? 'selected' : ''}>纯属娱乐</option>
                <option value="保持学习" ${record.activityCategory === '保持学习' ? 'selected' : ''}>保持学习</option>
                <option value="生活计划" ${record.activityCategory === '生活计划' ? 'selected' : ''}>生活计划</option>
                <option value="规律作息" ${record.activityCategory === '规律作息' ? 'selected' : ''}>规律作息</option>
            </select>
            
            <label>开始时间:</label>
            <input type="datetime-local" value="${formatDateTimeForInput(new Date(record.startTime))}" id="detail-start-time">
            
            <label>结束时间:</label>
            <input type="datetime-local" value="${formatDateTimeForInput(new Date(record.endTime))}" id="detail-end-time">
            
            <label>计时时长:</label>
            <div class="duration-edit">
                <input type="text" value="${formatDuration(record.duration)}" id="detail-duration">
                <button type="button" class="save-btn small" onclick="saveDuration('${record.id}')">保存</button>
            </div>
            
            <label>时间跨度:</label>
            <input type="text" value="${formatDuration(record.timeSpan)}" id="detail-time-span" readonly>
            
            <label>备注信息:</label>
            <textarea id="detail-remark">${record.remark || ''}</textarea>
            
            <label>记录情绪:</label>
            <div class="emotion-checkboxes" id="detail-emotion">
                ${emotionOptions.map(emotion => `
                    <div class="emotion-checkbox">
                        <input type="checkbox" id="emotion-${emotion}" value="${emotion}" 
                            ${record.emotion && record.emotion.includes(emotion) ? 'checked' : ''}>
                        <label for="emotion-${emotion}" style="color: ${getEmotionColor(emotion)};">${emotion}</label>
                    </div>
                `).join('')}
            </div>
            
            <label>暂停次数:</label>
            <input type="number" value="${record.pauseCount || 0}" id="detail-pause-count" min="0">
            
            <label>段落记录:</label>
            <div class="segments-display">
                ${segmentsDisplay}
            </div>
            
            <div class="detail-actions">
                <button type="button" class="save-btn" onclick="saveRecordDetail('${record.id}')">保存</button>
                <button type="button" class="cancel-btn" onclick="closeRecordDetailModal()">关闭</button>
            </div>
        </form>
    `;
    
    document.getElementById('recordDetailContent').innerHTML = detailContent;
    document.getElementById('recordDetailModal').style.display = 'block';
    
    // 绑定开始时间和结束时间的更改事件
    document.getElementById('detail-start-time').addEventListener('change', function() {
        updateTimeSpan(recordId);
    });
    
    document.getElementById('detail-end-time').addEventListener('change', function() {
        updateTimeSpan(recordId);
    });
    
    // 绑定活动类别更改事件，更新活动输入框的样式
    document.getElementById('detail-activity-category').addEventListener('change', function() {
        const selectedCategory = this.value;
        const activityClass = getActivityCategoryClass(selectedCategory);
        const activityInput = document.getElementById('detail-activity');
        // 移除所有可能的类别类
        Object.values(activityCategoryClassMap).forEach(cls => {
            activityInput.classList.remove(cls);
        });
        // 添加新的类别类
        activityInput.classList.add(activityClass);
    });
}

// 更新时间跨度
function updateTimeSpan(recordId) {
    const startTimeStr = document.getElementById('detail-start-time').value;
    const endTimeStr = document.getElementById('detail-end-time').value;
    
    if (startTimeStr && endTimeStr) {
        const startDate = new Date(startTimeStr);
        const endDate = new Date(endTimeStr);
        const timeSpan = endDate - startDate;
        
        document.getElementById('detail-time-span').value = formatDuration(timeSpan);
    }
}

// 保存计时时长
function saveDuration(recordId) {
    const durationStr = document.getElementById('detail-duration').value;
    const durationMs = parseDurationString(durationStr);
    
    if (durationMs === null) {
        alert('请输入有效的时间格式（如：1小时30分钟 或 90分钟）');
        return;
    }
    
    // 构造更新数据
    const updateData = {
        duration: durationMs
    };
    
    // 发送到后端更新
    fetch(`/api/records/${recordId}?username=${encodeURIComponent(currentUsername)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 更新本地记录
            const index = records.findIndex(r => r.id === recordId);
            if (index !== -1) {
                records[index] = {...records[index], ...data.record};
            }
            alert('计时时长保存成功');
        } else {
            alert('更新记录失败: ' + data.error);
        }
    })
    .catch(error => {
        console.error('更新记录失败:', error);
        alert('更新记录失败，请查看控制台了解详情');
    });
}

// 保存记录详情
function saveRecordDetail(recordId) {
    const activity = document.getElementById('detail-activity').value;
    const activityCategory = document.getElementById('detail-activity-category').value;
    const startTimeStr = document.getElementById('detail-start-time').value;
    const endTimeStr = document.getElementById('detail-end-time').value;
    const durationStr = document.getElementById('detail-duration').value;
    const remark = document.getElementById('detail-remark').value;
    
    // 获取选中的情绪
    const emotionCheckboxes = document.querySelectorAll('#detail-emotion input[type="checkbox"]:checked');
    const emotions = Array.from(emotionCheckboxes).map(cb => cb.value).join(', ');
    
    const pauseCount = document.getElementById('detail-pause-count').value;
    
    // 构造更新数据
    const updateData = {
        activity: activity,
        activityCategory: activityCategory,
        remark: remark,
        emotion: emotions,
        pauseCount: parseInt(pauseCount) || 0
    };
    
    // 更新时间
    if (startTimeStr && endTimeStr) {
        const startDate = new Date(startTimeStr);
        const endDate = new Date(endTimeStr);
        
        updateData.startTime = startDate.toISOString();
        updateData.endTime = endDate.toISOString();
        
        // 重新计算时间跨度
        const timeSpan = endDate - startDate;
        updateData.timeSpan = timeSpan;
        
        // 如果计时时长也被修改，则使用修改后的值
        const durationMs = parseDurationString(durationStr);
        if (durationMs !== null) {
            updateData.duration = durationMs;
        } else {
            // 否则使用时间跨度作为计时时长
            updateData.duration = timeSpan;
        }
    }
    
    // 发送到后端更新
    fetch(`/api/records/${recordId}?username=${encodeURIComponent(currentUsername)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 更新本地记录
            const index = records.findIndex(r => r.id === recordId);
            if (index !== -1) {
                records[index] = {...records[index], ...data.record};
            }
            closeRecordDetailModal();
            updateRecordsTable();
            updateStats();
        } else {
            alert('更新记录失败: ' + data.error);
        }
    })
    .catch(error => {
        console.error('更新记录失败:', error);
        alert('更新记录失败，请查看控制台了解详情');
    });
}

// 关闭记录详情浮窗
function closeRecordDetailModal() {
    document.getElementById('recordDetailModal').style.display = 'none';
    currentDetailRecordId = null;
}

// 从后端加载记录
function loadRecords() {
    fetch(`/api/records?username=${encodeURIComponent(currentUsername)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                records = data.records;
                // 按开始时间倒序排列
                records.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
                updateRecordsTable();
                updateStats();
            }
        })
        .catch(error => {
            console.error('加载记录失败:', error);
        });
}

// 添加记录到后端
function addRecord(record) {
    // 如果已经有currentRecordId，说明是在继续一个现有记录，不需要创建新记录
    if (currentRecordId) {
        // 更新现有记录
        const updateData = {
            ...record,
            username: currentUsername
        };
        
        // 发送到后端更新
        fetch(`/api/records/${currentRecordId}?username=${encodeURIComponent(currentUsername)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 更新本地记录
                const index = records.findIndex(r => r.id === currentRecordId);
                if (index !== -1) {
                    records[index] = {...records[index], ...data.record};
                }
                updateRecordsTable();
                updateStats();
            } else {
                alert('更新记录失败: ' + data.error);
            }
        })
        .catch(error => {
            console.error('更新记录失败:', error);
            alert('更新记录失败，请查看控制台了解详情');
        });
    } else {
        // 添加用户名到记录中
        const recordWithUsername = {...record, username: currentUsername};
        
        fetch('/api/records', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(recordWithUsername)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                records.push(data.record);
                currentRecordId = data.record.id; // 保存当前记录ID
                updateRecordsTable();
                updateStats();
            } else {
                alert('保存记录失败: ' + data.error);
            }
        })
        .catch(error => {
            console.error('添加记录失败:', error);
            alert('添加记录失败，请查看控制台了解详情');
        });
    }
}

// 更新记录的结束时间
function updateRecordEndTime(recordId, endTime) {
    if (!recordId) return;
    
    const updateData = {
        endTime: new Date(endTime).toISOString(),
        duration: endTime - startTime,
        timeSpan: endTime - startTime
    };
    
    // 发送到后端更新
    fetch(`/api/records/${recordId}?username=${encodeURIComponent(currentUsername)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 更新本地记录
            const index = records.findIndex(r => r.id === recordId);
            if (index !== -1) {
                records[index] = {...records[index], ...data.record};
            }
            updateRecordsTable();
            updateStats();
        } else {
            alert('更新记录失败: ' + data.error);
        }
    })
    .catch(error => {
        console.error('更新记录失败:', error);
        alert('更新记录失败，请查看控制台了解详情');
    });
}

// 删除记录
function deleteRecord(recordId) {
    if (!confirm('确定要删除这条记录吗？')) {
        return;
    }
    
    fetch(`/api/records/${recordId}?username=${encodeURIComponent(currentUsername)}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            records = records.filter(record => record.id !== recordId);
            // 如果删除的是当前记录，重置currentRecordId
            if (currentRecordId === recordId) {
                currentRecordId = null;
            }
            // 如果删除的是详情浮窗的记录，关闭浮窗
            if (currentDetailRecordId === recordId) {
                closeRecordDetailModal();
            }
            updateRecordsTable();
            updateStats();
        } else {
            alert('删除记录失败: ' + data.error);
        }
    })
    .catch(error => {
        console.error('删除记录失败:', error);
        alert('删除记录失败，请查看控制台了解详情');
    });
}

// 取消编辑
function cancelEdit(recordId, originalContent) {
    const tbody = document.getElementById('recordsBody');
    const rows = tbody.getElementsByTagName('tr');
    const rowIndex = records.findIndex(r => r.id === recordId);
    const row = rows[rowIndex];
    row.innerHTML = decodeURIComponent(originalContent);
}

// 更新统计信息
function updateStats() {
    fetch(`/api/stats?username=${encodeURIComponent(currentUsername)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const stats = data.stats;
                document.getElementById('totalTime').textContent = `${stats.totalHours}小时${stats.totalMinutes}分`;
                document.getElementById('activityCount').textContent = `${stats.activityCount}次`;
            }
        })
        .catch(error => {
            console.error('加载统计信息失败:', error);
        });
}

// 格式化时间
function formatTime(date) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

// 格式化日期时间用于输入框
function formatDateTimeForInput(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// 格式化时间为输入框可用格式
function formatTimeForInput(date) {
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 格式化时长
function formatDuration(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}小时${minutes}分钟`;
    } else {
        return `${minutes}分钟${seconds}秒`;
    }
}

// 将时间字符串转换为Date对象
function timeStringToDate(baseDate, timeString) {
    const [hours, minutes] = timeString.split(':');
    const date = new Date(baseDate);
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date;
}