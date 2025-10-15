# 缩小活动按钮大小

## 问题描述
活动按钮的尺寸过大，占用过多页面空间，影响页面布局的紧凑性。

## 解决方案
调整活动按钮的CSS样式，缩小按钮的尺寸，使其更加紧凑。

### 修改内容
1. 调整.button-grid的grid-template-columns属性，从minmax(100px, 1fr)缩小到minmax(80px, 1fr)
2. 减小.activity-btn的padding、font-size、border-radius和min-height属性
3. 调整移动端样式，使其在小屏幕上也保持合适的尺寸
4. 微调按钮的阴影和动画效果，使其更加紧凑

## 修改文件
- `static/css/modules/activity-buttons.css` - 活动按钮样式修改

## 测试验证
1. 重启服务器，确保修改生效
2. 访问首页，检查活动按钮尺寸是否缩小
3. 验证按钮在不同屏幕尺寸下的显示效果

## 效果
修改后，活动按钮尺寸更加紧凑，页面布局更加清晰，用户体验得到提升。