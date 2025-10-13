# 去除导入记录按钮周边方框

## 功能描述
去除历史记录页面中【导入记录】按钮周边的方框，使按钮与其他操作按钮保持一致的布局和视觉效果。

## 实现方案
1. 修改records.html文件，调整导入记录按钮的HTML结构
2. 移除不再需要的.import-section容器样式

## 修改的函数和数据流逻辑

### HTML结构修改
1. 在records.html中移除包裹导入记录按钮的.import-section div容器
2. 将导入记录相关的元素与其他按钮放在同一级别

### CSS样式修改
1. 移除.import-section相关样式定义

## 代码修改

### records.html
```html
<!-- 修改前 -->
<div class="filter-actions">
    <button class="control-btn search-btn" onclick="applyFilters()">搜索</button>
    <button class="control-btn reset-btn" onclick="resetFilters()">重置</button>
    <button class="control-btn export-btn" onclick="exportRecords()">导出记录</button>
    <!-- 导入记录按钮 -->
    <div class="import-section">
        <input type="file" id="recordFileInput" accept=".json" class="file-input" style="display: none;">
        <button class="control-btn import-btn" id="importRecordBtn">导入记录</button>
        <div id="importStatus" class="import-status"></div>
    </div>
</div>

<!-- 修改后 -->
<div class="filter-actions">
    <button class="control-btn search-btn" onclick="applyFilters()">搜索</button>
    <button class="control-btn reset-btn" onclick="resetFilters()">重置</button>
    <button class="control-btn export-btn" onclick="exportRecords()">导出记录</button>
    <!-- 导入记录按钮 -->
    <input type="file" id="recordFileInput" accept=".json" class="file-input" style="display: none;">
    <button class="control-btn import-btn" id="importRecordBtn">导入记录</button>
    <div id="importStatus" class="import-status"></div>
</div>
```

### records-controls.css
```css
/* 移除.import-section相关样式 */
/* 之前存在的.import-section样式定义已被移除 */
```

## 验证结果
修改后，历史记录页面中的【导入记录】按钮不再被方框包裹，与其他操作按钮（搜索、重置、导出记录）保持一致的布局和视觉效果。按钮仍然保持原有的功能，用户可以正常点击导入记录。