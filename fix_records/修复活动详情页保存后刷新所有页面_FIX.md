# 修复记录：活动详情页保存后刷新所有页面

## 问题描述
在【活动详情】页点击【保存】后，只刷新了当前页面的数据显示，其他页面的数据没有同步更新，导致数据不一致。

## 问题分析
通过代码分析发现，问题出在[recordDetail.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/recordDetail.js)文件中的[saveRecordDetail](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/recordDetail.js#L767-L902)函数中，保存成功后只调用了当前页面的刷新方法，没有通知其他页面刷新数据。

## 解决方案
1. 在[recordDetail.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/recordDetail.js)中添加[refreshAllPages](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/recordDetail.js#L894-L896)函数，用于刷新所有页面的数据显示
2. 在各个页面添加监听刷新信号的代码，当检测到其他页面的刷新信号时，重新加载数据
3. 使用localStorage作为跨页面通信的机制，通过存储刷新信号来通知其他页面

## 修改内容

### 1. 修改recordDetail.js文件
在[saveRecordDetail](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/recordDetail.js#L767-L902)函数中添加调用[refreshAllPages](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/recordDetail.js#L894-L896)函数：

```javascript
// 发送到后端更新
TimeRecorderAPI.updateRecord(recordId, updateData)
    .then(data => {
        if (data && data.success) {
            // 触发保存成功动画
            // 确保只选择当前模态框中的保存按钮
            const modal = document.getElementById('recordDetailModal');
            if (modal) {
                const saveBtn = modal.querySelector('.save-btn');
                if (saveBtn) {
                    saveBtn.classList.add('save-success');
                    setTimeout(() => {
                        if (saveBtn.classList.contains('save-success')) {
                            saveBtn.classList.remove('save-success');
                        }
                    }, 500);
                }
            }
            
            this.closeRecordDetailModal();
            // 通知页面更新记录表格和统计信息
            if (window.TimeRecorderUI) {
                window.TimeRecorderUI.updateRecordsTable();
                window.TimeRecorderUI.updateStats();
            }
            
            // 刷新情绪墙和活动墙
            this.refreshMoodAndActivityWalls();
            
            // 刷新所有页面的数据显示
            this.refreshAllPages();
        } else {
            alert('更新记录失败: ' + (data.error || '未知错误'));
        }
    })
    .catch(error => {
        console.error('更新记录失败:', error);
        alert('更新记录失败，请查看控制台了解详情');
    });
```

添加[refreshAllPages](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/recordDetail.js#L894-L896)及相关函数：

```javascript
/**
 * 刷新所有页面的数据显示
 */
refreshAllPages: function() {
    // 刷新当前页面
    this.refreshCurrentPage();
    
    // 尝试刷新其他页面
    this.refreshOtherPages();
},

/**
 * 刷新当前页面的数据显示
 */
refreshCurrentPage: function() {
    // 检查当前页面并刷新相应数据
    if (window.location.pathname === '/mood_wall') {
        // 刷新情绪墙页面
        if (typeof loadWallData === 'function') {
            loadWallData();
        }
    } else if (window.location.pathname === '/records') {
        // 刷新历史记录页面
        if (window.timeRecorderRecords && typeof window.timeRecorderRecords.loadRecords === 'function') {
            window.timeRecorderRecords.loadRecords();
        }
    } else if (window.location.pathname === '/') {
        // 刷新首页
        if (window.TimeRecorderUI && typeof window.TimeRecorderUI.loadRecords === 'function') {
            window.TimeRecorderUI.loadRecords();
        }
        if (window.TimeRecorderUI && typeof window.TimeRecorderUI.updateStats === 'function') {
            window.TimeRecorderUI.updateStats();
        }
        // 刷新今日计划模块
        if (window.DailyPlanModule && typeof window.DailyPlanModule.refreshStats === 'function') {
            window.DailyPlanModule.refreshStats();
        }
    } else if (window.location.pathname === '/manage_categories') {
        // 刷新活动类别管理页面
        if (typeof loadActivityCategories === 'function') {
            loadActivityCategories();
        }
    }
},

/**
 * 尝试刷新其他页面的数据显示
 */
refreshOtherPages: function() {
    // 通过localStorage或sessionStorage传递刷新信号
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
},
```

### 2. 修改script.js文件
在首页添加监听其他页面刷新信号的代码：

```javascript
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
                    
                    // 重新加载记录
                    TimeRecorderAPI.loadRecords()
                        .then(recordsData => {
                            setRecords(recordsData);
                            // 按开始时间倒序排列
                            records.sort((a, b) => {
                                if (!a.startTime || !b.startTime) return 0;
                                return new Date(b.startTime) - new Date(a.startTime);
                            });
                            TimeRecorderUI.updateRecordsTable();
                            TimeRecorderUI.updateStats();
                            
                            // 刷新今日计划的统计数据
                            if (window.DailyPlanModule && DailyPlanModule.refreshStats) {
                                DailyPlanModule.refreshStats();
                            }
                        })
                        .catch(error => {
                            console.error('重新加载记录失败:', error);
                        });
                    
                    // 重新加载活动类别配置
                    TimeRecorderAPI.loadActivityCategories()
                        .then(categories => {
                            setActivityCategories(categories);
                            // 更新活动按钮显示
                            TimeRecorderUI.updateActivityButtons();
                        })
                        .catch(error => {
                            console.error('重新加载活动类别配置失败:', error);
                        });
                }
            } catch (error) {
                console.error('解析刷新信号失败:', error);
            }
        }
    }
});
```

### 3. 修改records.js文件
在历史记录页面添加监听其他页面刷新信号的代码：

```javascript
// 监听其他页面的刷新信号
window.addEventListener('storage', (e) => {
    if (e.key === 'timeRecorderRefreshSignal') {
        // 当检测到刷新信号时，重新加载数据
        if (e.newValue) {
            try {
                const signal = JSON.parse(e.newValue);
                // 检查信号是否来自其他页面（避免自己刷新自己）
                if (signal.sourcePage !== window.location.pathname) {
                    console.log('检测到其他页面的刷新信号，正在刷新当前页面数据...');
                    this.loadRecords();
                }
            } catch (error) {
                console.error('解析刷新信号失败:', error);
            }
        }
    }
});
```

### 4. 创建moodWall.js文件
将[mood_wall.html](file:///Users/amy/Documents/codes/time_recoder/templates/mood_wall.html)中的JavaScript代码移到单独的[moodWall.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/moodWall.js)文件中，并添加监听其他页面刷新信号的代码：

```javascript
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
```

### 5. 修改main.js文件
在管理类别页面添加监听其他页面刷新信号的代码：

```javascript
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
                    
                    // 重新加载记录
                    loadRecords();
                    
                    // 重新加载活动类别配置
                    loadActivityCategories();
                    
                    // 刷新今日计划模块
                    if (DailyPlanModule && typeof DailyPlanModule.refreshStats === 'function') {
                        DailyPlanModule.refreshStats();
                    }
                }
            } catch (error) {
                console.error('解析刷新信号失败:', error);
            }
        }
    }
});
```

## 验证结果
通过本地测试，确认以下功能正常工作：
1. 在活动详情页点击保存后，当前页面数据正确刷新
2. 其他页面的数据也能同步刷新
3. 保持与现有功能的一致性
4. 不会出现页面自身触发的重复刷新

## 影响范围
- 活动详情页面保存功能
- 所有页面的数据刷新机制
- 保持与现有代码的一致性