/**
 * 历史记录页面的JavaScript模块
 */
import { FeishuConfigModule } from './feishuConfig.js';

class TimeRecorderRecords {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 1;
        this.allActivities = new Set();
        this.currentDetailRecordId = null; // 用于跟踪当前详情浮窗的记录ID
    }

    /**
     * 初始化页面
     */
    init() {
        // 页面加载完成后初始化
        document.addEventListener('DOMContentLoaded', () => {
            this.loadRecords();
            
            // 检查URL参数中是否有recordId，如果有则自动打开记录详情
            const urlParams = new URLSearchParams(window.location.search);
            const recordId = urlParams.get('recordId');
            if (recordId) {
                // 延迟一段时间确保页面加载完成后再打开详情
                setTimeout(() => {
                    this.showRecordDetail(recordId);
                }, 500);
            }
            
            // 点击表格外区域关闭浮窗
            document.addEventListener('click', (event) => {
                const modal = document.getElementById('recordDetailModal');
                if (event.target === modal) {
                    TimeRecorderRecordDetail.closeRecordDetailModal();
                }
            });
            
            // 添加键盘事件监听器，支持ESC键关闭模态框
            document.addEventListener('keydown', this.handleKeyDown.bind(this));
            
            // 添加导入记录相关事件监听器
            const importBtn = document.getElementById('importRecordBtn');
            const fileInput = document.getElementById('recordFileInput');
            
            if (importBtn && fileInput) {
                // 点击导入按钮时触发文件选择
                importBtn.addEventListener('click', () => {
                    fileInput.click();
                });
                
                // 文件选择后处理导入
                fileInput.addEventListener('change', () => {
                    if (fileInput.files && fileInput.files.length > 0) {
                        this.importRecordFile(fileInput.files[0]);
                    }
                });
            }
            
            // 监听其他页面的刷新信号
            window.addEventListener('storage', (e) => {
                if (e.key === 'timeRecorderRefreshSignal') {
                    // 当检测到刷新信号时，重新加载数据
                    if (e.newValue) {
                        try {
                            const signal = JSON.parse(e.newValue);
                            // 检查信号是否来自其他页面（避免自己刷新自己）
                            if (signal.sourcePage !== window.location.pathname) {
                                console.log('检测到其他页面的刷新信号，正在刷新当前页面数据...');
                                this.loadRecords();
                            }
                        } catch (error) {
                            console.error('解析刷新信号失败:', error);
                        }
                    }
                }
            });
            
            // 添加事件委托来处理记录表格中的按钮点击事件
            const recordsTable = document.querySelector('.records-table');
            if (recordsTable) {
                recordsTable.addEventListener('click', (event) => {
                    const target = event.target;
                    
                    // 处理活动标签点击事件（显示记录详情）
                    if (target.classList.contains('activity-label')) {
                        const recordId = target.getAttribute('data-record-id');
                        if (recordId) {
                            this.showRecordDetail(recordId);
                        }
                    }
                    
                    // 处理继续按钮点击事件
                    if (target.classList.contains('continue-btn')) {
                        const recordId = target.getAttribute('data-record-id');
                        if (recordId) {
                            this.continueActivity(recordId);
                        }
                    }
                    
                    // 处理删除按钮点击事件
                    if (target.classList.contains('delete-btn')) {
                        const recordId = target.getAttribute('data-record-id');
                        if (recordId) {
                            this.deleteRecord(recordId);
                        }
                    }
                });
            }
            
            // 添加事件委托来处理分页按钮点击事件
            const paginationEl = document.getElementById('pagination');
            if (paginationEl) {
                paginationEl.addEventListener('click', (event) => {
                    const target = event.target;
                    
                    // 处理分页按钮点击事件
                    if (target.classList.contains('page-btn')) {
                        const page = parseInt(target.getAttribute('data-page'));
                        if (!isNaN(page)) {
                            this.loadRecords(page);
                        }
                    }
                });
            }
        });
    }

    /**
     * 处理键盘事件
     */
    handleKeyDown(event) {
        // ESC键关闭模态框
        if (event.key === 'Escape') {
            TimeRecorderRecordDetail.closeRecordDetailModal();
        }
    }

    /**
     * 加载记录
     */
    loadRecords(page = 1) {
        console.log('[加载记录] 开始加载记录，页码:', page);
        this.currentPage = page;
        
        // 获取筛选参数
        const dateFrom = document.getElementById('dateFrom').value;
        const dateTo = document.getElementById('dateTo').value;
        const activity = document.getElementById('activityFilter').value;
        const emotion = document.getElementById('emotionFilter').value;
        const search = document.getElementById('searchInput').value;
        
        // 检查搜索值是否为浏览器自动生成的客户端ID，如果是则清空
        if (search && search.startsWith('cli_') && search.length === 17) {
            console.log('[加载记录] 检测到浏览器自动生成的客户端ID，清空搜索值:', search);
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = '';
            }
        }
        
        console.log('[加载记录] 筛选参数:', { dateFrom, dateTo, activity, emotion, search });
        
        // 构建查询参数
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('per_page', 20);
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        if (activity) params.append('activity', activity);
        if (emotion) params.append('emotion', emotion);
        if (search && !(search.startsWith('cli_') && search.length === 17)) params.append('search', search);
        
        // 显示加载状态
        const tbody = document.getElementById('recordsBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">加载中...</td></tr>';
        }
        
        // 使用模块化的API函数
        if (window.TimeRecorderAPI && typeof window.TimeRecorderAPI.loadAllRecords === 'function') {
            console.log('[加载记录] 使用模块化API函数');
            // 调用模块化的API函数
            window.TimeRecorderAPI.loadAllRecords(params)
                .then(data => {
                    console.log('[加载记录] API返回数据:', data);
                    if (data.success) {
                        this.updateRecordsTable(data.records);
                        this.updatePagination(data.pagination);
                        this.updateActivityFilter(data.records);
                    } else {
                        // 处理API返回的错误
                        console.error('加载记录失败:', data.error);
                        if (tbody) {
                            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: red;">加载记录失败: ${data.error}</td></tr>`;
                        }
                    }
                })
                .catch(error => {
                    console.error('加载记录失败:', error);
                    if (tbody) {
                        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: red;">加载记录失败，请查看控制台了解详情</td></tr>`;
                    }
                });
        } else {
            console.log('[加载记录] 使用fetch API');
            // 如果模块化函数不可用，使用原来的实现
            fetch(`/api/all-records?${params.toString()}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('[加载记录] fetch返回数据:', data);
                    if (data.success) {
                        this.updateRecordsTable(data.records);
                        this.updatePagination(data.pagination);
                        this.updateActivityFilter(data.records);
                    } else {
                        // 处理API返回的错误
                        console.error('加载记录失败:', data.error);
                        if (tbody) {
                            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: red;">加载记录失败: ${data.error}</td></tr>`;
                        }
                    }
                })
                .catch(error => {
                    console.error('加载记录失败:', error);
                    if (tbody) {
                        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: red;">加载记录失败，请查看控制台了解详情</td></tr>`;
                    }
                });
        }
    }

    /**
     * 更新记录表格
     */
    updateRecordsTable(records) {
        console.log('[更新记录表格] 开始更新记录表格，记录数:', records ? records.length : 0);
        const tbody = document.getElementById('recordsBody');
        if (!tbody) {
            console.error('找不到记录表格主体元素');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (!records || records.length === 0) {
            // 显示无数据提示
            console.log('[更新记录表格] 无记录数据，显示"暂无记录"');
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">暂无记录</td></tr>';
            return;
        }
        
        // 确保记录按开始时间倒序排列（最新的在前）
        const sortedRecords = [...records].sort((a, b) => {
            if (!a || !a.startTime || !b || !b.startTime) return 0;
            return new Date(b.startTime) - new Date(a.startTime);
        });
        
        console.log('[更新记录表格] 开始渲染记录');
        sortedRecords.forEach((record, index) => {
            console.log(`[更新记录表格] 渲染记录 ${index}:`, record);
            const activityClass = TimeRecorderFrontendUtils.getActivityClass(record.activity, record.activityCategory);
            
            // 处理情绪显示，添加颜色
            const emotionDisplay = record.emotion ? 
                record.emotion.split(', ').map(e => 
                    `<span class="emotion-tag" style="background-color: ${TimeRecorderFrontendUtils.getEmotionColor(e)};">${e}</span>`
                ).join(' ') : '';
            
            // 根据规范，duration记录所有segments累计的时间
            // 重新计算段落总时间以确保准确性
            let totalDuration = 0;
            if (record.segments && Array.isArray(record.segments)) {
                // 使用工具类计算所有段落的总时间
                totalDuration = TimeRecorderFrontendUtils.calculateSegmentsTotalTime(record.segments);
            }
            // 如果计算结果为0，使用record.duration作为后备值
            if (totalDuration === 0) {
                totalDuration = (record && record.duration) || 0;
            }
            
            const row = tbody.insertRow();
            // 只显示指定字段：日期、活动名称、开始时间、专注时长、备注信息、情绪
            row.innerHTML = `
                <td>${record.date || (record.startTime ? record.startTime.substring(0, 10).replace(/-/g, '/') : '')}</td>
                <td><span class="activity-label ${activityClass}" data-record-id="${record.id}">${record.activity}</span></td>
                <td>${TimeRecorderFrontendUtils.formatTime(new Date(record.startTime))}</td>
                <td>${TimeRecorderFrontendUtils.formatDuration(totalDuration)}</td>
                <td class="remark-cell" title="${record.remark || ''}">${record.remark || ''}</td>
                <td>${emotionDisplay}</td>
                <td>
                    <button class="continue-btn" data-record-id="${record.id}">继续</button>
                    <button class="delete-btn" data-record-id="${record.id}">删除</button>
                </td>
            `;
        });
        console.log('[更新记录表格] 记录表格更新完成');
    }

    /**
     * 继续选中的活动
     */
    continueActivity(recordId) {
        // 通过API获取指定记录的详细信息
        fetch(`/api/records/${recordId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const record = data.record;
                    
                    // 重定向到首页并传递活动信息
                    // 使用localStorage传递数据
                    localStorage.setItem('continueActivity', JSON.stringify({
                        activity: record.activity,
                        activityCategory: record.activityCategory,
                        remark: record.remark || '',
                        emotion: record.emotion || '',
                        recordId: record.id, // 传递记录ID
                        autoStart: true // 标记需要自动开始计时
                    }));
                    
                    // 跳转到首页
                    window.location.href = '/';
                } else {
                    console.error('获取记录详情失败:', data.error);
                }
            })
            .catch(error => {
                console.error('获取记录详情失败:', error);
            });
    }

    /**
     * 显示记录详情浮窗
     */
    showRecordDetail(recordId) {
        // 使用统一的记录详情组件
        TimeRecorderRecordDetail.showRecordDetail(recordId);
    }

    /**
     * 更新分页控件
     */
    updatePagination(pagination) {
        console.log('[更新分页] 开始更新分页控件:', pagination);
        this.totalPages = pagination.pages;
        const paginationEl = document.getElementById('pagination');
        
        if (!paginationEl) {
            console.error('找不到分页控件元素');
            return;
        }
        
        // 如果当前页超出总页数且总页数大于0，调整到最后一页
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
            console.log('[更新分页] 当前页超出总页数，调整到最后一页');
            this.currentPage = this.totalPages;
        }
        
        // 如果当前页小于1，调整到第一页
        if (this.currentPage < 1) {
            console.log('[更新分页] 当前页小于1，调整到第一页');
            this.currentPage = 1;
        }
        
        let paginationHTML = '';
        
        // 上一页按钮
        if (this.currentPage > 1) {
            paginationHTML += `<button class="page-btn" data-page="${this.currentPage - 1}">上一页</button>`;
        }
        
        // 页码按钮
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<button class="active">${i}</button>`;
            } else {
                paginationHTML += `<button class="page-btn" data-page="${i}">${i}</button>`;
            }
        }
        
        // 下一页按钮
        if (this.currentPage < this.totalPages) {
            paginationHTML += `<button class="page-btn" data-page="${this.currentPage + 1}">下一页</button>`;
        }
        
        paginationEl.innerHTML = paginationHTML;
        console.log('[更新分页] 分页控件更新完成');
    }

    /**
     * 更新活动筛选下拉框
     */
    updateActivityFilter(records) {
        const activityFilter = document.getElementById('activityFilter');
        if (!activityFilter) {
            console.error('找不到活动筛选下拉框元素');
            return;
        }
        
        const currentSelection = activityFilter.value;
        
        // 清空现有选项（保留第一个"全部活动"选项）
        while (activityFilter.options.length > 1) {
            activityFilter.remove(1);
        }
        
        // 重新收集所有活动
        this.allActivities.clear();
        records.forEach(record => {
            if (record.activity) {
                this.allActivities.add(record.activity);
            }
        });
        
        // 添加所有活动选项
        this.allActivities.forEach(activity => {
            const option = document.createElement('option');
            option.value = activity;
            option.text = activity;
            activityFilter.add(option);
        });
        
        // 恢复之前的选中项
        activityFilter.value = currentSelection;
    }

    /**
     * 应用筛选条件
     */
    applyFilters() {
        this.loadRecords(1);
    }

    /**
     * 重置筛选条件
     */
    resetFilters() {
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        const activityFilter = document.getElementById('activityFilter');
        const emotionFilter = document.getElementById('emotionFilter');
        const searchInput = document.getElementById('searchInput');
        
        if (dateFrom) dateFrom.value = '';
        if (dateTo) dateTo.value = '';
        if (activityFilter) activityFilter.value = '';
        if (emotionFilter) emotionFilter.value = '';
        if (searchInput) searchInput.value = '';
        
        this.loadRecords(1);
    }

    /**
     * 删除记录
     */
    deleteRecord(recordId) {
        if (!confirm('确定要删除这条记录吗？')) {
            return;
        }
        
        fetch(`/api/records/${recordId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                console.log('[删除记录] 删除成功，准备刷新页面');
                // 删除成功后重新加载当前页面数据
                // 如果当前页面没有数据了且不是第一页，加载前一页
                const tbody = document.getElementById('recordsBody');
                console.log('[删除记录] 当前tbody行数:', tbody ? tbody.rows.length : 'tbody不存在');
                
                if (tbody && tbody.rows.length <= 1) { // 只有表头或没有数据行
                    console.log('[删除记录] 当前页面无数据，尝试加载前一页');
                    if (this.currentPage > 1) {
                        console.log('[删除记录] 加载前一页:', this.currentPage - 1);
                        this.loadRecords(this.currentPage - 1);
                    } else {
                        console.log('[删除记录] 当前为第一页，重新加载第一页');
                        this.loadRecords(1);
                    }
                } else {
                    console.log('[删除记录] 当前页面有数据，重新加载当前页:', this.currentPage);
                    this.loadRecords(this.currentPage);
                }
                
                // 发送刷新信号给其他页面
                console.log('[删除记录] 发送刷新信号给其他页面');
                this.sendRefreshSignal();
            } else {
                alert('删除记录失败: ' + data.error);
            }
        })
        .catch(error => {
            console.error('删除记录失败:', error);
            alert('删除记录失败，请查看控制台了解详情');
        });
    }

    /**
     * 导出记录
     */
    exportRecords() {
        // 显示确认对话框
        if (!confirm('确定要导出所有记录吗？')) {
            return;
        }
        
        // 发送请求导出记录
        fetch(`/api/export-records`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 创建要下载的JSON数据
                    const jsonData = JSON.stringify(data.records, null, 2);
                    
                    // 创建Blob对象
                    const blob = new Blob([jsonData], { type: 'application/json' });
                    
                    // 创建下载链接
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `records.json`;
                    
                    // 触发下载
                    document.body.appendChild(a);
                    a.click();
                    
                    // 清理
                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }, 100);
                    
                    alert(`成功导出 ${data.records.length} 条记录`);
                } else {
                    alert('导出记录失败: ' + data.error);
                }
            })
            .catch(error => {
                console.error('导出记录失败:', error);
                alert('导出记录失败，请查看控制台了解详情');
            });
    }

    /**
     * 导入记录文件函数
     */
    importRecordFile(file) {
        if (!file) {
            this.showImportStatus('请选择要导入的文件', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        
        this.showImportStatus('正在导入...', 'info');
        
        fetch('/api/import-records', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showImportStatus(`导入成功！共导入 ${data.imported_count} 条记录`, 'success');
                // 清空文件选择
                const fileInput = document.getElementById('recordFileInput');
                if (fileInput) {
                    fileInput.value = '';
                }
                // 重新加载记录
                this.loadRecords();
                
                // 发送刷新信号给其他页面
                this.sendRefreshSignal();
            } else {
                this.showImportStatus(`导入失败: ${data.error}`, 'error');
            }
        })
        .catch(error => {
            console.error('导入记录失败:', error);
            this.showImportStatus('导入失败，请查看控制台了解详情', 'error');
        });
    }
    
    /**
     * 发送刷新信号给其他页面
     */
    sendRefreshSignal() {
        // 通过localStorage传递刷新信号
        // 使用时间戳确保唯一性
        const refreshSignal = {
            timestamp: Date.now(),
            sourcePage: window.location.pathname
        };
        
        // 存储刷新信号到localStorage
        localStorage.setItem('timeRecorderRefreshSignal', JSON.stringify(refreshSignal));
        
        // 设置一个定时器，在一段时间后清除刷新信号
        setTimeout(() => {
            localStorage.removeItem('timeRecorderRefreshSignal');
        }, 5000);
    }
    
    /**
     * 显示飞书配置模态框
     */
    async showFeishuConfig() {
        // 复用飞书配置模块
        return FeishuConfigModule.showFeishuConfig();
    }
    
    /**
     * 关闭飞书配置模态框
     */
    closeFeishuConfigModal() {
        // 复用飞书配置模块
        return FeishuConfigModule.closeFeishuConfig();
    }
    
    /**
     * 保存飞书配置
     */
    async saveFeishuConfig() {
        // 复用飞书配置模块
        return FeishuConfigModule.saveFeishuConfig();
    }
    
    /**
     * 导出记录到飞书多维表格
     */
    async importRecordsToFeishu() {
        if (!confirm('确定要将所有记录导出到飞书多维表格吗？')) {
            return;
        }
        
        this.showImportStatus('正在获取记录...', 'info');
        
        try {
            // 获取所有记录
            const response = await fetch('/api/all-records');
            const data = await response.json();
            
            if (data.success) {
                this.showImportStatus('正在导出到飞书...', 'info');
                
                // 动态导入飞书客户端模块并导出记录
                const module = await import('/static/js/modules/feishuClient.js');
                const feishuClient = new module.FeishuBitableClient();
                const result = await feishuClient.importRecordsToBitable(data.records);
                
                if (result.success) {
                    this.showImportStatus(result.message, 'success');
                } else {
                    throw new Error(result.error || '导出失败');
                }
            } else {
                throw new Error(data.error || '获取记录失败');
            }
        } catch (error) {
            console.error('导出到飞书失败:', error);
            this.showImportStatus(`导出失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 从飞书同步记录（与飞书配置页的导入功能保持一致）
     */
    async syncRecordsFromFeishu() {
        if (!confirm('确定要从飞书多维表格同步记录到本地吗？')) {
            return;
        }
        
        try {
            // 显示导入状态
            this.showImportStatus('正在从飞书同步记录...', 'info');
            
            // 调用后端API从飞书同步活动记录
            const recordsResponse = await fetch('/api/init/sync-records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const recordsData = await recordsResponse.json();
            
            if (!recordsData.success) {
                throw new Error(recordsData.error || '从飞书同步活动记录失败');
            }
            
            // 从飞书同步今日计划
            const plansResponse = await fetch('/api/feishu/sync-plans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const plansData = await plansResponse.json();
            
            if (!plansData.success) {
                throw new Error(plansData.error || '从飞书同步今日计划失败');
            }
            
            this.showImportStatus(`同步成功：活动记录和今日计划已更新`, 'success');
            
            // 重新加载记录
            await this.loadRecords();
        } catch (error) {
            console.error('从飞书同步记录失败:', error);
            this.showImportStatus(`同步失败: ${error.message}`, 'error');
        }
    }

    /**
     * 从飞书导入信息（统一实现）
     */
    importFromFeishu() {
        if (!confirm('确定要从飞书多维表格导入信息到本地吗？这将同步records.json和plans.json文件。')) {
            return;
        }
        
        this.showImportStatus('正在从飞书导入信息...', 'info');
        
        // 调用后端API从飞书同步活动记录
        fetch('/api/init/sync-records', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(recordsData => {
            if (!recordsData.success) {
                throw new Error(recordsData.error || '从飞书同步活动记录失败');
            }
            
            // 从飞书同步今日计划
            return fetch('/api/feishu/sync-plans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(response => response.json());
        })
        .then(plansData => {
            if (!plansData.success) {
                throw new Error(plansData.error || '从飞书同步今日计划失败');
            }
            
            this.showImportStatus(`导入成功：活动记录和今日计划已同步`, 'success');
            // 重新加载记录
            this.loadRecords();
            
            // 发送刷新信号给其他页面
            this.sendRefreshSignal();
        })
        .catch(error => {
            console.error('从飞书导入信息失败:', error);
            this.showImportStatus(`导入失败: ${error.message}`, 'error');
        });
    }

    /**
     * 显示导入状态
     */
    showImportStatus(message, type) {
        const importStatus = document.getElementById('importStatus');
        if (importStatus) {
            importStatus.textContent = message;
            importStatus.className = `import-status ${type}`;
            importStatus.style.display = 'block';
            
            // 3秒后自动隐藏成功消息
            if (type === 'success') {
                setTimeout(() => {
                    importStatus.style.display = 'none';
                }, 3000);
            }
        }
    }
}

// 创建全局实例
window.timeRecorderRecords = new TimeRecorderRecords();
window.timeRecorderRecords.init();