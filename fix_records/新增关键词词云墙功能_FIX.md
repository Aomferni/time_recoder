# 新增关键词词云墙功能

## 功能描述
在情绪墙与活动类型墙页面中新增关键词词云展示功能，展示用户近7天内记录中关键词的出现频率。

## 实现方案
1. 在后端添加关键词统计功能
2. 扩展API接口，返回关键词词云数据
3. 修改前端页面，添加关键词词云展示区域
4. 添加相应的CSS样式美化展示效果

## 修改文件

### 1. 修改文件
- [/Users/amy/Documents/codes/time_recoder/app.py](file:///Users/amy/Documents/codes/time_recoder/app.py)
  - 添加`get_keyword_cloud_data`静态方法用于获取关键词统计数据
  - 更新`/api/mood-wall` API路由，添加关键词词云数据返回

- [/Users/amy/Documents/codes/time_recoder/templates/mood_wall.html](file:///Users/amy/Documents/codes/time_recoder/templates/mood_wall.html)
  - 添加关键词词云展示区域
  - 添加渲染关键词词云的JavaScript函数

- [/Users/amy/Documents/codes/time_recoder/static/css/modules/mood-wall.css](file:///Users/amy/Documents/codes/time_recoder/static/css/modules/mood-wall.css)
  - 添加关键词词云的样式定义

## 功能特点
1. 默认展示近7天的关键词统计数据
2. 从活动名称和备注信息中提取关键词
3. 根据关键词出现次数调整显示大小
4. 使用不同颜色区分不同关键词
5. 支持悬停显示详细信息

## 数据处理逻辑
1. 关键词提取：
   - 从活动名称中提取关键词（按空格分割）
   - 从备注信息中提取关键词（使用正则表达式提取中文字符和英文单词）
   - 过滤单字符关键词

2. 统计逻辑：
   - 统计每个关键词在近7天内的出现次数
   - 按出现次数排序，取前20个关键词展示

3. 展示逻辑：
   - 根据出现次数调整关键词显示的字体大小
   - 为每个关键词分配颜色
   - 支持悬停显示关键词和出现次数

## 验证方法
1. 访问情绪墙页面
2. 查看页面底部的关键词词云展示
3. 检查关键词是否正确反映用户近7天的记录内容
4. 验证关键词大小是否根据出现次数正确调整
5. 悬停关键词查看详细信息是否正确显示

## 影响范围
本次新增功能不影响现有功能，只在情绪墙页面增加了关键词词云展示。