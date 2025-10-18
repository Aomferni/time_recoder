/**
 * 时间记录器日志模块
 * 统一处理所有前端日志记录功能
 */

const LOG_STORAGE_KEY = 'timeRecorderLogs';
const LOG_RETENTION_HOURS = 2; // 保留2小时内的日志

// 添加发送日志到后端的函数
function sendLogToBackend(logText) {
    // 创建一个隐藏的表单来发送日志到后端
    const formData = new FormData();
    formData.append('log', logText);
    
    // 发送到后端API
    fetch('/api/logs/frontend', {
        method: 'POST',
        body: formData
    }).catch(err => {
        // 静默处理错误，避免影响用户体验
        console.debug('发送前端日志到后端失败:', err);
    });
}

export const TimeRecorderLogger = {
    /**
     * 记录日志
     * @param {string} level - 日志级别 (debug, info, warn, error)
     * @param {string} module - 模块名称
     * @param {string} message - 日志消息
     * @param {object} data - 附加数据（可选）
     */
    log: function(level, module, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp: timestamp,
            level: level,
            module: module,
            message: message,
            data: data
        };
        
        // 同时输出到控制台
        const consoleMessage = `[${timestamp}] [${level.toUpperCase()}] [${module}] ${message}`;
        switch (level) {
            case 'debug':
                console.debug(consoleMessage, data || '');
                break;
            case 'info':
                console.info(consoleMessage, data || '');
                break;
            case 'warn':
                console.warn(consoleMessage, data || '');
                break;
            case 'error':
                console.error(consoleMessage, data || '');
                break;
            default:
                console.log(consoleMessage, data || '');
        }
        
        // 格式化日志文本
        let logText = `[${timestamp}] [${level.toUpperCase()}] [${module}] ${message}`;
        
        // 如果有附加数据，添加到日志条目中
        if (data !== null) {
            try {
                // 尝试将数据转换为JSON格式
                const dataStr = JSON.stringify(data);
                logText += ` ${dataStr}`;
            } catch (e) {
                // 如果不能序列化，转换为字符串
                logText += ` ${String(data)}`;
            }
        }
        
        // 保存到本地存储
        this._saveLog(logText);
        
        // 发送到后端
        sendLogToBackend(logText);
    },
    
    /**
     * 记录调试日志
     * @param {string} module - 模块名称
     * @param {string} message - 日志消息
     * @param {object} data - 附加数据（可选）
     */
    debug: function(module, message, data = null) {
        this.log('debug', module, message, data);
    },
    
    /**
     * 记录信息日志
     * @param {string} module - 模块名称
     * @param {string} message - 日志消息
     * @param {object} data - 附加数据（可选）
     */
    info: function(module, message, data = null) {
        this.log('info', module, message, data);
    },
    
    /**
     * 记录警告日志
     * @param {string} module - 模块名称
     * @param {string} message - 日志消息
     * @param {object} data - 附加数据（可选）
     */
    warn: function(module, message, data = null) {
        this.log('warn', module, message, data);
    },
    
    /**
     * 记录错误日志
     * @param {string} module - 模块名称
     * @param {string} message - 日志消息
     * @param {object} data - 附加数据（可选）
     */
    error: function(module, message, data = null) {
        this.log('error', module, message, data);
    },
    
    /**
     * 保存日志到本地存储
     * @param {object} logEntry - 日志条目
     */
    _saveLog: function(logEntry) {
        try {
            // 获取现有日志
            let logs = this._getLogs();
            
            // 添加新日志
            logs.push(logEntry);
            
            // 清理过期日志
            logs = this._cleanupOldLogs(logs);
            
            // 保存到本地存储
            localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
            
            // 同时发送到后端保存到文件
            this._sendLogToBackend(logEntry);
        } catch (e) {
            console.error('保存日志失败:', e);
        }
    },
    
    /**
     * 获取所有日志
     * @returns {Array} 日志数组
     */
    _getLogs: function() {
        try {
            const logsStr = localStorage.getItem(LOG_STORAGE_KEY);
            return logsStr ? JSON.parse(logsStr) : [];
        } catch (e) {
            console.error('读取日志失败:', e);
            return [];
        }
    },
    
    /**
     * 清理过期日志（仅保留2小时内的日志）
     * @param {Array} logs - 日志数组
     * @returns {Array} 清理后的日志数组
     */
    _cleanupOldLogs: function(logs) {
        const cutoffTime = new Date(Date.now() - LOG_RETENTION_HOURS * 60 * 60 * 1000);
        
        return logs.filter(log => {
            const logTime = new Date(log.timestamp);
            return logTime >= cutoffTime;
        });
    },
    
    /**
     * 获取所有日志
     * @returns {Array} 日志数组
     */
    getAllLogs: function() {
        return this._getLogs();
    },
    
    /**
     * 获取指定模块的日志
     * @param {string} module - 模块名称
     * @returns {Array} 日志数组
     */
    getLogsByModule: function(module) {
        const logs = this._getLogs();
        return logs.filter(log => log.module === module);
    },
    
    /**
     * 获取指定级别的日志
     * @param {string} level - 日志级别
     * @returns {Array} 日志数组
     */
    getLogsByLevel: function(level) {
        const logs = this._getLogs();
        return logs.filter(log => log.level === level);
    },
    
    /**
     * 清空所有日志
     */
    clearLogs: function() {
        localStorage.removeItem(LOG_STORAGE_KEY);
    },
    
    /**
     * 导出日志为文本格式
     * @returns {string} 日志文本
     */
    exportLogs: function() {
        const logs = this._getLogs();
        return logs.join('\n');
    }
};