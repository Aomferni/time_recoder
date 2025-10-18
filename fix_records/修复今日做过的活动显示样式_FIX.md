# 修复今日做过的活动显示样式

## 问题描述
在主页的"今日计划"区域中，"🎯 今日做过的活动"部分显示的活动名称样式有问题，文字颜色与背景颜色相同（白色文字在白色背景上），导致用户无法看清活动名称。

## 问题分析
通过检查代码发现，在 `static/css/modules/daily-plan.css` 文件中，`.activity-name` 类没有明确设置文字颜色，导致继承了父元素的颜色属性，在某些情况下显示为白色文字在白色背景上。

进一步分析发现，问题的根本原因是CSS样式冲突。在 `static/css/style.css` 文件中也定义了 `.activity-name` 样式，而且这个文件可能在某些情况下会覆盖 `daily-plan.css` 中的样式设置。

## 解决方法
为了解决CSS样式冲突问题，采用了两种策略：

1. 提高选择器的特异性，在 `static/css/modules/daily-plan.css` 文件中修改 `.activity-name` 选择器为更具体的形式：
```css
.activity-item .activity-name {
    font-weight: 500;
    color: white; /* 设置活动名称为白色以便在半透明背景上清晰可见 */
}
```

2. 使用 `!important` 声明强制应用样式：
```css
.activity-item .activity-name {
    font-weight: 500;
    color: white !important; /* 设置活动名称为白色以便在半透明背景上清晰可见 */
}
```

通过增加父元素选择器 `.activity-item` 提高选择器特异性，并使用 `!important` 声明确保样式优先级最高。

## 修改的文件
- `static/css/modules/daily-plan.css` - 第399行，将 `.activity-name` 选择器修改为 `.activity-item .activity-name` 并添加 `!important` 声明

## 验证结果
修改后，"今日做过的活动"部分的活动名称现在可以清晰可见，文字为白色显示在半透明背景上，符合整体设计风格。无论在何种CSS加载顺序下都能正确显示。