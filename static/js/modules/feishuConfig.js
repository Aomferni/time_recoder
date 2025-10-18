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
            const data = await response.json();
            
            if (data.success) {
                // 填充配置信息
                document.getElementById('feishuAppId').value = data.config.app_id || '';
                document.getElementById('feishuAppSecret').value = ''; // 不返回secret
                
                // 显示模态框
                const modal = document.getElementById('feishuConfigModal');
                if (modal) {
                    modal.style.display = 'block';
                }
            } else {
                throw new Error(data.error || '获取飞书配置失败');
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
            const appId = document.getElementById('feishuAppId').value.trim();
            const appSecret = document.getElementById('feishuAppSecret').value.trim();
            
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
            
            // 发送更新请求
            const response = await fetch('/api/feishu/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('飞书配置保存成功');
                this.closeFeishuConfig();
            } else {
                throw new Error(data.error || '保存飞书配置失败');
            }
        } catch (error) {
            console.error('保存飞书配置失败:', error);
            alert('保存飞书配置失败: ' + error.message);
        }
    }
};

// 将飞书配置模块暴露到全局作用域，以便HTML可以直接调用
window.FeishuConfigModule = FeishuConfigModule;

// 为了向后兼容，也暴露单独的函数
window.showFeishuConfig = () => FeishuConfigModule.showFeishuConfig();
window.closeFeishuConfig = () => FeishuConfigModule.closeFeishuConfig();
window.saveFeishuConfig = () => FeishuConfigModule.saveFeishuConfig();
