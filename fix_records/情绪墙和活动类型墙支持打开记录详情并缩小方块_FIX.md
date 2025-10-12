# 情绪墙和活动类型墙支持打开记录详情并缩小方块

## 问题描述
1. 情绪墙中的情绪方块无法打开记录详情
2. 活动类型墙和情绪墙的方块尺寸较大，需要缩小以提高页面展示效果

## 问题分析
1. 情绪墙中的情绪方块只显示了alert提示，没有实现打开记录详情的功能
2. 活动类型墙和情绪墙的方块尺寸为100px*100px，可以适当缩小以提高页面展示效果

## 修复方案
1. 为情绪墙中的情绪方块添加打开记录详情的功能
2. 缩小活动类型墙和情绪墙中方块的尺寸

## 代码修改

### 修改文件: `/templates/mood_wall.html`

1. 修改情绪方块的点击事件处理函数：
```javascript
// 添加点击事件（可选）
moodBox.addEventListener('click', () => {
    // 查找匹配的情绪记录
    findAndShowMoodDetail(mood.name, dayStr);
});
```

2. 添加查找并显示情绪详情的函数：
```javascript
// 查找并显示情绪详情
function findAndShowMoodDetail(moodName, dateStr) {
    // 构造查询参数
    const params = new URLSearchParams();
    params.append('username', currentUsername);
    params.append('date_from', dateStr);
    params.append('date_to', dateStr);
    params.append('emotion', moodName);
    params.append('page', 1);
    params.append('per_page', 20);
    
    console.log('查找情绪详情:', {moodName, dateStr, username: currentUsername});
    
    // 获取匹配的记录
    fetch(`/api/all-records?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            console.log('API响应:', data);
            if (data.success && data.records && data.records.length > 0) {
                // 显示第一个匹配的记录详情
                showSimpleRecordDetail(data.records[0]);
            } else {
                alert(`未找到匹配的情绪记录\n情绪: ${moodName}\n日期: ${dateStr}`);
            }
        })
        .catch(error => {
            console.error('加载记录详情失败:', error);
            alert('加载记录详情失败，请查看控制台了解详情');
        });
}
```

### 修改文件: `/static/css/modules/mood-wall.css`

1. 缩小情绪墙方块尺寸：
```css
.mood-box {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 3px 8px rgba(0,0,0,0.2);
    overflow: hidden;
    position: relative;
    animation: fadeIn 0.5s ease-out;
}

.mood-box:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 12px rgba(0,0,0,0.3);
}

.mood-text {
    font-size: 12px;
    text-align: center;
    padding: 0 6px;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    font-weight: 500;
}
```

2. 缩小活动类型墙方块尺寸：
```css
.activity-box {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 3px 8px rgba(0,0,0,0.2);
    overflow: hidden;
    position: relative;
    animation: fadeIn 0.5s ease-out;
}

.activity-box:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 12px rgba(0,0,0,0.3);
}

.activity-text {
    font-size: 12px;
    text-align: center;
    padding: 0 6px;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    font-weight: 500;
}
```

### 修改文件: `/templates/records.html`

添加处理URL参数中recordId的代码，以便从情绪墙和活动类型墙打开记录详情时能正确显示：
```javascript
// 检查URL参数中是否有recordId，如果有则自动打开记录详情
const urlParams = new URLSearchParams(window.location.search);
const recordId = urlParams.get('recordId');
if (recordId) {
    // 延迟一段时间确保页面加载完成后再打开详情
    setTimeout(() => {
        showRecordDetail(recordId);
    }, 500);
}
```

## 验证结果
修复后：
1. 情绪墙中的情绪方块可以正确打开对应的记录详情
2. 活动类型墙中的活动方块可以正确打开对应的记录详情
3. 情绪墙和活动类型墙的方块尺寸已缩小，页面展示效果更佳