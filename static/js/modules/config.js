/**
 * 时间记录器配置模块
 */

// 全局变量定义
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
let activityCategories = []; // 活动类别配置
let useSimpleDetail = false; // 是否使用简化版详情视图

// 活动类别到CSS类的映射
// 用于根据活动类别为按钮和标签设置相应的颜色样式
const activityCategoryClassMap = {     
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

    // 工作输出类 - 蓝色系
    '工作输出': 'btn-work-output',
    
    // 大脑&身体充电类 - 绿色系
    '大脑充电': 'btn-charge',
    '身体充电': 'btn-charge',
    
    // 修养生息类 - 紫色系
    '修养生息': 'btn-rest',
    
    // 输出创作类 - 橙色系
    '输出创作': 'btn-create',
    
    // 暂停一下类 - 青色系
    '暂停一下': 'btn-gap',

    // 纯属娱乐类 - 灰色系
    '纯属娱乐': 'btn-entertainment'
};

// 颜色到CSS类的映射
// 用于根据配置的颜色值为活动类别设置相应的CSS类
const colorClassMap = {
    'blue': 'btn-work-output',   // 蓝色 - 工作输出类
    'green': 'btn-charge',       // 绿色 - 充电类
    'purple': 'btn-rest',        // 紫色 - 修养生息类
    'orange': 'btn-create',      // 橙色 - 输出创作类
    'cyan': 'btn-gap',           // 青色 - 暂停一下类
    'gray': 'btn-entertainment'  // 灰色 - 纯属娱乐类
};

// 情绪选项
const emotionOptions = ['开心', '专注', '疲惫', '焦虑', '兴奋', '平静', '沮丧', '满足', '无聊'];

// 导出配置变量和常量
export {
    currentActivity,
    startTime,
    elapsedTime,
    timerInterval,
    isPaused,
    currentRecordId,
    records,
    expandedRecordId,
    currentDetailRecordId,
    currentUsername,
    activityCategories,
    useSimpleDetail,
    activityCategoryClassMap,
    colorClassMap,
    emotionOptions
};

// 导出配置变量的setter函数
export function setCurrentActivity(activity) {
    currentActivity = activity;
}

export function setStartTime(time) {
    startTime = time;
}

export function setElapsedTime(time) {
    elapsedTime = time;
}

export function setTimerInterval(interval) {
    timerInterval = interval;
}

export function setIsPaused(paused) {
    isPaused = paused;
}

export function setCurrentRecordId(id) {
    currentRecordId = id;
}

export function setRecords(newRecords) {
    records = newRecords;
}

export function setExpandedRecordId(id) {
    expandedRecordId = id;
}

export function setCurrentDetailRecordId(id) {
    currentDetailRecordId = id;
}

export function setCurrentUsername(username) {
    currentUsername = username;
}

export function setActivityCategories(categories) {
    activityCategories = categories;
}

export function setUseSimpleDetail(simple) {
    useSimpleDetail = simple;
}