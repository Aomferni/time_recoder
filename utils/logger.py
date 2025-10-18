"""
时间记录器后端日志模块
统一处理所有后端日志记录功能
"""

import os
import json
import threading
from datetime import datetime, timedelta
from collections import deque

# 日志存储文件路径
LOG_FILE = os.path.join('data', 'logs.json')
LOG_RETENTION_HOURS = 2  # 保留2小时内的日志

# 使用线程锁确保线程安全
_log_lock = threading.Lock()

class TimeRecorderLogger:
    """时间记录器后端日志类"""
    
    @staticmethod
    def _get_logs():
        """获取所有日志"""
        try:
            if os.path.exists(LOG_FILE):
                with open(LOG_FILE, 'r', encoding='utf-8') as f:
                    logs = json.load(f)
                    # 确保返回的是列表
                    if isinstance(logs, list):
                        return logs
            return []
        except Exception as e:
            print(f"读取日志文件失败: {e}")
            return []
    
    @staticmethod
    def _save_logs(logs):
        """保存日志到文件"""
        try:
            # 确保data目录存在
            os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
            
            # 清理过期日志
            logs = TimeRecorderLogger._cleanup_old_logs(logs)
            
            with open(LOG_FILE, 'w', encoding='utf-8') as f:
                json.dump(logs, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"保存日志文件失败: {e}")
    
    @staticmethod
    def _cleanup_old_logs(logs):
        """清理过期日志（仅保留2小时内的日志）"""
        cutoff_time = datetime.now() - timedelta(hours=LOG_RETENTION_HOURS)
        
        # 过滤掉过期的日志
        filtered_logs = []
        for log in logs:
            try:
                # 解析时间戳
                log_time = datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00'))
                if log_time >= cutoff_time:
                    filtered_logs.append(log)
            except Exception:
                # 如果时间戳解析失败，保留该日志
                filtered_logs.append(log)
        
        return filtered_logs
    
    @staticmethod
    def log(level, module, message, data=None):
        """
        记录日志
        :param level: 日志级别 (debug, info, warn, error)
        :param module: 模块名称
        :param message: 日志消息
        :param data: 附加数据（可选）
        """
        # 创建日志条目
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'level': level,
            'module': module,
            'message': message
        }
        
        # 如果有附加数据，添加到日志条目中
        if data is not None:
            # 确保数据可以被JSON序列化
            try:
                json.dumps(data)  # 测试是否可以序列化
                log_entry['data'] = data
            except Exception:
                # 如果不能序列化，转换为字符串
                log_entry['data'] = str(data)
        
        # 输出到控制台
        console_message = f"[{log_entry['timestamp']}] [{level.upper()}] [{module}] {message}"
        if level == 'error':
            print(f"ERROR: {console_message}")
        elif level == 'warn':
            print(f"WARNING: {console_message}")
        else:
            print(console_message)
        
        # 保存到文件（线程安全）
        with _log_lock:
            logs = TimeRecorderLogger._get_logs()
            logs.append(log_entry)
            TimeRecorderLogger._save_logs(logs)
    
    @staticmethod
    def debug(module, message, data=None):
        """记录调试日志"""
        TimeRecorderLogger.log('debug', module, message, data)
    
    @staticmethod
    def info(module, message, data=None):
        """记录信息日志"""
        TimeRecorderLogger.log('info', module, message, data)
    
    @staticmethod
    def warn(module, message, data=None):
        """记录警告日志"""
        TimeRecorderLogger.log('warn', module, message, data)
    
    @staticmethod
    def error(module, message, data=None):
        """记录错误日志"""
        TimeRecorderLogger.log('error', module, message, data)
    
    @staticmethod
    def get_logs():
        """获取所有日志（已清理过期日志）"""
        with _log_lock:
            logs = TimeRecorderLogger._get_logs()
            return TimeRecorderLogger._cleanup_old_logs(logs)
    
    @staticmethod
    def clear_logs():
        """清空所有日志"""
        with _log_lock:
            try:
                if os.path.exists(LOG_FILE):
                    os.remove(LOG_FILE)
            except Exception as e:
                print(f"清空日志文件失败: {e}")
    
    @staticmethod
    def get_logs_by_module(module):
        """获取指定模块的日志"""
        logs = TimeRecorderLogger.get_logs()
        return [log for log in logs if log.get('module') == module]
    
    @staticmethod
    def get_logs_by_level(level):
        """获取指定级别的日志"""
        logs = TimeRecorderLogger.get_logs()
        return [log for log in logs if log.get('level') == level]