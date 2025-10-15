# 项目说明文档数据结构映射修正说明

## 问题描述
在项目说明文档（project_description.html）中，记录数据结构映射部分存在错误：
1. [segments](file:///Users/mac/Documents/local-Datawhale%E6%95%99%E7%A0%94/%E5%A5%BD%E7%94%A8%E7%9A%84%E5%B7%A5%E5%85%B7/time_recoder/app.py#L619-L619)字段被错误地描述为字符串"段落记录"，而实际上它是一个包含段落信息的数组
2. 缺少[username](file:///Users/mac/Documents/local-Datawhale%E6%95%99%E7%A0%94/%E5%A5%BD%E7%94%A8%E7%9A%84%E5%B7%A5%E5%85%B7/time_recoder/structure.md#L300-L300)字段的说明
3. 字段描述不够准确，缺少时间格式等重要信息

## 修正内容
1. 修正[segments](file:///Users/mac/Documents/local-Datawhale%E6%95%99%E7%A0%94/%E5%A5%BD%E7%94%A8%E7%9A%84%E5%B7%A5%E5%85%B7/time_recoder/app.py#L619-L619)字段的数据结构，明确其为包含段落信息的数组
2. 添加[username](file:///Users/mac/Documents/local-Datawhale%E6%95%99%E7%A0%94/%E5%A5%BD%E7%94%A8%E7%9A%84%E5%B7%A5%E5%85%B7/time_recoder/structure.md#L300-L300)字段说明
3. 完善各字段的描述信息，包括时间格式、单位等

## 修正后的数据结构
```json
{
  "id": "记录唯一标识符",
  "username": "用户名",
  "activity": "活动名称",
  "activityCategory": "活动类别",
  "date": "记录日期（北京时间，格式：YYYY/MM/DD）",
  "startTime": "开始时间（UTC时间格式，ISO 8601）",
  "endTime": "结束时间（UTC时间格式，ISO 8601）",
  "duration": "计时时长（毫秒）",
  "timeSpan": "时间跨度（毫秒）",
  "remark": "备注信息",
  "emotion": "情绪标签",
  "pauseCount": "暂停次数",
  "segments": [
    {
      "start": "段落开始时间（UTC时间格式，ISO 8601）",
      "end": "段落结束时间（UTC时间格式，ISO 8601）",
      "duration": "段落持续时间（毫秒，可选）"
    }
  ]
}
```

## 验证结果
修正后，项目说明文档中的数据结构映射准确反映了实际的记录数据结构，便于开发者理解和使用。