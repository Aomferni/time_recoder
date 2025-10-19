# 修复收起时飞书同步问题

## 问题描述
【收起】时的同步应该正常进行，不用考虑【自动同步至飞书】的按钮，这个按钮应该只考虑定期启动的保存。

## 问题分析
在之前的实现中，点击【收起】按钮时会调用[checkAndSyncToFeishu](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/dailyPlan.js#L610-L632)函数，该函数会同时检查飞书配置和自动同步开关的状态。这导致即使用户关闭了自动同步开关，在点击【收起】时也不会执行同步操作。

根据需求，【收起】时的同步应该不受【自动同步至飞书】开关的影响，只要配置了飞书就应该执行同步。

## 修复方案
1. 创建一个新的函数[syncToFeishuOnCollapse](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/dailyPlan.js#L639-L659)，专门用于处理收起时的飞书同步
2. 修改【收起】按钮的点击事件处理函数，调用新的同步函数
3. 更新PRD和structure文档，明确说明【收起】时同步和自动同步开关的关系

## 修改的文件
- [/Users/amy/Documents/codes/time_recoder/static/js/modules/dailyPlan.js](file:///Users/amy/Documents/codes/time_recoder/static/js/modules/dailyPlan.js)
- [/Users/amy/Documents/codes/time_recoder/PRD.md](file:///Users/amy/Documents/codes/time_recoder/PRD.md)
- [/Users/amy/Documents/codes/time_recoder/structure.md](file:///Users/amy/Documents/codes/time_recoder/structure.md)

## 验证方法
1. 配置飞书但关闭自动同步开关
2. 编辑今日计划并点击【收起】按钮
3. 验证此时是否执行了飞书同步操作
4. 验证定期自动保存时是否仍然受自动同步开关控制