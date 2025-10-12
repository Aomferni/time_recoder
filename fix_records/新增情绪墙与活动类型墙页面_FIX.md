# 新增情绪墙与活动类型墙页面

## 功能描述
新增一个页面用于展示用户每天的情绪墙和活动类型墙，以可视化的方式展示用户的情绪分布和活动类型分布。

## 实现方案
1. 创建新的HTML模板文件用于展示情绪墙和活动类型墙
2. 在后端添加新的API接口来获取情绪和活动类型统计数据
3. 添加前端JavaScript代码来处理数据展示和可视化
4. 添加相应的CSS样式来美化展示效果
5. 在导航中添加到新页面的链接

## 修改文件

### 1. 新增文件
- [/Users/amy/Documents/codes/time_recoder/templates/mood_wall.html](file:///Users/amy/Documents/codes/time_recoder/templates/mood_wall.html) - 情绪墙与活动类型墙页面模板
- [/Users/amy/Documents/codes/time_recoder/static/css/modules/mood-wall.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/mood-wall.css) - 情绪墙与活动类型墙页面样式

### 2. 修改文件
- [/Users/amy/Documents/codes/time_recoder/app.py](file:///Users/amy/Documents/codes/time_recoder/app.py)
  - 添加`get_mood_wall_data`静态方法用于获取情绪墙数据
  - 添加`get_activity_wall_data`静态方法用于获取活动类型墙数据
  - 添加`/mood-wall`路由用于渲染情绪墙页面
  - 添加`/api/mood-wall` API路由用于获取情绪墙和活动类型墙数据

- [/Users/amy/Documents/codes/time_recoder/templates/base.html](file:///Users/amy/Documents/codes/time_recoder/templates/base.html)
  - 添加对新CSS文件的引用

- [/Users/amy/Documents/codes/time_recoder/templates/index.html](file:///Users/amy/Documents/codes/time_recoder/templates/index.html)
  - 在导航中添加到情绪墙页面的链接

- [/Users/amy/Documents/codes/time_recoder/templates/records.html](file:///Users/amy/Documents/codes/time_recoder/templates/records.html)
  - 在导航中添加到情绪墙页面的链接

## 功能特点
1. 月度视图：可以查看指定月份的情绪和活动分布
2. 可视化展示：通过颜色深浅表示情绪强度和活动时长
3. 图例说明：提供情绪和活动类型的颜色图例
4. 响应式设计：适配不同屏幕尺寸
5. 交互操作：支持月份切换功能

## 数据处理逻辑
1. 情绪墙数据：
   - 统计用户指定月份每天记录的情绪
   - 通过颜色深浅表示情绪记录的频率
   - 提供情绪图例说明

2. 活动类型墙数据：
   - 统计用户指定月份每天的活动类型
   - 通过颜色深浅表示活动的时长
   - 提供活动类型图例说明

## 验证方法
1. 访问首页，点击"情绪与活动墙"链接
2. 查看当前月份的情绪墙和活动类型墙展示
3. 点击"上个月"或"下个月"按钮切换月份
4. 检查颜色图例是否正确显示
5. 验证数据是否正确反映用户记录的情绪和活动分布

## 影响范围
本次新增功能不影响现有功能，只增加了新的页面和API接口。