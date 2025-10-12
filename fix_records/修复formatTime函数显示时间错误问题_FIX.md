# 修复formatTime函数显示时间错误问题

## 问题描述
在打开活动详情页时，formatTime函数显示的时间不正确。传入的参数已经是北京时间，但函数仍然将其当作UTC时间处理并加了8小时，导致显示的时间错误。

具体表现为：
- formatTime: Mon Oct 13 2025 03:34:58 GMT+0800 (中国标准时间)
- utcDate: Mon Oct 13 2025 03:34:58 GMT+0800 (中国标准时间)
- beijingDate: Mon Oct 13 2025 11:34:58 GMT+0800 (中国标准时间)

## 问题分析
问题出在多个文件中时间处理逻辑不一致：

1. 在[records.html](file:///Users/amy/Documents/codes/time_recoder/templates/records.html)文件中调用[formatTime](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/utils.js#L76-L113)函数时，先将时间转换为北京时间（加8小时），然后再传给[formatTime](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/utils.js#L76-L113)函数。但[formatTime](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/utils.js#L76-L113)函数内部又会将传入的时间当作UTC时间处理，再次加8小时，导致时间被加了16小时。

2. [utils.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/utils.js)中的[formatTime](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/utils.js#L76-L113)函数在使用`toLocaleTimeString`时设置了`timeZone: 'UTC'`参数，这会导致时间显示不正确。

3. [records.html](file:///Users/amy/Documents/codes/time_recoder/templates/records.html)中的[updateTimeSpan](file:///Users/amy/Documents/codes/time_recoder/templates/records.html#L390-L404)函数中仍然存在时间处理不一致的问题。

4. [records.html](file:///Users/amy/Documents/codes/time_recoder/templates/records.html)中添加段落的部分也存在时间处理问题。

## 修复方案
1. 修改[records.html](file:///Users/amy/Documents/codes/time_recoder/templates/records.html)文件中调用[formatTime](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/utils.js#L76-L113)函数的地方，直接传入原始时间，让[formatTime](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/utils.js#L76-L113)函数内部处理时间转换。
2. 修复[utils.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/utils.js)中的[formatTime](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/utils.js#L76-L113)函数，移除`timeZone: 'UTC'`参数。
3. 修复[records.html](file:///Users/amy/Documents/codes/time_recoder/templates/records.html)中的[updateTimeSpan](file:///Users/amy/Documents/codes/time_recoder/templates/records.html#L390-L404)函数时间处理逻辑。
4. 修复[records.html](file:///Users/amy/Documents/codes/time_recoder/templates/records.html)中添加段落部分的时间处理逻辑。

## 修改文件
1. [/Users/amy/Documents/codes/time_recoder/templates/records.html](file:///Users/amy/Documents/codes/time_recoder/templates/records.html)
   - 修复记录表格中开始时间和结束时间的显示
   - 修复详情浮窗中开始时间和结束时间的显示
   - 修复段落时间处理逻辑
   - 修复updateTimeSpan函数时间处理逻辑
   - 修复添加段落部分的时间处理逻辑
2. [/Users/amy/Documents/codes/time_recoder/static/js/modules/utils.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/utils.js)
   - 修复formatTime函数实现

## 验证方法
1. 打开历史记录页面
2. 查看记录表格中的开始时间和结束时间显示是否正确
3. 点击任意记录查看详情，检查详情中的开始时间和结束时间显示是否正确
4. 检查段落时间显示是否正确
5. 修改开始时间和结束时间，检查时间跨度计算是否正确
6. 添加新段落，检查默认时间是否正确

## 影响范围
本次修复只影响时间显示逻辑，不会影响数据存储和后端处理逻辑。