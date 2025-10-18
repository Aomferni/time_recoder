"""
时间记录器后端日志模块
统一处理所有后端日志记录功能
"""

import os
import json
import threading
from datetime import datetime, timedelta

# 日志存储文件路径
LOG_FILE = os.path.join('data', 'logs.txt')
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
                    # 读取所有日志行
                    lines = f.readlines()
                    logs = []
                    for line in lines:
                        # 解析日志行
                        if line.strip():
                            logs.append(line.strip())
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
                for log in logs:
                    f.write(log + '\n')
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
                # 从日志行中提取时间戳
                # 格式: [2025-10-19T05:35:07.091058] [INFO] [test_module] 验证日志清理功能
                if log.startswith('['):
                    end_timestamp = log.find(']')
                    if end_timestamp > 0:
                        timestamp_str = log[1:end_timestamp]
                        log_time = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
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
        timestamp = datetime.now().isoformat()
        log_entry = f"[{timestamp}] [{level.upper()}] [{module}] {message}"
        
        # 如果有附加数据，添加到日志条目中
        if data is not None:
            try:
                # 尝试将数据转换为JSON格式
                data_str = json.dumps(data, ensure_ascii=False)
                log_entry += f" {data_str}"
            except Exception:
                # 如果不能序列化，转换为字符串
                log_entry += f" {str(data)}"
        
        # 输出到控制台
        console_message = log_entry
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
        # 在文本日志中查找包含模块名的日志
        return [log for log in logs if f"[{module}]" in log]
    
    @staticmethod
    def get_logs_by_level(level):
        """获取指定级别的日志"""
        logs = TimeRecorderLogger.get_logs()
        # 在文本日志中查找包含级别名的日志
        return [log for log in logs if f"[{level.upper()}]" in log]