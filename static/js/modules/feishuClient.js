/**
 * 飞书多维表格客户端
 */
class FeishuBitableClient {
    constructor() {
        this.appId = '';
        this.appSecret = '';
        this.tenantAccessToken = '';
        this.tokenExpireTime = 0;
        this.loadConfig();
    }

    /**
     * 加载配置
     */
    async loadConfig() {
        try {
            const response = await fetch('/api/feishu/config');
            const data = await response.json();
            if (data.success) {
                this.appId = data.config.app_id;
                this.appSecret = data.config.app_secret;
            }
        } catch (error) {
            console.error('加载飞书配置失败:', error);
        }
    }

    /**
     * 获取租户访问令牌
     */
    async getTenantAccessToken() {
        // 检查令牌是否有效且未过期
        const now = Date.now();
        if (this.tenantAccessToken && this.tokenExpireTime > now) {
            return this.tenantAccessToken;
        }

        try {
            const response = await fetch('/api/feishu/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    app_id: this.appId,
                    app_secret: this.appSecret
                })
            });

            const data = await response.json();
            if (data.success) {
                this.tenantAccessToken = data.token;
                // 设置过期时间（提前5分钟过期）
                this.tokenExpireTime = now + (data.expire - 300) * 1000;
                return this.tenantAccessToken;
            } else {
                throw new Error(data.error || '获取访问令牌失败');
            }
        } catch (error) {
            console.error('获取租户访问令牌失败:', error);
            throw error;
        }
    }

    /**
     * 导出记录到飞书多维表格
     */
    async importRecordsToBitable(records) {
        try {
            const token = await this.getTenantAccessToken();
            
            // 准备数据格式
            const feishuRecords = records.map(record => {
                // 格式化时间 - 使用正确的格式
                const startTime = record.startTime ? this.formatDateTimeForFeishu(record.startTime) : '';
                const endTime = record.endTime ? this.formatDateTimeForFeishu(record.endTime) : '';
                
                // 计算时长
                let durationStr = '';
                if (record.duration !== undefined && record.duration !== null && record.duration >= 0) {
                    const totalSeconds = Math.floor(record.duration / 1000);
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    const seconds = totalSeconds % 60;
                    
                    if (hours > 0) {
                        durationStr = `${hours}小时${minutes}分钟${seconds}秒`;
                    } else if (minutes > 0) {
                        durationStr = `${minutes}分钟${seconds}秒`;
                    } else {
                        durationStr = `${seconds}秒`;
                    }
                }
                
                // 处理情绪字段，确保是数组格式
                let emotionValue = record.emotion || '';
                let emotionArray = [];
                if (emotionValue) {
                    if (Array.isArray(emotionValue)) {
                        emotionArray = emotionValue;
                    } else if (typeof emotionValue === 'string') {
                        // 如果是逗号分隔的字符串，分割成数组
                        emotionArray = emotionValue.split(',').map(e => e.trim()).filter(e => e);
                    } else {
                        emotionArray = [String(emotionValue)];
                    }
                }
                
                // 处理日期字段，转换为时间戳
                let dateTimestamp = 0;
                if (record.date) {
                    try {
                        // 将日期字符串转换为时间戳
                        const dateObj = new Date(record.date);
                        dateTimestamp = dateObj.getTime();
                    } catch (e) {
                        console.error('日期转换失败:', e);
                        // 如果日期格式不正确，使用当前日期
                        dateTimestamp = Date.now();
                    }
                }
                
                // 将segments转换为JSON格式的文本
                let segmentsJson = '';
                if (record.segments && Array.isArray(record.segments)) {
                    segmentsJson = JSON.stringify(record.segments, null, 2);
                }
                
                return {
                    fields: {
                        "activity(活动名称)": record.activity || '',
                        "activityCategory(活动类型)": record.activityCategory || '',
                        "startTime(开始时间)": startTime,
                        "endTime(结束时间)": endTime,
                        "duration(总计专注时长)": durationStr,
                        "timeSpan(时间跨度)": record.timeSpan ? `${Math.floor(record.timeSpan / 1000)}秒` : '',
                        "remark(感想&记录)": record.remark || '',
                        "emotion(情绪记录)": emotionArray,
                        "pauseCount(暂停次数)": parseInt(record.pauseCount) || 0,  // 确保是数字类型
                        "活动日期": dateTimestamp,  // 使用时间戳格式
                        "id(活动唯一标识)": record.id || '',
                        "segments(专注段落)": segmentsJson  // 添加segments JSON文本
                    }
                };
            });

            // 分批处理，飞书API限制每次最多100条记录
            const batchSize = 100;
            const results = [];
            
            for (let i = 0; i < feishuRecords.length; i += batchSize) {
                const batch = feishuRecords.slice(i, i + batchSize);
                const response = await fetch('/api/feishu/import-records', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        records: batch
                    })
                });

                const data = await response.json();
                if (!data.success) {
                    throw new Error(data.error || `导入记录失败 (批次 ${Math.floor(i/batchSize) + 1})`);
                }
                
                results.push(data);
            }
            
            return {
                success: true,
                imported_count: feishuRecords.length,
                message: `成功导入 ${feishuRecords.length} 条记录到飞书多维表格`
            };
        } catch (error) {
            console.error('导入记录到飞书多维表格失败:', error);
            return {
                success: false,
                error: error.message || '导入记录到飞书多维表格失败'
            };
        }
    }
    
    /**
     * 格式化日期时间为飞书所需的格式
     */
    formatDateTimeForFeishu(dateTimeStr) {
        try {
            // 如果已经是正确的格式，直接返回
            if (typeof dateTimeStr === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateTimeStr)) {
                return dateTimeStr;
            }
            
            // 将UTC时间转换为北京时间并格式化
            const date = new Date(dateTimeStr);
            if (isNaN(date.getTime())) {
                return '';
            }
            
            // 转换为北京时间
            const beijingTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
            
            // 格式化为 "YYYY-MM-DD HH:mm:ss"
            const year = beijingTime.getFullYear();
            const month = String(beijingTime.getMonth() + 1).padStart(2, '0');
            const day = String(beijingTime.getDate()).padStart(2, '0');
            const hours = String(beijingTime.getHours()).padStart(2, '0');
            const minutes = String(beijingTime.getMinutes()).padStart(2, '0');
            const seconds = String(beijingTime.getSeconds()).padStart(2, '0');
            
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } catch (e) {
            console.error('格式化日期时间失败:', e);
            return '';
        }
    }
}

// 导出类和实例
export { FeishuBitableClient };