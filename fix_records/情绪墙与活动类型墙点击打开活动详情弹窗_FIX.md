# 情绪墙与活动类型墙点击打开活动详情弹窗修复记录

## 问题描述
用户反馈在情绪墙与活动类型墙中点击方块时，应该打开对应活动的详情弹窗，而不是跳转到其他页面。

## 修复方案
1. 在情绪墙与活动类型墙页面添加活动详情弹窗
2. 修改方块点击事件，使其打开活动详情弹窗而非跳转页面
3. 实现活动详情弹窗的显示逻辑
4. 添加相应的CSS样式美化弹窗界面

## 修改内容

### 1. 修改情绪墙与活动类型墙页面HTML模板
文件：`/templates/mood_wall.html`

添加活动详情弹窗：
```html
<!-- 活动详情浮窗 -->
<div id="recordDetailModal" class="modal" style="display: none;">
    <div class="modal-content">
        <span class="close" onclick="closeRecordDetailModal()">&times;</span>
        <h2>活动详情</h2>
        <div id="recordDetailContent"></div>
    </div>
</div>
```

修改方块点击事件处理函数：
```javascript
// 渲染情绪墙
function renderMoodWall(moodData) {
    
    // 渲染当天的情绪方块
    dayMoods.forEach((mood, index) => {
        
        // 添加点击事件打开活动详情页
        moodBox.addEventListener('click', () => {
            // 查找匹配的情绪记录
            findAndShowMoodDetail(mood.name, mood.date, index);
        });
        
        moodsContainer.appendChild(moodBox);
    });
    
}

// 渲染活动类型墙
function renderActivityWall(activityData) {
    
    // 渲染当天的活动方块
    dayActivities.forEach((activity, index) => {
        
        // 添加点击事件打开活动详情页
        activityBox.addEventListener('click', () => {
            // 查找匹配的活动记录
            findAndShowActivityDetail(activity.name, activity.date, index);
        });
        
        activitiesContainer.appendChild(activityBox);
    });
    
}
```

修改查找和显示详情函数：
```javascript
// 查找并显示活动详情
function findAndShowActivityDetail(activityName, dateStr, index) {
    // 构造查询参数
    const params = new URLSearchParams();
    params.append('username', currentUsername);
    params.append('date_from', dateStr);
    params.append('date_to', dateStr);
    params.append('page', 1);
    params.append('per_page', 50); // 增加数量以确保能找到匹配的记录
    
    console.log('查找活动详情:', {activityName, dateStr, username: currentUsername});
    
    // 获取匹配的记录
    fetch(`/api/all-records?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            console.log('API响应:', data);
            if (data.success && data.records && data.records.length > 0) {
                // 在返回的记录中查找匹配活动名称的记录
                // 使用index来选择第几个匹配的记录
                let matchingRecords = data.records.filter(record => 
                    record.activityCategory === activityName || record.activity.includes(activityName)
                );
                
                if (matchingRecords.length > 0) {
                    // 如果有多个匹配记录，使用index来选择
                    const recordIndex = index % matchingRecords.length;
                    showRecordDetail(matchingRecords[recordIndex]);
                } else {
                    // 如果没有精确匹配，尝试模糊匹配
                    matchingRecords = data.records.filter(record => 
                        record.activity.includes(activityName)
                    );
                    
                    if (matchingRecords.length > 0) {
                        const recordIndex = index % matchingRecords.length;
                        showRecordDetail(matchingRecords[recordIndex]);
                    } else {
                        alert(`未找到匹配的活动记录\n活动: ${activityName}\n日期: ${dateStr}`);
                    }
                }
            } else {
                alert(`未找到匹配的活动记录\n活动: ${activityName}\n日期: ${dateStr}`);
            }
        })
        .catch(error => {
            console.error('加载记录详情失败:', error);
            alert('加载记录详情失败，请查看控制台了解详情');
        });
}

