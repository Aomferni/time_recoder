/**
 * 时间记录器API模块
 */

/**
 * API模块 - 处理与后端的所有通信
 */
export const TimeRecorderAPI = {
    /**
     * 加载活动类别配置
     */
    loadActivityCategories: function() {
        return fetch('/api/activity-categories')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.success && data.data && data.data.categories) {
                    return data.data.categories;
                }
                throw new Error('Failed to load activity categories');
            })
            .catch(error => {
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
    }
};