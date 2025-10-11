# 时间追踪器

一个基于Python Flask的时间追踪Web应用，帮助用户记录和管理日常活动时间。

## 功能特点

- 实时计时功能
- 活动分类管理
- 记录编辑和删除
- 数据持久化存储
- 统计信息展示

## 技术栈

- 后端：Python + Flask
- 前端：HTML + CSS + JavaScript
- 数据存储：JSON文件

## 安装和运行

1. 克隆项目代码

2. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```

3. 运行应用：
   ```bash
   python app.py
   ```

4. 在浏览器中访问 `http://localhost:5002`

## 项目结构

```
time_tracker/
├── app.py              # Flask应用主文件
├── requirements.txt    # 项目依赖
├── README.md           # 项目说明文档
├── data/               # 数据存储目录
├── templates/          # HTML模板目录
│   ├── base.html       # 基础模板
│   └── index.html      # 主页面模板
└── static/             # 静态文件目录
    ├── css/
    │   └── style.css   # 样式文件
    ├── js/
    │   └── script.js   # JavaScript文件
    ├── uploads/        # 上传文件目录
    └── output/         # 输出文件目录
```

## 使用说明

1. 选择一个活动类别
2. 点击"开始"按钮开始计时
3. 点击"停止"按钮结束计时并保存记录
4. 可以编辑或删除已保存的记录
5. 查看今日统计信息

## API接口

- `GET /api/records` - 获取今日记录
- `POST /api/records` - 添加新记录
- `PUT /api/records/<record_id>` - 更新记录
- `DELETE /api/records/<record_id>` - 删除记录
- `GET /api/stats` - 获取统计信息