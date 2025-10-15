# 修复情绪墙页面JavaScript错误

## 问题描述
情绪墙页面出现JavaScript错误：
```
Uncaught TypeError: Cannot set properties of null (setting 'textContent')
```
错误发生在试图设置`currentUsernameDisplay`元素的textContent属性，但该元素在页面中并不存在。

## 解决方案
移除试图设置不存在元素的代码，保留用户名初始化逻辑：
1. 移除`document.getElementById('currentUsernameDisplay').textContent = savedUsername;`代码
2. 移除`document.getElementById('currentUsernameDisplay').textContent = urlUsername;`代码
3. 保留用户名初始化和保存逻辑

## 修改的文件
- `/templates/mood_wall.html`：修复JavaScript错误

## 验证结果
通过预览浏览器查看，情绪墙页面现在能正常加载，不再出现JavaScript错误。