// 查找并显示情绪详情
function findAndShowMoodDetail(moodName, dateStr, index) {
    // 构造查询参数
    const params = new URLSearchParams();
    params.append('username', currentUsername);
    params.append('date_from', dateStr);
    params.append('date_to', dateStr);
    params.append('page', 1);
    params.append('per_page', 50);
    
    console.log('查找情绪详情:', {moodName, dateStr, username: currentUsername});
    
    // 获取匹配的记录
    fetch(`/api/all-records?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            console.log('API响应:', data);
            if (data.success && data.records && data.records.length > 0) {
                // 在返回的记录中查找包含指定情绪的记录
                // 使用index来选择第几个匹配的记录
                let matchingRecords = data.records.filter(record => 
                    record.emotion && record.emotion.includes(moodName)
                );
                
                if (matchingRecords.length > 0) {
                    // 如果有多个匹配记录，使用index来选择
                    const recordIndex = index % matchingRecords.length;
                    showRecordDetail(matchingRecords[recordIndex]);
                } else {
                    alert(`未找到匹配的情绪记录\n情绪: ${moodName}\n日期: ${dateStr}`);
                }
            } else {
                alert(`未找到匹配的情绪记录\n情绪: ${moodName}\n日期: ${dateStr}`);
            }
        })
        .catch(error => {
            console.error('加载记录详情失败:', error);
            alert('加载记录详情失败，请查看控制台了解详情');
        });
}

// 显示记录详情
function showRecordDetail(record) {
    const modal = document.getElementById('recordDetailModal');
    const content = document.getElementById('recordDetailContent');
    
    if (!modal || !content) {
        console.error('找不到模态框元素');
        return;
    }
    
    // 计算总时长
    const totalDuration = (record && record.duration) || 0;
    
    // 处理情绪显示，添加颜色
    let emotionDisplay = '';
    if (record.emotion) {
        const emotions = record.emotion.split(', ');
        emotionDisplay = emotions.map(e => {
            const span = document.createElement('span');
            span.className = 'emotion-tag';
            span.style.backgroundColor = getEmotionColor(e);
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
                    <div class="segment-row">
                        <span>段落 ${segment.index + 1}:</span>
                        <span>${formatTime(segment.start)} - ${formatTime(segment.end)}</span>
                        <span>(${formatDuration(segment.duration)})</span>
                    </div>
                `;
            }).join('');
            
            // 添加段落统计信息
            const totalSegmentDuration = segmentDetails.reduce((total, segment) => total + segment.duration, 0);
            segmentsDisplay += `
                <div class="segment-summary">
                    <p>段落数量: ${segmentDetails.length}</p>
                    <p>段落总时长: ${formatDuration(totalSegmentDuration)}</p>
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
        <div class="detail-section highlight-section">
            <h3>记录收获</h3>
            <div class="highlight-field important-field">
                ${record.remark || '暂无收获记录'}
            </div>
        </div>
        
        <div class="detail-section highlight-section">
            <h3>核心信息</h3>
            <div class="highlight-field important-field">
                <label>活动名称:</label>
                <span>${record.activity || ''}</span>
            </div>
            
            <div class="highlight-field">
                <label>活动类别:</label>
                <span>${record.activityCategory || '未分类'}</span>
            </div>
            
            <div class="highlight-field">
                <label>记录日期:</label>
                <span>${record.date || (record.startTime ? record.startTime.substring(0, 10).replace(/-/g, '/') : '')}</span>
            </div>
        </div>
        
        <div class="detail-section highlight-section">
            <h3>时间信息</h3>
            <div class="highlight-field">
                <label>开始时间:</label>
                <span>${record.startTime ? formatTime(new Date(record.startTime)) : ''}</span>
            </div>
            
            <div class="highlight-field">
                <label>结束时间:</label>
                <span>${record.endTime ? formatTime(new Date(record.endTime)) : ''}</span>
            </div>
            
            <div class="highlight-field">
                <label>时间跨度:</label>
                <span>${record.timeSpan ? formatDuration(record.timeSpan) : '0分钟0秒'}</span>
            </div>
            
            <div class="highlight-field important-field">
                <label>计时时长:</label>
                <span>${formatDuration(totalDuration)}</span>
            </div>
            
            <div class="highlight-field important-field">
                <label>暂停次数:</label>
                <span>${record.pauseCount || 0}</span>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>记录情绪</h3>
            <div class="highlight-field">
                <label>情绪:</label>
                <span>${emotionDisplay || '无'}</span>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>段落详情</h3>
            <div class="segments-display">
                ${segmentsDisplay}
            </div>
        </div>
        
        <div class="detail-actions">
            <button type="button" class="cancel-btn" onclick="closeRecordDetailModal()">关闭</button>
        </div>
    `;
    
    content.innerHTML = detailContent;
    modal.style.display = 'block';
    
    // 添加键盘事件监听器，支持ESC键关闭模态框
    document.addEventListener('keydown', handleKeyDown);
}

