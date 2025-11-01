/**
 * 今日计划左侧可展开折叠模块
 */

export const DailyPlanCollapsibleModule = {
    /**
     * 初始化左侧可展开折叠模块
     */
    init: function() {
        console.log('初始化今日计划左侧可展开折叠模块');
        this.bindEvents();
        // 默认展开左侧折叠区域
        this.setCollapsibleState(true);
    },
    
    /**
     * 绑定事件
     */
    bindEvents: function() {
        // 左侧折叠区域手柄点击事件
        const handle = document.getElementById('collapsible-handle');
        if (handle) {
            handle.addEventListener('click', () => {
                const collapsible = document.getElementById('daily-plan-collapsible');
                if (collapsible) {
                    const isExpanded = collapsible.classList.contains('expanded');
                    this.setCollapsibleState(!isExpanded);
                }
            });
        }
        
        // 顶部展开/收起按钮事件
        const toggleBtn = document.getElementById('plan-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const content = document.querySelector('.daily-plan-content');
                const statsFullWidth = document.getElementById('daily-plan-stats-full-width');
                
                if (content && statsFullWidth) {
                    const isHidden = content.style.display === 'none';
                    // 如果是收起操作（当前是展开状态），先保存并同步到飞书
                    if (!isHidden) {
                        console.log('收起计划，自动保存并同步到飞书...');
                        // 触发保存事件
                        window.dispatchEvent(new CustomEvent('dailyPlanSave'));
                        // 收起时的同步不受自动同步开关影响
                        window.dispatchEvent(new CustomEvent('dailyPlanSyncOnCollapse'));
                    }
                    this.setMainContentState(!isHidden);
                }
            });
        }
    },
    
    /**
     * 设置左侧折叠区域状态
     * @param {boolean} expanded - true表示展开，false表示收起
     */
    setCollapsibleState: function(expanded) {
        const collapsible = document.getElementById('daily-plan-collapsible');
        if (!collapsible) return;
        
        if (expanded) {
            collapsible.classList.add('expanded');
        } else {
            collapsible.classList.remove('expanded');
        }
    },
    
    /**
     * 设置右侧主要内容区域状态
     * @param {boolean} expanded - true表示展开，false表示收起
     */
    setMainContentState: function(expanded) {
        const content = document.querySelector('.daily-plan-content');
        const statsFullWidth = document.getElementById('daily-plan-stats-full-width');
        const toggleBtn = document.getElementById('plan-toggle-btn');
        
        if (!content || !statsFullWidth || !toggleBtn) return;
        
        if (expanded) {
            // 展开：显示完整内容，隐藏全宽统计数据
            content.style.display = 'grid';
            statsFullWidth.style.display = 'none';
            toggleBtn.textContent = '收起';
        } else {
            // 收起：隐藏完整内容，显示全宽统计数据
            content.style.display = 'none';
            statsFullWidth.style.display = 'block';
            toggleBtn.textContent = '展开';
        }
    }
};

// 导出供全局使用
window.DailyPlanCollapsibleModule = DailyPlanCollapsibleModule;