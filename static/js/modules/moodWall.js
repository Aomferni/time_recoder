import { TimeRecorderFrontendUtils } from './utils.js';
import { TimeRecorderAPI } from './api.js';
import { TimeRecorderRecordDetail } from './recordDetail.js';
import { TimeRecorderLogger } from './logger.js';

// 将模块暴露到全局作用域
window.TimeRecorderFrontendUtils = TimeRecorderFrontendUtils;
window.TimeRecorderAPI = TimeRecorderAPI;
window.TimeRecorderRecordDetail = TimeRecorderRecordDetail;

// 加载墙数据
async function loadWallData() {
    TimeRecorderLogger.info('MoodWall', '开始加载墙数据');
    try {
        // 使用正确的API端点
        const response = await fetch('/api/mood-wall');
        const data = await response.json();
        
        if (data.success) {
            TimeRecorderLogger.info('MoodWall', '墙数据加载成功', data);
            renderMoodWall(data.moodData);
            renderActivityWall(data.activityData);
            renderKeywordCloud(data.keywordData);
            renderLegends(data.moodLegend, data.activityLegend);
        } else {
            TimeRecorderLogger.error('MoodWall', '加载墙数据失败', data.error);
            console.error('加载墙数据失败:', data.error);
        }
    } catch (error) {
        TimeRecorderLogger.error('MoodWall', '加载墙数据异常', error);
        console.error('加载墙数据失败:', error);
    }
}

// 渲染情绪墙
function renderMoodWall(moodData) {
    TimeRecorderLogger.info('MoodWall', '开始渲染情绪墙', { moodDataCount: moodData ? moodData.length : 0 });
    const moodWall = document.getElementById('moodWall');
    moodWall.innerHTML = '';
    
    if (!moodData || moodData.length === 0) {
        moodWall.innerHTML = '<div class="no-data">暂无情绪数据</div>';
        TimeRecorderLogger.info('MoodWall', '情绪数据为空');
        return;
    }
    
    // 生成最近7天的日期列表
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.getFullYear() + '/' + 
                       String(date.getMonth() + 1).padStart(2, '0') + '/' + 
                       String(date.getDate()).padStart(2, '0');
        dates.push(dateStr);
    }
    
    dates.forEach(date => {
        const dateElement = document.createElement('div');
        dateElement.className = 'wall-day';
        
        const dateHeader = document.createElement('div');
        dateHeader.className = 'day-header';
        dateHeader.textContent = date;
        dateElement.appendChild(dateHeader);
        
        const emotionsContainer = document.createElement('div');
        emotionsContainer.className = 'emotions-container';
        
        // 为每一天创建情绪方块
        let hasEmotions = false;
        moodData.forEach(emotion => {
            const dayData = emotion.days.find(d => d.date === date);
            if (dayData && dayData.count > 0) {
                hasEmotions = true;
                // 为每个情绪记录创建一个方块
                for (let i = 0; i < dayData.count; i++) {
                    const emotionElement = document.createElement('div');
                    emotionElement.className = 'emotion-box';
                    emotionElement.style.backgroundColor = emotion.color;
                    
                    // 根据时长设置透明度，时长越短透明度越高
                    // 时长达到1小时，透明度为100%，0秒的透明度为50%
                    const duration = dayData.durations && dayData.durations[i] ? dayData.durations[i] : 0;
                    const maxDuration = 3600000; // 1小时为最大值
                    const opacity = Math.max(0.5, Math.min(1, duration / maxDuration));
                    emotionElement.style.opacity = opacity;
                    
                    // 显示情绪文本
                    const emotionText = document.createElement('div');
                    emotionText.className = 'emotion-text';
                    emotionText.textContent = emotion.name;
                    emotionElement.appendChild(emotionText);
                    
                    // 鼠标悬停时显示活动名称和时长
                    const activityName = dayData.activities && dayData.activities[i] ? dayData.activities[i] : '未知活动';
                    const durationText = TimeRecorderFrontendUtils.formatDuration(duration);
                    emotionElement.title = `${emotion.name}\n${activityName}\n时长: ${durationText}`;
                    
                    // 添加点击事件打开记录详情
                    if (dayData.record_ids && dayData.record_ids[i]) {
                        emotionElement.addEventListener('click', () => {
                            TimeRecorderRecordDetail.showRecordDetail(dayData.record_ids[i]);
                        });
                    }
                    
                    emotionsContainer.appendChild(emotionElement);
                }
            }
        });
        
        // 如果这一天没有情绪记录，显示提示信息
        if (!hasEmotions) {
            const noDataElement = document.createElement('div');
            noDataElement.className = 'no-data';
            noDataElement.textContent = '无记录';
            noDataElement.style.fontSize = '12px';
            noDataElement.style.color = '#999';
            noDataElement.style.fontStyle = 'italic';
            emotionsContainer.appendChild(noDataElement);
        }
        
        dateElement.appendChild(emotionsContainer);
        moodWall.appendChild(dateElement);
    });
}

