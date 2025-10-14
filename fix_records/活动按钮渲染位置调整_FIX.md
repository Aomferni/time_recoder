# 活动按钮渲染位置调整

## 问题描述
活动按钮的渲染位置不正确，没有渲染到"选择活动"标题的下方。

## 解决方案
修改活动按钮渲染逻辑，使其准确地渲染到包含"选择活动"标题的section元素下方。

### 修改内容
1. 修改[updateActivityButtons](file:///Users/mac/Documents/local-Datawhale%E6%95%99%E7%A0%94/%E5%A5%BD%E7%94%A8%E7%9A%84%E5%B7%A5%E5%85%B7/time_recoder/static/js/modules/ui.js#L34-L136)函数，查找包含"选择活动"标题的特定section元素
2. 将活动按钮渲染到正确的section中，而不是第一个section元素

## 修改文件
- `static/js/modules/ui.js` - UI模块修改

## 测试验证
1. 重启服务器，确保修改生效
2. 访问首页，检查活动按钮是否渲染到"选择活动"标题下方

## 效果
修改后，活动按钮能够准确地渲染到"选择活动"标题的下方，页面布局更加清晰和符合预期。