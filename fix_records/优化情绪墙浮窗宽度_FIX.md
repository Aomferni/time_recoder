# 优化情绪墙浮窗宽度

## 问题描述
情绪墙页面中的活动详情浮窗宽度不足页面整体的1/3，用户希望浮窗能占据页面的3/5（60%），以提供更好的显示效果和用户体验。

## 修复方案
修改mood-wall.css中的.modal-content样式，调整宽度设置：
- 将width从90%改为60%，占据页面的3/5
- 设置max-width为1000px，确保在大屏幕上不会过宽
- 添加margin: 5% auto，确保浮窗居中显示

## 修改的文件

### 1. mood-wall.css
```css
.modal-content {
    background-color: white;
    border-radius: 12px;
    padding: 25px;
    width: 60%; /* 占据页面的3/5 */
    max-width: 1000px; /* 设置最大宽度 */
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 8px 30px rgba(0,0,0,0.2);
    animation: modalAppear 0.3s ease-out;
    margin: 5% auto; /* 居中显示 */
}
```

## 验证结果
修改后，情绪墙页面中的活动详情浮窗宽度占据页面的3/5，提供更大的显示空间，改善了用户体验。浮窗仍然保持居中显示，并且在大屏幕上不会超过1000px的宽度。

## 相关规范
根据项目规范，活动详情浮窗最大宽度应设置为1000px，提供足够的显示空间，本次修改符合该规范。