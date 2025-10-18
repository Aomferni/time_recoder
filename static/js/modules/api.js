/**
 * 时间记录器API模块
 */

import { TimeRecorderLogger } from './logger.js';

/**
 * API模块 - 处理与后端的所有通信
 */
export const TimeRecorderAPI = {
    /**
     * 加载活动类别配置
     */
    loadActivityCategories: function() {
        TimeRecorderLogger.info('API', '加载活动类别配置');
        return fetch('/api/activity-categories')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.success && data.data && data.data.categories) {
                    TimeRecorderLogger.info('API', '活动类别配置加载成功', { categoriesCount: data.data.categories.length });
                    return data.data.categories;
                }
                TimeRecorderLogger.error('API', '加载活动类别配置失败', 'Failed to load activity categories');
                throw new Error('Failed to load activity categories');
            })
            .catch(error => {
                TimeRecorderLogger.error('API', '加载活动类别配置异常', error);
                console.error('加载活动类别配置失败:', error);
                throw error;
            });
    },
    
    /**
     * 设置用户名
     */
    setUsername: function(newUsername, oldUsername) {
        // 检查参数有效性
        if (!newUsername) {
            return Promise.reject(new Error('用户名不能为空'));
        }
        
        return fetch('/api/set-username', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: newUsername,
                oldUsername: oldUsername
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('设置用户名失败:', error);
            throw error;
        });
    },
    
    /**
     * 加载记录
     */
    loadRecords: function() {
        return fetch(`/api/records`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.success) {
                    return data.records || [];
                }
                throw new Error('Failed to load records');
            })
            .catch(error => {
                console.error('加载记录失败:', error);
                throw error;
            });
    },
    
    /**
     * 添加记录
     */
    addRecord: function(record) {
        // 检查参数有效性
        if (!record) {
            return Promise.reject(new Error('记录数据不能为空'));
        }
        
        return fetch('/api/records', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(record)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('添加记录失败:', error);
            throw error;
        });
    },
    
    /**
     * 更新记录
     */
    updateRecord: function(recordId, updateData) {
        // 检查参数有效性
        if (!recordId) {
            return Promise.reject(new Error('记录ID不能为空'));
        }
        
        if (!updateData) {
            return Promise.reject(new Error('更新数据不能为空'));
        }
        
        return fetch(`/api/records/${recordId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('更新记录失败:', error);
            throw error;
        });
    },
    
    /**
     * 删除记录
     */
    deleteRecord: function(recordId) {
        // 检查参数有效性
        if (!recordId) {
            return Promise.reject(new Error('记录ID不能为空'));
        }
        
        return fetch(`/api/records/${recordId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('删除记录失败:', error);
            throw error;
        });
    },
    
    /**
     * 获取单个记录
     */
    getRecord: function(recordId) {
        // 检查参数有效性
        if (!recordId) {
            return Promise.reject(new Error('记录ID不能为空'));
        }
        
        return fetch(`/api/records/${recordId}`, {
            method: 'GET'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('获取记录失败:', error);
            throw error;
        });
    },
    
    /**
     * 获取统计信息
     */
    getStats: function() {
        return fetch(`/api/stats`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.success) {
                    return data.stats || {};
                }
                throw new Error('Failed to load stats');
            })
            .catch(error => {
                console.error('加载统计信息失败:', error);
                throw error;
            });
    },
    
    /**
     * 加载所有记录（带筛选和分页）
     */
    loadAllRecords: function(params) {
        const url = `/api/all-records${params ? `?${params.toString()}` : ''}`;
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.success) {
                    return data;
                }
                throw new Error('Failed to load all records');
            })
            .catch(error => {
                console.error('加载所有记录失败:', error);
                throw error;
            });
    },
    
    /**
     * 加载今日计划
     */
    loadDailyPlan: function(date) {
        const url = `/api/daily-plan${date ? `?date=${date}` : ''}`;
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.success) {
                    return data.plan;
                }
                throw new Error('Failed to load daily plan');
            })
            .catch(error => {
                console.error('加载今日计划失败:', error);
                throw error;
            });
    },
    
    /**
     * 保存今日计划
     */
    saveDailyPlan: function(plan) {
        return fetch('/api/daily-plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(plan)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('保存今日计划失败:', error);
            throw error;
        });
    },
    
    /**
     * 同步今日计划到飞书
     */
    syncDailyPlanToFeishu: function(date) {
        console.log('[API调用] 同步今日计划到飞书，日期:', date);
        return fetch('/api/daily-plan/sync-feishu', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date: date })
        })
        .then(response => {
            console.log('飞书API响应状态:', response.status, response.statusText);
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('飞书API错误响应:', text);
                    throw new Error(`HTTP error! status: ${response.status}, message: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('飞书API返回数据:', data);
            return data;
        })
        .catch(error => {
            console.error('同步今日计划到飞书失败:', error);
            throw error;
        });
    }
};