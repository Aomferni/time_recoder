# 修复记录：活动详情弹窗宽度调整

## 问题描述
用户要求活动详情的弹窗应该占据整个宽度的3/5（60%），但当前实现中不同页面的活动详情弹窗宽度设置不一致。

## 解决方案
统一所有页面的活动详情弹窗宽度设置，确保都占据页面的3/5宽度。

## 修改内容

### 1. CSS样式调整
修改[detail-modal.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/detail-modal.css)文件中的[.modal-content](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/detail-modal.css#L76-L92)样式：

```css
.modal-content {
    background-color: #fff;
    margin: 5% auto;
    padding: 20px;
    border: none;
    border-radius: 12px;
    width: 60%; /* 占据页面的3/5 */
    max-width: 1000px; /* 设置最大宽度 */
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    animation: modalSlideIn 0.3s ease-out;
}
```

### 2. 样式统一
确保所有页面（首页、历史记录页、情绪墙页等）的活动详情弹窗都使用相同的样式设置：
- 宽度设置为60%（占据页面的3/5）
- 最大宽度限制为1000px
- 最大高度限制为90vh
- 添加垂直滚动条以处理内容过多的情况

## 验证结果
通过本地测试，确认活动详情弹窗现在正确占据页面宽度的3/5，提升了用户体验和视觉效果。

## 影响范围
- 所有页面的活动详情弹窗
- 不影响其他功能模块
- 保持响应式设计，在移动端也能正常显示