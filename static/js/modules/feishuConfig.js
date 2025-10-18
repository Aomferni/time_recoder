/**
 * 飞书配置模块
 * 统一管理飞书配置的显示、保存和关闭功能
 */

export const FeishuConfigModule = {
    /**
     * 显示飞书配置模态框
     */
    async showFeishuConfig() {
        try {
            // 获取当前飞书配置
            const response = await fetch('/api/feishu/config');
            const feishuData = await response.json();
            
            // 获取应用配置
            const appConfigResponse = await fetch('/api/app-config');
            const appConfigData = await appConfigResponse.json();
            
            if (feishuData.success) {
                // 填充飞书配置信息
                const appIdElement = document.getElementById('feishuAppId');
                const appSecretElement = document.getElementById('feishuAppSecret');
                
                if (appIdElement) {
                    appIdElement.value = feishuData.config.app_id || '';
                }
                
                if (appSecretElement) {
                    appSecretElement.value = ''; // 不返回secret
                }
                
                // 填充自动同步配置
                if (appConfigData.success) {
                    const autoSyncEnabled = appConfigData.config.feishu.auto_sync_enabled || false;
                    const autoSyncElement = document.getElementById('feishuAutoSync');
                    if (autoSyncElement) {
                        autoSyncElement.checked = autoSyncEnabled;
                    }
                }
                
                // 显示模态框
                const modal = document.getElementById('feishuConfigModal');
                if (modal) {
                    modal.style.display = 'block';
                }
            } else {
                throw new Error(feishuData.error || '获取飞书配置失败');
            }
        } catch (error) {
            console.error('获取飞书配置失败:', error);
            alert('获取飞书配置失败: ' + error.message);
        }
    },
    
    /**
     * 关闭飞书配置模态框
     */
    closeFeishuConfig() {
        const modal = document.getElementById('feishuConfigModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    /**
     * 保存飞书配置
     */
    async saveFeishuConfig() {
        try {
            const appIdElement = document.getElementById('feishuAppId');
            const appSecretElement = document.getElementById('feishuAppSecret');
            const autoSyncElement = document.getElementById('feishuAutoSync');
            
            // 检查元素是否存在
            if (!appIdElement) {
                throw new Error('找不到App ID输入元素');
            }
            
            const appId = appIdElement.value.trim();
            const appSecret = appSecretElement ? appSecretElement.value.trim() : '';
            const autoSyncEnabled = autoSyncElement ? autoSyncElement.checked : false;
            
            // 验证输入
            if (!appId) {
                alert('请输入App ID');
                return;
            }
            
            // 如果用户没有输入新的App Secret，则不更新
            const updateData = {
                app_id: appId
            };
            
            // 只有当用户输入了新的App Secret时才更新
            if (appSecret) {
                updateData.app_secret = appSecret;
            }
            
            // 发送飞书配置更新请求
            const feishuResponse = await fetch('/api/feishu/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            const feishuData = await feishuResponse.json();
            
            if (!feishuData.success) {
                throw new Error(feishuData.error || '保存飞书配置失败');
            }
            
            // 发送应用配置更新请求
            const appConfigResponse = await fetch('/api/app-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    feishu: {
                        auto_sync_enabled: autoSyncEnabled
                    }
                })
            });
            
            const appConfigData = await appConfigResponse.json();
            
            if (appConfigData.success) {
                alert('飞书配置保存成功');
                this.closeFeishuConfig();
            } else {
                throw new Error(appConfigData.error || '保存应用配置失败');
            }
        } catch (error) {
            console.error('保存飞书配置失败:', error);
            alert('保存飞书配置失败: ' + error.message);
        }
    },
    
    /**
     * 从飞书导入信息
     */
    async importFromFeishu() {
        console.log('[飞书导入] 开始从飞书导入信息');
        try {
            this.showImportStatus('正在从飞书导入...', 'info');
            
            // 从飞书同步活动记录
            console.log('[飞书导入] 开始同步活动记录');
            const recordsResponse = await fetch('/api/feishu/sync-records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const recordsData = await recordsResponse.json();
            console.log('[飞书导入] 活动记录同步结果:', recordsData);
            
            if (!recordsData.success) {
                throw new Error(recordsData.error || '从飞书同步活动记录失败');
            }
            
            // 从飞书同步今日计划
            console.log('[飞书导入] 开始同步今日计划');
            const plansResponse = await fetch('/api/feishu/sync-plans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const plansData = await plansResponse.json();
            console.log('[飞书导入] 今日计划同步结果:', plansData);
            
            if (!plansData.success) {
                throw new Error(plansData.error || '从飞书同步今日计划失败');
            }
            
            this.showImportStatus(`导入成功：活动记录和今日计划已同步`, 'success');
            
            // 发送刷新信号给其他页面
            this.sendRefreshSignal();
            
            // 刷新当前页面数据（如果在相关页面）
            const currentPage = window.location.pathname;
            if (currentPage === '/' && window.dailyPlanModule) {
                window.dailyPlanModule.loadTodayPlan();
            } else if (currentPage === '/records' && window.timeRecorderRecords) {
                window.timeRecorderRecords.loadRecords();
            }
        } catch (error) {
            console.error('从飞书导入信息失败:', error);
            this.showImportStatus(`导入失败: ${error.message}`, 'error');
        }
    },
    
    /**
     * 显示导入状态
     */
    showImportStatus(message, type) {
        // 尝试在不同页面中找到导入状态元素
        let importStatus = document.getElementById('importStatus');
        
        // 如果找不到，尝试在飞书配置模态框中创建一个
        if (!importStatus) {
            const modal = document.getElementById('feishuConfigModal');
            if (modal) {
                // 查找或创建导入状态元素
                importStatus = modal.querySelector('.import-status');
                if (!importStatus) {
                    const form = modal.querySelector('.detail-form');
                    if (form) {
                        importStatus = document.createElement('div');
                        importStatus.id = 'importStatus';
                        importStatus.className = 'import-status';
                        importStatus.style.cssText = 'margin-top: 15px; padding: 10px; border-radius: 4px; display: none;';
                        form.appendChild(importStatus);
                    }
                }
            }
        }
        
        if (importStatus) {
            importStatus.textContent = message;
            importStatus.className = `import-status ${type}`;
            importStatus.style.display = 'block';
            
            // 3秒后自动隐藏成功消息
            if (type === 'success') {
                setTimeout(() => {
                    importStatus.style.display = 'none';
                }, 3000);
            }
        } else {
            // 如果找不到元素，使用alert显示消息
            if (type === 'error') {
                alert(message);
            }
        }
    },
    
    /**
     * 发送刷新信号给其他页面
     */
    sendRefreshSignal() {
        // 通过localStorage传递刷新信号
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
    }
};

// 将飞书配置模块暴露到全局作用域，以便HTML可以直接调用
window.FeishuConfigModule = FeishuConfigModule;

// 为了向后兼容，也暴露单独的函数
window.showFeishuConfig = () => FeishuConfigModule.showFeishuConfig();
window.closeFeishuConfig = () => FeishuConfigModule.closeFeishuConfig();
window.saveFeishuConfig = () => FeishuConfigModule.saveFeishuConfig();
window.importFromFeishu = () => FeishuConfigModule.importFromFeishu();