// 渲染活动类型墙
function renderActivityWall(activityData) {
    TimeRecorderLogger.info('MoodWall', '开始渲染活动类型墙', { activityDataCount: activityData ? activityData.length : 0 });
    const activityWall = document.getElementById('activityWall');
    activityWall.innerHTML = '';
    
    if (!activityData || activityData.length === 0) {
        activityWall.innerHTML = '<div class="no-data">暂无活动数据</div>';
        TimeRecorderLogger.info('MoodWall', '活动数据为空');
        return;
    }
    
    // 生成最近7天的日期列表
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.getFullYear() + '/' + 
                       String(date.getMonth() + 1).padStart(2, '0') + '/' + 
                       String(date.getDate()).padStart(2, '0');
        dates.push(dateStr);
    }
    
    dates.forEach(date => {
        const dateElement = document.createElement('div');
        dateElement.className = 'wall-day';
        
        const dateHeader = document.createElement('div');
        dateHeader.className = 'day-header';
        dateHeader.textContent = date;
        dateElement.appendChild(dateHeader);
        
        const activitiesContainer = document.createElement('div');
        activitiesContainer.className = 'activities-container';
        
        // 为每一天创建活动方块
        let hasActivities = false;
        activityData.forEach(category => {
            TimeRecorderLogger.debug('MoodWall', '处理活动类别', { categoryName: category.name, color: category.color });
            const dayData = category.days.find(d => d.date === date);
            if (dayData && dayData.count > 0) {
                hasActivities = true;
                // 为每个活动记录创建一个方块
                for (let i = 0; i < dayData.count; i++) {
                    const activityElement = document.createElement('div');
                    activityElement.className = 'activity-box';
                    activityElement.style.backgroundColor = category.color;
                    TimeRecorderLogger.debug('MoodWall', '设置活动方块背景色', { color: category.color });
                    
                    // 根据时长设置透明度，时长越短透明度越高
                    // 时长达到1小时，透明度为100%，0秒的透明度为50%
                    const duration = dayData.durations && dayData.durations[i] ? dayData.durations[i] : 0;
                    const maxDuration = 3600000; // 1小时为最大值
                    const opacity = Math.max(0.5, Math.min(1, duration / maxDuration));
                    activityElement.style.opacity = opacity;
                    
                    // 显示活动类别文本（使用activity_categories数组中的值）
                    const activityCategory = dayData.activity_categories && dayData.activity_categories[i] ? 
                        dayData.activity_categories[i] : '未知类别';
                    const categoryText = document.createElement('div');
                    categoryText.className = 'activity-text';
                    categoryText.textContent = activityCategory;
                    activityElement.appendChild(categoryText);
                    
                    // 鼠标悬停时显示活动名称和时长
                    const activityName = dayData.activities && dayData.activities[i] ? dayData.activities[i] : '未知活动';
                    const durationText = TimeRecorderFrontendUtils.formatDuration(duration);
                    activityElement.title = `${activityCategory}\n${activityName}\n时长: ${durationText}`;
                    
                    // 添加点击事件打开记录详情
                    if (dayData.record_ids && dayData.record_ids[i]) {
                        activityElement.addEventListener('click', () => {
                            TimeRecorderRecordDetail.showRecordDetail(dayData.record_ids[i]);
                        });
                    }
                    
                    activitiesContainer.appendChild(activityElement);
                }
            }
        });
        
        // 如果这一天没有活动记录，显示提示信息
        if (!hasActivities) {
            const noDataElement = document.createElement('div');
            noDataElement.className = 'no-data';
            noDataElement.textContent = '无记录';
            noDataElement.style.fontSize = '12px';
            noDataElement.style.color = '#999';
            noDataElement.style.fontStyle = 'italic';
            activitiesContainer.appendChild(noDataElement);
        }
        
        dateElement.appendChild(activitiesContainer);
        activityWall.appendChild(dateElement);
    });
}

// 渲染关键词词云
function renderKeywordCloud(keywordData) {
    const keywordCloud = document.getElementById('keywordCloud');
    keywordCloud.innerHTML = '';
    
    if (!keywordData || keywordData.length === 0) {
        keywordCloud.innerHTML = '<div class="no-data">暂无关键词数据</div>';
        return;
    }
    
    // 按频率排序，取前30个关键词
    const sortedKeywords = keywordData
        .sort((a, b) => b.count - a.count)
        .slice(0, 30);
    
    const maxCount = sortedKeywords.length > 0 ? sortedKeywords[0].count : 1;
    
    sortedKeywords.forEach(keywordInfo => {
        const keywordElement = document.createElement('span');
        keywordElement.className = 'keyword-item';
        keywordElement.textContent = keywordInfo.keyword;
        keywordElement.style.color = keywordInfo.color;
        
        // 根据频率调整字体大小
        const fontSize = 12 + (keywordInfo.count / maxCount) * 28;
        keywordElement.style.fontSize = `${fontSize}px`;
        
        keywordCloud.appendChild(keywordElement);
    });
}

// 渲染图例
function renderLegends(moodLegend, activityLegend) {
    const moodLegendContainer = document.getElementById('moodLegend');
    const activityLegendContainer = document.getElementById('activityLegend');
    
    if (moodLegendContainer) {
        moodLegendContainer.innerHTML = moodLegend.map(item => `
            <div class="legend-item">
                <span class="legend-color" style="background-color: ${item.color};"></span>
                <span class="legend-label">${item.name}</span>
            </div>
        `).join('');
    }
    
    if (activityLegendContainer) {
        activityLegendContainer.innerHTML = activityLegend.map(item => `
            <div class="legend-item">
                <span class="legend-color" style="background-color: ${item.color};"></span>
                <span class="legend-label">${item.name}</span>
            </div>
        `).join('');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 加载数据
    loadWallData();
    
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
                        loadWallData();
                    }
                } catch (error) {
                    console.error('解析刷新信号失败:', error);
                }
            }
        }
    });
});