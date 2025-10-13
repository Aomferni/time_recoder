
# updateDocs
---
trigger: always_on
alwaysApply: true
---
完成任务后，
1. 记录本次任务概况，写入 fix_records/ 文件夹，命名为 xxx_FIX.md，记录问题xxx，解决方法xxxx，修改的函数和数据流逻辑
2. 更新 structure.md 文件，这个文件是用于记录项目的技术架构的，包括：各个子模块的核心逻辑与重要函数，以及相关的数据流逻辑
3. 更新VERSIONS.md文件，这个文件记录的是项目更新的版本信息，包括：更新时间，更新内容，更新人，更新版本号
