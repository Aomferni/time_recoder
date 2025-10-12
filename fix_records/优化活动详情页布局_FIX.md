# 优化活动详情页布局

## 问题描述
活动详情页需要优化布局：
1. 把记录情绪，放在记录收获的下方
2. 缩小其他信息的字体

## 解决方案
1. 调整HTML模板中记录情绪和记录收获的位置
2. 调整CSS样式，缩小其他信息的字体大小

## 修改内容

### 1. 调整HTML模板结构
在 [/templates/records.html](file:///Users/amy/Documents/codes/time_recoder/templates/records.html) 文件中，重新组织详情表单的布局结构：
- 将记录收获部分（[detail-remark-section](file:///Users/amy/Documents/codes/time_recoder/templates/records.html#L351-L357)）移到记录情绪部分之前
- 调整相关样式以确保布局正确

### 2. 调整CSS样式
在 [/static/css/modules/detail-form.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/detail-form.css) 和 [/static/css/modules/detail-sections.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/detail-sections.css) 文件中：
- 缩小其他信息的字体大小
- 调整相关样式以确保视觉效果一致

## 验证结果
修改后，活动详情页的布局符合要求：
1. 记录情绪部分正确显示在记录收获的下方
2. 其他信息的字体已缩小，视觉效果更佳