// 关闭记录详情浮窗
function closeRecordDetailModal() {
    const modal = document.getElementById('recordDetailModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // 移除键盘事件监听器
    document.removeEventListener('keydown', handleKeyDown);
}

// 处理键盘事件
function handleKeyDown(event) {
    // ESC键关闭模态框
    if (event && event.key === 'Escape') {
        closeRecordDetailModal();
    }
}
```

### 2. 添加CSS样式
文件：`/static/css/modules/mood-wall.css`

添加活动详情弹窗样式：
```css
/* 活动详情浮窗样式 */
.modal {
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal-content {
    background-color: white;
    border-radius: 12px;
    padding: 25px;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 8px 30px rgba(0,0,0,0.2);
    animation: modalAppear 0.3s ease-out;
}

@keyframes modalAppear {
    from {
        opacity: 0;
        transform: translateY(-50px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.modal-content .close {
    position: absolute;
    right: 20px;
    top: 20px;
    font-size: 32px;
    font-weight: bold;
    cursor: pointer;
    color: #aaa;
    transition: all 0.3s ease;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.modal-content .close:hover {
    color: #000;
    background-color: #f0f0f0;
    transform: scale(1.1);
}

.modal-content h2 {
    margin-top: 0;
    margin-bottom: 25px;
    text-align: center;
    color: #333;
    border-bottom: 2px solid #007bff;
    padding-bottom: 15px;
    font-size: 1.8rem;
}

.detail-section {
    margin-bottom: 25px;
    padding: 20px;
    border-radius: 10px;
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    transition: all 0.3s ease;
}

.detail-section:hover {
    background: #e9ecef;
    transform: translateX(5px);
}

.detail-section h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #333;
    border-bottom: 1px solid #dee2e6;
    padding-bottom: 10px;
    font-size: 1.3rem;
}

.highlight-section {
    background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
    border-left: 4px solid #007bff;
    box-shadow: 0 4px 10px rgba(0, 123, 255, 0.1);
}

.highlight-section:hover {
    box-shadow: 0 6px 15px rgba(0, 123, 255, 0.2);
}

.highlight-field {
    margin-bottom: 15px;
    padding: 12px;
    background: white;
    border-radius: 6px;
    border: 1px solid #dee2e6;
    transition: all 0.3s ease;
}

.highlight-field:hover {
    border-color: #007bff;
    box-shadow: 0 2px 5px rgba(0, 123, 255, 0.1);
}

.highlight-field label {
    font-weight: bold;
    display: inline-block;
    width: 100px;
    color: #555;
    font-size: 15px;
}

.highlight-field span {
    color: #333;
    font-size: 15px;
}

.important-field {
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    border-left: 3px solid #2196F3;
}

.important-field label {
    color: #0d47a1;
}

.important-field span {
    color: #0d47a1;
    font-weight: 500;
}

.segment-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px dashed #dee2e6;
}

.segment-row:last-child {
    border-bottom: none;
}

.segment-summary {
    margin-top: 15px;
    padding: 15px;
    background: #e3f2fd;
    border-radius: 6px;
    border-left: 3px solid #2196F3;
}

.emotion-tag {
    display: inline-block;
    padding: 5px 10px;
    border-radius: 15px;
    color: white;
    font-size: 14px;
    font-weight: 500;
    margin-right: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.detail-actions {
    text-align: center;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #eee;
}

.cancel-btn {
    background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
    color: white;
    border: none;
    padding: 12px 25px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 17px;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
    display: inline-flex;
    align-items: center;
    gap: 10px;
}

.cancel-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(108, 117, 125, 0.4);
}

.cancel-btn:active {
    transform: translateY(-1px);
}

.cancel-btn::before {
    content: '✕';
    font-size: 20px;
}
```

## 效果
- 点击情绪墙与活动类型墙中的方块时，会打开活动详情弹窗
- 弹窗显示活动的详细信息，包括活动名称、时间、时长、备注、情绪等
- 弹窗界面美观，符合整体设计风格
- 支持ESC键关闭弹窗
- 用户可以方便地查看活动详情，无需跳转到其他页面
- 提升了用户体验和页面交互的便利性