# 修复飞书导入导出时间和刷新情绪墙

## 问题描述
1. 飞书导入导出功能中，startTime和endTime字段格式不正确，导致导入失败
2. 保存活动详情后，没有刷新记录汇总和情绪墙数据

## 解决方案
1. 修复飞书客户端中的时间格式化逻辑，确保正确处理时间字段
2. 在记录详情保存后添加刷新情绪墙和活动墙的逻辑

## 修改内容

### 1. 修复飞书导入导出时间格式

#### 1.1 修改飞书客户端JavaScript代码
在 `static/js/modules/feishuClient.js` 中：

1. 添加了 `formatDateTimeForFeishu` 方法，用于正确格式化日期时间：
```javascript
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
```

2. 修改了 `importRecordsToBitable` 方法中时间字段的处理：
```javascript
// 格式化时间 - 使用正确的格式
const startTime = record.startTime ? this.formatDateTimeForFeishu(record.startTime) : '';
const endTime = record.endTime ? this.formatDateTimeForFeishu(record.endTime) : '';
```

#### 1.2 修改后端Python代码
在 `app.py` 中修复了从飞书同步记录时的时间处理逻辑：

```python
if start_time_field:
    try:
        # 将北京时间转换为UTC时间
        beijing_time = datetime.strptime(start_time_field, '%Y-%m-%d %H:%M:%S')
        # 使用replace方法设置时区
        beijing_time = beijing_time.replace(tzinfo=BEIJING_TZ)
        utc_time = beijing_time.astimezone(timezone.utc)
        start_time = utc_time.isoformat().replace('+00:00', 'Z')
    except Exception as e:
        print(f"转换开始时间时出错: {e}")

if end_time_field:
    try:
        # 将北京时间转换为UTC时间
        beijing_time = datetime.strptime(end_time_field, '%Y-%m-%d %H:%M:%S')
        # 使用replace方法设置时区
        beijing_time = beijing_time.replace(tzinfo=BEIJING_TZ)
        utc_time = beijing_time.astimezone(timezone.utc)
        end_time = utc_time.isoformat().replace('+00:00', 'Z')
    except Exception as e:
        print(f"转换结束时间时出错: {e}")
```

### 2. 添加保存后刷新情绪墙和活动墙功能

#### 2.1 修改记录详情JavaScript代码
在 `static/js/modules/recordDetail.js` 中：

1. 添加了 `refreshMoodAndActivityWalls` 方法：
```javascript
/**
 * 刷新情绪墙和活动墙
 */
refreshMoodAndActivityWalls: function() {
    // 检查当前是否在情绪墙页面
    if (window.location.pathname === '/mood_wall') {
        // 重新加载情绪墙数据
        if (typeof loadWallData === 'function') {
            loadWallData();
        }
    }
    
    // 检查当前是否在记录页面
    if (window.location.pathname === '/records') {
        // 重新加载记录数据
        if (window.timeRecorderRecords && typeof window.timeRecorderRecords.loadRecords === 'function') {
            window.timeRecorderRecords.loadRecords();
        }
    }
    
    // 如果在首页，刷新统计信息
    if (window.location.pathname === '/') {
        if (window.TimeRecorderUI && typeof window.TimeRecorderUI.updateStats === 'function') {
            window.TimeRecorderUI.updateStats();
        }
    }
}
```

2. 在 `saveRecordDetail` 方法中调用刷新功能：
```javascript
// 通知页面更新记录表格和统计信息
if (window.TimeRecorderUI) {
    window.TimeRecorderUI.updateRecordsTable();
    window.TimeRecorderUI.updateStats();
}

// 刷新情绪墙和活动墙
this.refreshMoodAndActivityWalls();
```

## 测试验证
1. 测试了飞书导入导出功能，确认startTime和endTime字段能正确处理
2. 测试了保存记录详情后能正确刷新情绪墙和活动墙数据
3. 验证了在不同页面保存记录后都能正确更新相关数据

## 效果
1. 飞书导入导出功能恢复正常，时间字段能正确处理
2. 保存活动详情后能自动刷新相关页面的数据，提升用户体验