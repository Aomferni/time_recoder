/**
 * 时间记录器工具类模块
 */

import { activityCategories, colorClassMap, activityCategoryClassMap } from './config.js';

/**
 * 时间记录器前端工具类
 */
export const TimeRecorderFrontendUtils = {
    /**
     * 获取活动类别对应的CSS类
     */
    getActivityCategoryClass: function(activityCategory) {
        // 确保activityCategories已定义且为数组
        if (Array.isArray(activityCategories)) {
            // 查找匹配的类别配置
            const category = activityCategories.find(cat => cat && cat.name === activityCategory);
            if (category && colorClassMap) {
                return colorClassMap[category.color] || 'btn-work-output';
            }
        }
        // 使用默认映射
        if (activityCategoryClassMap) {
            return activityCategoryClassMap[activityCategory] || 'btn-work-output';
        }
        return 'btn-work-output'; // 默认使用工作输出类颜色
    },
    
    /**
     * 获取活动对应的CSS类（基于活动类别）
     */
    getActivityClass: function(activity, activityCategory) {
        if (activityCategory) {
            return this.getActivityCategoryClass(activityCategory);
        }
        // 确保activityCategories已定义且为数组
        if (Array.isArray(activityCategories)) {
            // 如果没有活动类别，查找活动所属的类别
            const category = activityCategories.find(cat => 
                cat && Array.isArray(cat.activities) && cat.activities.includes(activity)
            );
            if (category) {
                return this.getActivityCategoryClass(category.name);
            }
        }
        // 如果找不到匹配的类别，使用原来的映射
        const activityClassMap = {
            // 工作输出类 - 蓝色系
            '梳理方案': 'btn-work-output',
            '开会': 'btn-work-output',
            '探索新方法': 'btn-work-output',
            '执行工作': 'btn-work-output',
            '复盘': 'btn-work-output',
            
            // 大脑充电类 - 绿色系
            '和智者对话': 'btn-charge',
            '做调研': 'btn-charge',

            // 身体充电类 - 绿色系
            '健身': 'btn-charge',
            '散步': 'btn-charge',
            
            // 修养生息类 - 紫色系
            '处理日常': 'btn-rest',
            '进入工作状态': 'btn-rest',
            '睡觉仪式': 'btn-rest',
            
            // 输出创作类 - 橙色系
            '创作/写作': 'btn-create',
            '玩玩具': 'btn-create',

            // 暂停一下类 - 青色系
            '交流心得': 'btn-gap',
            '记录|反思|计划': 'btn-gap',

            // 纯属娱乐类 - 灰色系
            '刷手机': 'btn-entertainment'
        };
        
        return activityClassMap[activity] || 'btn-work-output'; // 默认使用工作输出类颜色
    },
    
    /**
     * 格式化时间
     */
    formatTime: function(date) {
        // 检查date是否有效
        if (!date) return '';
        
        try {
            // 数据存储的是UTC时间，需要转换为北京时间显示
            const utcDate = new Date(date);
            // 转换为北京时间（UTC+8）
            
            const beijingDate = new Date(utcDate.getTime() );
            return beijingDate.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit'
            });
        } catch (e) {
            console.error('格式化时间时出错:', e);
            return '';
        }
    },
    
    /**
     * 格式化日期时间用于输入框
     */
    formatDateTimeForInput: function(date) {
        // 检查date是否有效
        if (!date) return '';
        
        try {
            const utcDate = new Date(date);
            const beijingDate = new Date(utcDate.getTime());
            const year = beijingDate.getFullYear();
            const month = (beijingDate.getMonth() + 1).toString().padStart(2, '0');
            const day = beijingDate.getDate().toString().padStart(2, '0');
            const hours = beijingDate.getHours().toString().padStart(2, '0');
            const minutes = beijingDate.getMinutes().toString().padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch (e) {
            console.error('格式化日期时间时出错:', e);
            return '';
        }
    },
    
    /**
     * 格式化时长
     */
    formatDuration: function(milliseconds) {
        // 检查milliseconds是否有效
        if (typeof milliseconds !== 'number' || isNaN(milliseconds) || milliseconds < 0) {
            return '0分钟0秒';
        }
        
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) {
            return `${hours}小时${minutes}分钟`;
        } else {
            return `${minutes}分钟${seconds}秒`;
        }
    },
    
    /**
     * 获取情绪颜色
     */
    getEmotionColor: function(emotion) {
        const emotionColorMap = {
            // 正向+专注：惊奇、兴奋、高兴、愉悦
            '惊奇': '#9C27B0',  // 紫色
            '兴奋': '#E91E63',  // 粉色
            '高兴': '#4CAF50',  // 绿色
            '愉悦': '#8BC34A',  // 浅绿色
            
            // 正向+松弛：安逸、安心、满足、宁静、放松
            '安逸': '#00BCD4',  // 青色
            '安心': '#2196F3',  // 蓝色
            '满足': '#8BC34A',  // 浅绿色
            '宁静': '#009688',  // 青绿色
            '放松': '#CDDC39',  // 青黄色
            
            // 负面+松弛：悲伤、伤心、沮丧、疲惫
            '悲伤': '#546E7A',  // 更暗的蓝灰色
            '伤心': '#78909C',  // 更暗的灰色
            '沮丧': '#5D4037',  // 暗棕色
            '疲惫': '#4E342E',  // 更暗的棕色
            
            // 负面+专注：惊恐、紧张、愤怒、苦恼
            '惊恐': '#424242',  // 暗灰色
            '紧张': '#616161',  // 更暗的灰色
            '愤怒': '#BF360C',  // 暗红色
            '苦恼': '#FF6F00'   // 暗琥珀色
        };
        return emotionColorMap[emotion] || '#607D8B'; // 默认灰色
    },
    
    /**
     * 获取情绪对应的emoji
     */
    getEmotionEmoji: function(emotion) {
        const emotionEmojiMap = {
            // 正向+专注
            '惊奇': '✨',
            '兴奋': '🤩',
            '高兴': '😊',
            '愉悦': '😄',
            
            // 正向+松弛
            '安逸': '🪂',
            '安心': '😌',
            '满足': '😋',
            '宁静': '🧘',
            '放松': '🌿',
            
            // 负面+松弛
            '悲伤': '😢',
            '伤心': '💔',
            '沮丧': '😞',
            '疲惫': '😴',
            
            // 负面+专注
            '惊恐': '😱',
            '紧张': '😰',
            '愤怒': '😡',
            '苦恼': '😫'
        };
        return emotionEmojiMap[emotion] || '😊'; // 默认emoji
    },
    
    /**
     * 计算段落总时间
     */
    calculateSegmentsTotalTime: function(segments) {
        let total = 0;
        if (segments && Array.isArray(segments)) {
            segments.forEach(segment => {
                if (segment && segment.start && segment.end) {
                    try {
                        // 数据存储的是UTC时间，需要正确计算时间差
                        const start = new Date(segment.start).getTime();
                        const end = new Date(segment.end).getTime();
                        if (!isNaN(start) && !isNaN(end) && end >= start) {
                            total += (end - start);
                        }
                    } catch (e) {
                        console.error('计算段落时间时出错:', e);
                    }
                }
            });
        }
        return total;
    },
    
    /**
     * 计算记录总时间（包括段落时间和当前计时）
     */
    calculateRecordTotalTime: function(record, currentElapsed = 0) {
        // 根据规范，duration记录所有segments累计的时间
        // 重新计算段落总时间以确保准确性
        let total = 0;
        if (record.segments && Array.isArray(record.segments)) {
            // 使用工具类计算所有段落的总时间
            total = this.calculateSegmentsTotalTime(record.segments);
        }
        // 如果计算结果为0，使用record.duration作为后备值
        if (total === 0) {
            total = (record && record.duration) || 0;
        }
        
        // 确保window.TimeRecorderConfig存在且有currentRecordId属性
        if (typeof window !== 'undefined' && 
            window.TimeRecorderConfig && 
            window.TimeRecorderConfig.currentRecordId) {
            // 如果是当前计时的记录，加上当前段的时间
            if (window.TimeRecorderConfig.currentRecordId === record.id) {
                total += currentElapsed;
            }
        }
        
        return total;
    },
    
    /**
     * 切换详情区域的折叠/展开状态
     */
    toggleSection: function(button, sectionType) {
        // 委托给UI模块的实现
        if (typeof window !== 'undefined' && window.TimeRecorderUI && window.TimeRecorderUI.toggleSection) {
            window.TimeRecorderUI.toggleSection(button, sectionType);
        } else {
            console.warn('TimeRecorderUI.toggleSection方法未定义');
        }
    },
    
    /**
     * 解析时间字符串为毫秒数
     */
    parseDurationString: function(durationStr) {
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
};