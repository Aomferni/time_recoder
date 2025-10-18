# 新增项目初始化配置功能

## 问题描述
在项目首次启动时，用户需要配置飞书集成并从飞书多维表格同步活动记录和今日计划数据，但缺少相应的功能支持。

## 问题分析
1. 缺少初始化配置页面和相关流程引导
2. 没有在应用启动时检测是否已完成初始化配置
3. 缺少从飞书同步数据的API端点
4. 缺少初始化状态管理机制

## 解决方案
1. 创建初始化配置页面模板，引导用户完成飞书配置和数据同步
2. 在应用启动时检测初始化状态，未初始化则重定向到配置页面
3. 添加初始化相关的API端点，支持飞书配置保存和数据同步
4. 实现初始化状态管理机制，标记应用是否已完成初始化

## 修改的文件
1. [/Users/amy/Documents/codes/time_recoder/PRD.md](file:///Users/amy/Documents/codes/time_recoder/PRD.md)
   - 更新文档版本到v1.2.4
   - 添加项目初始化配置功能需求描述

2. [/Users/amy/Documents/codes/time_recoder/structure.md](file:///Users/amy/Documents/codes/time_recoder/structure.md)
   - 添加项目初始化数据同步的架构设计
   - 更新主模块功能描述

3. [/Users/amy/Documents/codes/time_recoder/templates/init.html](file:///Users/amy/Documents/codes/time_recoder/templates/init.html)
   - 创建初始化配置页面模板

4. [/Users/amy/Documents/codes/time_recoder/app.py](file:///Users/amy/Documents/codes/time_recoder/app.py)
   - 添加初始化工具类和状态管理
   - 添加初始化相关的API端点
   - 修改首页路由，未初始化时重定向到配置页面

5. [/Users/amy/Documents/codes/time_recoder/VERSIONS.md](file:///Users/amy/Documents/codes/time_recoder/VERSIONS.md)
   - 添加v2.7.48版本记录

## 验证方法
1. 启动应用，确认未初始化时会重定向到初始化配置页面
2. 在初始化页面完成飞书配置，确认配置能正确保存
3. 确认数据同步功能正常工作
4. 初始化完成后，应用能正常启动并显示同步的数据