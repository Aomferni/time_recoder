# 修复情绪墙颜色显示问题

## 问题描述
情绪墙中的所有情绪方块几乎都显示为灰色，这是因为utils.js中的getEmotionColor函数仍然使用旧的情绪颜色映射，而没有更新为新的情绪类型和色系配置。

## 解决方案
修改utils.js中的getEmotionColor函数，使其与app.py、mood_wall.html和config.js中的情绪定义保持一致：

1. 更新utils.js中的情绪颜色映射
2. 确保所有文件中的情绪定义和颜色配置保持一致

## 修改的文件
- `/static/js/modules/utils.js`：更新情绪颜色映射函数

## 验证结果
通过预览浏览器查看，情绪墙中的情绪方块现在能正确显示对应的颜色，不再显示为灰色。