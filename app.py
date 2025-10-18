import os
import json
from datetime import datetime, date, timezone, timedelta
import uuid
import glob
import re
from flask import Flask, render_template, request, jsonify
import requests
import time

# 导入日志模块
from utils.logger import TimeRecorderLogger

# 设置北京时区
BEIJING_TZ = timezone(timedelta(hours=8))

app = Flask(__name__)

# 配置文件路径
DATA_FOLDER = 'data'
app.config['DATA_FOLDER'] = DATA_FOLDER

# 确保目录存在
os.makedirs(DATA_FOLDER, exist_ok=True)

# 添加初始化状态文件路径
INIT_STATUS_FILE = os.path.join('config', 'init_status.json')


class TimeRecorderUtils:
    """时间记录器工具类，包含常用的工具函数"""
    
    @staticmethod
    def get_data_file_path():
        """获取数据文件路径"""
        data_file = os.path.join(app.config['DATA_FOLDER'], 'records.json')
        return data_file
    
    @staticmethod
    def load_records():
        """加载所有记录"""
        data_file = TimeRecorderUtils.get_data_file_path()
        if os.path.exists(data_file):
            try:
                with open(data_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"读取记录文件出错: {e}")
                return []
        return []
    
    @staticmethod
    def load_all_records():
        """加载所有记录"""
        all_records = []
        
        # 加载记录文件
        data_file = TimeRecorderUtils.get_data_file_path()
        if os.path.exists(data_file):
            try:
                with open(data_file, 'r', encoding='utf-8') as f:
                    records = json.load(f)
                    for record in records:
                        # 确保记录包含date字段，使用北京时间的日期
                        if 'date' not in record and 'startTime' in record:
                            # 将UTC时间转换为北京时间后提取日期
                            utc_time = datetime.fromisoformat(record['startTime'].replace('Z', '+00:00'))
                            beijing_time = utc_time.replace(tzinfo=timezone.utc).astimezone(BEIJING_TZ)
                            record['date'] = beijing_time.strftime('%Y/%m/%d')
                    all_records.extend(records)
            except Exception as e:
                print(f"读取记录文件出错 {data_file}: {e}")
        
        # 按开始时间倒序排列，但要确保记录有startTime字段
        all_records.sort(key=lambda x: x.get('startTime', ''), reverse=True)
        return all_records
    
    @staticmethod
    def save_records(records):
        """保存记录到文件"""
        data_file = TimeRecorderUtils.get_data_file_path()
        os.makedirs(os.path.dirname(data_file), exist_ok=True)
        try:
            with open(data_file, 'w', encoding='utf-8') as f:
                json.dump(records, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"保存记录文件出错: {e}")
            return False
    
    @staticmethod
    def find_record_by_id(records, record_id):
        """根据ID查找记录"""
        for record in records:
            if record['id'] == record_id:
                return record
        return None
    
    @staticmethod
    def format_date_from_start_time(start_time):
        """从开始时间提取日期并格式化为北京时间"""
        if start_time:
            # 将UTC时间转换为北京时间后提取日期
            utc_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            beijing_time = utc_time.replace(tzinfo=timezone.utc).astimezone(BEIJING_TZ)
            return beijing_time.strftime('%Y/%m/%d')
        return ''
    
    @staticmethod
    def calculate_segments_total_time(segments):
        """计算所有段落的总时间"""
        total_time = 0
        if segments and isinstance(segments, list):
            for segment in segments:
                if 'start' in segment and 'end' in segment:
                    try:
                        segment_start = datetime.fromisoformat(segment['start'].replace('Z', '+00:00')).timestamp() * 1000
                        segment_end = datetime.fromisoformat(segment['end'].replace('Z', '+00:00')).timestamp() * 1000
                        total_time += (segment_end - segment_start)
                    except Exception as e:
                        print(f"计算段落时间出错: {e}")
        return total_time

    @staticmethod
    def get_first_segment_start(segments):
        """获取第一个段落的开始时间"""
        if segments and isinstance(segments, list) and len(segments) > 0:
            first_segment = segments[0]
            if 'start' in first_segment:
                return first_segment['start']
        return None

    @staticmethod
    def get_last_segment_end(segments):
        """获取最后一个段落的结束时间"""
        if segments and isinstance(segments, list) and len(segments) > 0:
            last_segment = segments[-1]
            if 'end' in last_segment:
                return last_segment['end']
        return None

    @staticmethod
    def get_segments_count(segments):
        """获取段落数量"""
        if segments and isinstance(segments, list):
            return len(segments)
        return 0
    
    @staticmethod
    def load_activity_categories():
        """加载活动类别配置"""
        config_file = os.path.join(app.config['DATA_FOLDER'], 'activity_categories.json')
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get('categories', [])
            except Exception as e:
                print(f"读取活动类别配置文件出错: {e}")
                return []
        return []
    
    @staticmethod
    def update_record_fields(record, data):
        """更新记录字段，确保符合时间字段规范"""
        # 特殊处理segments字段
        if 'segments' in data:
            if isinstance(data['segments'], dict):
                # 如果是字典，表示添加新的段落
                if 'segments' not in record:
                    record['segments'] = []
                # 检查是否提供了索引来更新特定段落
                if 'index' in data['segments']:
                    index = data['segments']['index']
                    if 0 <= index < len(record['segments']):
                        # 更新特定段落
                        for key, value in data['segments'].items():
                            if key != 'index':
                                record['segments'][index][key] = value
                else:
                    # 添加新段落
                    record['segments'].append(data['segments'])
            else:
                # 直接更新segments字段
                record['segments'] = data['segments']
        
        # 更新记录字段，确保符合时间字段规范
        for key, value in data.items():
            if key != 'id' and key != 'segments':  # 不允许更新ID和segments（已特殊处理）
                # 特殊处理date字段，确保格式正确，使用北京时间的日期
                if key == 'startTime' and 'date' not in data:
                    # 将UTC时间转换为北京时间后提取日期
                    utc_time = datetime.fromisoformat(value.replace('Z', '+00:00'))
                    beijing_time = utc_time.replace(tzinfo=timezone.utc).astimezone(BEIJING_TZ)
                    record['date'] = beijing_time.strftime('%Y/%m/%d')
                    record[key] = value
    
    @staticmethod
    def get_mood_wall_data(year, month):
        """获取指定月份的情绪墙数据"""
        records = TimeRecorderUtils.load_records()
        
        # 获取最近7天的日期范围
        end_date = datetime.now(BEIJING_TZ)
        start_date = end_date - timedelta(days=6)
        
        # 过滤最近7天的记录
        recent_records = []
        for record in records:
            if 'startTime' in record and 'emotion' in record and record['emotion']:
                # 将UTC时间转换为北京时间
                utc_time = datetime.fromisoformat(record['startTime'].replace('Z', '+00:00'))
                beijing_time = utc_time.replace(tzinfo=timezone.utc).astimezone(BEIJING_TZ)
                if start_date.date() <= beijing_time.date() <= end_date.date():
                    recent_records.append(record)
        
        # 按日期组织情绪数据
        mood_data = {}
        mood_records = {}  # 用于存储情绪对应的记录ID和活动信息
        for record in recent_records:
            if 'emotion' in record and record['emotion']:
                emotions = record['emotion'].split(', ')
                # 将UTC时间转换为北京时间以获取日期
                utc_time = datetime.fromisoformat(record['startTime'].replace('Z', '+00:00'))
                beijing_time = utc_time.replace(tzinfo=timezone.utc).astimezone(BEIJING_TZ)
                date_str = beijing_time.strftime('%Y/%m/%d')
                
                if date_str not in mood_data:
                    mood_data[date_str] = []
                    mood_records[date_str] = []
                
                for emotion in emotions:
                    mood_data[date_str].append(emotion)
                    mood_records[date_str].append({
                        'emotion': emotion,
                        'record_id': record['id'],
                        'activity': record.get('activity', ''),  # 添加活动名称
                        'duration': record.get('duration', 0)  # 添加时长
                    })
        
        # 转换为前端需要的格式
        result = []
        # 获取所有情绪类型
        all_emotions = set()
        for date_moods in mood_data.values():
            for emotion in date_moods:
                all_emotions.add(emotion)
        
        # 为每种情绪创建一个条目
        # 按照新的情绪分类定义颜色
        emotion_colors = {
            # 正向+专注：惊奇、兴奋、高兴、愉悦
            '惊奇': '#9C27B0',  # 紫色
            '兴奋': '#E91E63',  # 粉色
            '高兴': '#4CAF50',  # 绿色
            '愉悦': '#8BC34A',  # 浅绿色
            
            # 正向+松弛：安逸、安心、满足、宁静、放松
            '安逸': '#00BCD4',  # 青色
            '安心': '#2196F3',  # 蓝色
            '满足': '#8BC34A',  # 浅绿色
            '宁静': '#009688',  # 青绿色
            '放松': '#CDDC39',  # 青黄色
            
            # 负面+松弛：悲伤、伤心、沮丧、疲惫
            '悲伤': '#607D8B',  # 蓝灰色
            '伤心': '#9E9E9E',  # 灰色
            '沮丧': '#F44336',  # 红色
            '疲惫': '#795548',  # 棕色
            
            # 负面+专注：惊恐、紧张、愤怒、苦恼
            '惊恐': '#FF5722',  # 深橙色
            '紧张': '#FF9800',  # 橙色
            '愤怒': '#F44336',  # 红色
            '苦恼': '#FFC107'   # 琥珀色
        }
        
        for emotion in all_emotions:
            emotion_info = {
                'name': emotion,
                'color': emotion_colors.get(emotion, '#607D8B'),
                'days': []
            }
            
            # 为最近7天的每一天添加数据
            for i in range(7):
                date = start_date + timedelta(days=i)
                date_str = date.strftime('%Y/%m/%d')
                
                # 计算这一天该情绪的次数，并收集对应的记录ID和活动信息
                count = 0
                record_ids = []
                activities = []  # 存储每个记录的活动名称
                durations = []  # 存储每个记录的时长
                if date_str in mood_data:
                    for j, mood in enumerate(mood_data[date_str]):
                        if mood == emotion:
                            count += 1
                            # 获取对应的记录ID和活动信息
                            if j < len(mood_records[date_str]):
                                record_ids.append(mood_records[date_str][j]['record_id'])
                                activities.append(mood_records[date_str][j]['activity'])
                                durations.append(mood_records[date_str][j]['duration'])
                
                if count > 0:
                    emotion_info['days'].append({
                        'date': date_str,
                        'count': count,
                        'record_ids': record_ids,  # 添加记录ID列表
                        'activities': activities,  # 添加活动名称列表
                        'durations': durations  # 添加时长列表
                    })
            
            if emotion_info['days']:  # 只添加有数据的情绪
                result.append(emotion_info)
        
        return result
    
    @staticmethod
    def get_activity_wall_data(year, month):
        """获取指定月份的活动类型墙数据"""
        records = TimeRecorderUtils.load_records()
        
        # 加载活动类别配置
        categories = TimeRecorderUtils.load_activity_categories()
        
        # 创建活动到类别的映射
        activity_to_category = {}
        category_colors = {}
        # 将颜色名称转换为十六进制颜色值
        color_map = {
            'blue': '#2196F3',
            'green': '#4CAF50',
            'purple': '#9C27B0',
            'orange': '#FF9800',
            'cyan': '#00BCD4',
            'gray': '#795548'
        }
        print(f'[活动墙] 颜色映射表: {color_map}')
        for category in categories:
            category_name = category['name']
            color = category['color']
            hex_color = color_map.get(color, '#607D8B')
            category_colors[category_name] = hex_color
            print(f'[活动墙] 类别 {category_name} 的颜色配置: {color} -> {hex_color}')
            
            for activity in category.get('activities', []):
                activity_to_category[activity] = category_name
        
        # 获取最近7天的日期范围
        end_date = datetime.now(BEIJING_TZ)
        start_date = end_date - timedelta(days=6)
        
        # 过滤最近7天的记录
        recent_records = []
        for record in records:
            if 'startTime' in record:
                # 将UTC时间转换为北京时间
                utc_time = datetime.fromisoformat(record['startTime'].replace('Z', '+00:00'))
                beijing_time = utc_time.replace(tzinfo=timezone.utc).astimezone(BEIJING_TZ)
                if start_date.date() <= beijing_time.date() <= end_date.date():
                    recent_records.append(record)
        
        # 按日期组织活动数据
        activity_data = {}
        activity_records = {}  # 用于存储活动对应的记录ID和活动类别
        for record in recent_records:
            if 'activity' in record and record['activity']:
                activity = record['activity']
                # 直接使用记录中的activityCategory字段，而不是通过匹配函数
                category = record.get('activityCategory', '')
                
                # 过滤掉空的类别
                if not category:
                    continue
                
                # 获取记录中的活动类别字段（用于前端显示）
                record_activity_category = category
                
                # 计算记录的总时长
                duration = record.get('duration', 0)
                if 'segments' in record:
                    duration += TimeRecorderUtils.calculate_segments_total_time(record['segments'])
                
                # 将UTC时间转换为北京时间以获取日期
                utc_time = datetime.fromisoformat(record['startTime'].replace('Z', '+00:00'))
                beijing_time = utc_time.replace(tzinfo=timezone.utc).astimezone(BEIJING_TZ)
                date_str = beijing_time.strftime('%Y/%m/%d')
                
                if date_str not in activity_data:
                    activity_data[date_str] = []
                    activity_records[date_str] = []
                
                color = category_colors.get(category, '#607D8B')
                print(f'[活动墙] 为活动 {activity} 分配类别 {category}，颜色: {color}')
                activity_data[date_str].append({
                    'name': category,
                    'color': color,
                    'duration': duration
                })
                activity_records[date_str].append({
                    'category': category,
                    'record_id': record['id'],
                    'activity_category': record_activity_category,  # 添加活动类别字段
                    'activity': activity  # 添加活动名称字段
                })
        
        # 转换为前端需要的格式
        result = []
        # 为每个活动类别创建一个条目
        all_categories = set()
        for date_activities in activity_data.values():
            for activity in date_activities:
                all_categories.add(activity['name'])
        
        # 为每个类别创建一个条目
        for category in all_categories:
            color = category_colors.get(category, '#607D8B')
            print(f'[活动墙] 创建类别条目: {category}, 颜色: {color}')
            category_info = {
                'name': category,
                'color': color,
                'days': []
            }
            
            # 为最近7天的每一天添加数据
            for i in range(7):
                date = start_date + timedelta(days=i)
                date_str = date.strftime('%Y/%m/%d')
                
                # 计算这一天该类别的总时长和次数，并收集对应的记录ID和活动类别
                duration = 0
                count = 0
                record_ids = []
                activity_categories = []  # 存储每个记录的活动类别
                activities = []  # 存储每个记录的活动名称
                if date_str in activity_data:
                    for j, activity in enumerate(activity_data[date_str]):
                        if activity['name'] == category:
                            duration += activity['duration']
                            count += 1
                            # 获取对应的记录ID和活动类别
                            if j < len(activity_records[date_str]):
                                record_ids.append(activity_records[date_str][j]['record_id'])
                                activity_categories.append(activity_records[date_str][j]['activity_category'])
                                activities.append(activity_records[date_str][j]['activity'])
                
                if count > 0:
                    category_info['days'].append({
                        'date': date_str,
                        'duration': duration,
                        'count': count,
                        'record_ids': record_ids,  # 添加记录ID列表
                        'activity_categories': activity_categories,  # 添加活动类别列表
                        'activities': activities  # 添加活动名称列表
                    })
            
            if category_info['days']:  # 只添加有数据的类别
                result.append(category_info)
        
        return result
    
    @staticmethod
    def get_activity_category_loose_match(activity, activity_to_category):
        """使用宽松匹配方式获取活动类别"""
        # 首先尝试精确匹配
        if activity in activity_to_category:
            return activity_to_category[activity]
        
        # 如果精确匹配失败，尝试模糊匹配
        for configured_activity in activity_to_category:
            # 检查配置中的活动名称是否是记录中活动名称的子串
            if configured_activity in activity:
                return activity_to_category[configured_activity]
        
        # 如果所有匹配都失败，返回空字符串而不是"其他"
        return ''
    
    @staticmethod
    def get_keyword_cloud_data(days=7):
        """获取近几天的关键词词云数据"""
        records = TimeRecorderUtils.load_records()
        
        # 计算日期范围（近days天）
        end_date = datetime.now(BEIJING_TZ)
        start_date = end_date - timedelta(days=days-1)
        
        # 过滤指定日期范围的记录
        filtered_records = []
        for record in records:
            if 'startTime' in record:
                # 将UTC时间转换为北京时间
                utc_time = datetime.fromisoformat(record['startTime'].replace('Z', '+00:00'))
                beijing_time = utc_time.replace(tzinfo=timezone.utc).astimezone(BEIJING_TZ)
                if start_date.date() <= beijing_time.date() <= end_date.date():
                    filtered_records.append(record)
        
        # 统计关键词出现次数
        keyword_counts = {}
        for record in filtered_records:
            # 从活动名称中提取关键词
            if 'activity' in record and record['activity']:
                activity = record['activity']
                # 简单的关键词提取，可以根据需要扩展
                keywords = activity.split()
                for keyword in keywords:
                    if len(keyword) > 1:  # 过滤单字符
                        keyword_counts[keyword] = keyword_counts.get(keyword, 0) + 1
            
            # 从备注信息中提取关键词
            if 'remark' in record and record['remark']:
                remark = record['remark']
                # 简单的关键词提取，可以根据需要扩展
                # 这里使用简单的分词方法，实际应用中可以使用jieba等分词库
                import re
                # 提取中文字符和英文单词
                keywords = re.findall(r'[\u4e00-\u9fff]+|[a-zA-Z]+', remark)
                for keyword in keywords:
                    if len(keyword) > 1:  # 过滤单字符
                        keyword_counts[keyword] = keyword_counts.get(keyword, 0) + 1
        
        # 转换为前端需要的格式
        result = []
        # 为关键词生成颜色
        keyword_colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
            '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
        ]
        
        # 按出现次数排序，取前20个
        sorted_keywords = sorted(keyword_counts.items(), key=lambda x: x[1], reverse=True)[:20]
        
        for i, (keyword, count) in enumerate(sorted_keywords):
            result.append({
                'keyword': keyword,
                'count': count,
                'color': keyword_colors[i % len(keyword_colors)]
            })
        
        return result

@app.route('/')
def index():
    """首页路由"""
    # 检查是否已完成初始化
    if not InitUtils.is_initialized():
        # 未初始化，重定向到初始化页面
        return render_template('init.html')
    
    # 已初始化，正常显示首页
    return render_template('index.html')

@app.route('/records')
def records_page():
    return render_template('records.html')

@app.route('/project-description')
def project_description():
    return render_template('project_description.html')

@app.route('/conclusion')
def conclusion():
    """结论文档页面"""
    return render_template('conclusion.html')

@app.route('/manage-categories')
def manage_categories():
    return render_template('manage_categories.html')

@app.route('/api/records', methods=['GET'])
def get_records():
    """获取今日记录"""
    all_records = TimeRecorderUtils.load_records()
    
    # 获取今天的日期（使用北京时间）
    today = datetime.now(BEIJING_TZ).strftime('%Y/%m/%d')
    
    # 筛选今天的记录
    today_records = [record for record in all_records if record.get('date', '') == today]
    
    # 按开始时间倒序排列
    today_records.sort(key=lambda x: x.get('startTime', ''), reverse=True)
    
    return jsonify({
        'success': True,
        'records': today_records
    })

@app.route('/api/records/<record_id>', methods=['GET'])
def get_record(record_id):
    """获取单个记录的详细信息"""
    # 查找记录
    all_records = TimeRecorderUtils.load_all_records()
    target_record = None
    
    for record in all_records:
        if record['id'] == record_id:
            target_record = record
            break
    
    if not target_record:
        return jsonify({
            'success': False,
            'error': '记录不存在'
        }), 404
    
    return jsonify({
        'success': True,
        'record': target_record
    })

@app.route('/api/records', methods=['POST'])
def add_record():
    """添加新记录"""
    data = request.get_json()
    
    # 验证必要字段
    required_fields = ['activity']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'error': f'缺少必要字段: {field}'
            }), 400
    
    # 获取活动类别，确保不为空
    activity_category = data.get('activityCategory', get_activity_category(data['activity']))
    # 如果活动类别为空，返回错误
    if not activity_category:
        return jsonify({
            'success': False,
            'error': '活动类别不能为空，请选择一个有效的活动类别'
        }), 400
    
    # 获取segments信息
    segments = data.get('segments', [])
    
    # 根据规范设置时间字段
    start_time = data.get('startTime')
    end_time = data.get('endTime')
    duration = data.get('duration', 0)
    pause_count = data.get('pauseCount', 0)
    time_span = data.get('timeSpan', 0)
    
    # 如果有segments，根据segments更新时间字段
    if segments:
        # startTime是第一个segments的start时间
        if not start_time:
            start_time = TimeRecorderUtils.get_first_segment_start(segments)
        
        # endTime为最后一个segments的end时间
        if not end_time:
            end_time = TimeRecorderUtils.get_last_segment_end(segments)
        
        # duration记录所有segments累计的时间
        duration = TimeRecorderUtils.calculate_segments_total_time(segments)
        
        # pauseCount记录segments的个数
        pause_count = TimeRecorderUtils.get_segments_count(segments)
        
        # timeSpan记录从第一个段落的start到最后一个段落的end的时间跨度
        first_start = TimeRecorderUtils.get_first_segment_start(segments)
        last_end = TimeRecorderUtils.get_last_segment_end(segments)
        if first_start and last_end:
            try:
                # 确保使用UTC时间处理
                first_start_time = datetime.fromisoformat(first_start.replace('Z', '+00:00'))
                last_end_time = datetime.fromisoformat(last_end.replace('Z', '+00:00'))
                time_span = (last_end_time - first_start_time).total_seconds() * 1000
            except Exception as e:
                print(f"计算时间跨度出错: {e}")
    
    # 创建新记录，使用UTC时间存储，date字段使用北京时间的日期
    date_value = ''
    if start_time:
        # 将UTC时间转换为北京时间后提取日期
        utc_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        beijing_time = utc_time.replace(tzinfo=timezone.utc).astimezone(BEIJING_TZ)
        date_value = beijing_time.strftime('%Y/%m/%d')
    
    record = {
        'id': str(uuid.uuid4()),
        'activity': data['activity'],
        'activityCategory': activity_category,  # 添加活动类别字段
        'date': date_value,  # 添加日期字段，使用北京时间的日期
        'startTime': start_time or '',
        'endTime': end_time or '',
        'duration': duration,
        'remark': data.get('remark', ''),  # 备注信息
        'emotion': data.get('emotion', ''),  # 记录情绪
        'pauseCount': pause_count,  # 暂停次数
        'timeSpan': time_span,  # 时间跨度
        'segments': segments  # 段落记录
    }
    
    # 加载现有记录
    records = TimeRecorderUtils.load_records()
    records.append(record)
    
    # 保存记录
    if TimeRecorderUtils.save_records(records):
        return jsonify({
            'success': True,
            'record': record
        })
    else:
        return jsonify({
            'success': False,
            'error': '保存记录失败'
        }), 500

@app.route('/api/records/<record_id>', methods=['PUT'])
def update_record(record_id):
    """更新记录"""
    data = request.get_json()
    
    # 查找记录
    all_records = TimeRecorderUtils.load_all_records()
    target_record = None
    
    for record in all_records:
        if record['id'] == record_id:
            target_record = record
            break
    
    if not target_record:
        return jsonify({
            'success': False,
            'error': '记录不存在'
        }), 404
    
    # 加载记录
    records = TimeRecorderUtils.load_records()
    
    # 查找并更新记录
    updated = False
    for record in records:
        if record['id'] == record_id:
            # 特殊处理segments字段
            if 'segments' in data:
                if isinstance(data['segments'], dict):
                    # 如果是字典，表示添加新的段落
                    if 'segments' not in record:
                        record['segments'] = []
                    # 检查是否提供了索引来更新特定段落
                    if 'index' in data['segments']:
                        index = data['segments']['index']
                        if 0 <= index < len(record['segments']):
                            # 更新特定段落
                            for key, value in data['segments'].items():
                                if key != 'index':
                                    record['segments'][index][key] = value
                    else:
                        # 添加新段落
                        record['segments'].append(data['segments'])
                else:
                    # 直接更新segments字段
                    record['segments'] = data['segments']
            
            # 更新记录字段，确保符合时间字段规范
            for key, value in data.items():
                if key != 'id' and key != 'segments':  # 不允许更新ID和segments（已特殊处理）
                    # 特殊处理date字段，确保格式正确，使用北京时间的日期
                    if key == 'startTime' and 'date' not in data:
                        # 将UTC时间转换为北京时间后提取日期
                        utc_time = datetime.fromisoformat(value.replace('Z', '+00:00'))
                        beijing_time = utc_time.replace(tzinfo=timezone.utc).astimezone(BEIJING_TZ)
                        record['date'] = beijing_time.strftime('%Y/%m/%d')
                    record[key] = value
                    print(f"[更新记录] 更新字段 {key}: {value}")  # 添加日志
            
            # 根据规范更新时间字段
            if 'segments' in record and record['segments']:
                segments = record['segments']
                
                # 按开始时间排序段落
                segments.sort(key=lambda x: x['start'] if 'start' in x else '')
                
                # startTime是第一个segments的start时间且唯一不可修改
                # 注意：只有在记录中还没有startTime时才设置
                if 'startTime' not in record or not record['startTime']:
                    first_start = TimeRecorderUtils.get_first_segment_start(segments)
                    if first_start:
                        record['startTime'] = first_start
                        # 同时更新date字段，使用北京时间的日期
                        if 'date' not in data:
                            # 将UTC时间转换为北京时间后提取日期
                            utc_time = datetime.fromisoformat(first_start.replace('Z', '+00:00'))
                            beijing_time = utc_time.replace(tzinfo=timezone.utc).astimezone(BEIJING_TZ)
                            record['date'] = beijing_time.strftime('%Y/%m/%d')
                    
                    # endTime为最后一个segments的end时间
                    last_end = TimeRecorderUtils.get_last_segment_end(segments)
                    if last_end:
                        record['endTime'] = last_end
                    
                    # duration记录所有segments累计的时间
                    record['duration'] = TimeRecorderUtils.calculate_segments_total_time(segments)
                    
                    # pauseCount记录segments的个数
                    record['pauseCount'] = TimeRecorderUtils.get_segments_count(segments)
                    
                    # timeSpan记录从第一个段落的start到最后一个段落的end的时间跨度
                    first_start = TimeRecorderUtils.get_first_segment_start(segments)
                    last_end = TimeRecorderUtils.get_last_segment_end(segments)
                    if first_start and last_end:
                        try:
                            # 确保使用UTC时间处理
                            first_start_time = datetime.fromisoformat(first_start.replace('Z', '+00:00'))
                            last_end_time = datetime.fromisoformat(last_end.replace('Z', '+00:00'))
                            record['timeSpan'] = (last_end_time - first_start_time).total_seconds() * 1000
                        except Exception as e:
                            print(f"计算时间跨度出错: {e}")
            
            updated = True
            break
    
    if not updated:
        return jsonify({
            'success': False,
            'error': '记录不存在'
        }), 404
    
    # 保存记录
    if TimeRecorderUtils.save_records(records):
        # 查找更新后的记录并返回
        updated_record = None
        for record in records:
            if record['id'] == record_id:
                updated_record = record
                break
        
        if updated_record:
            return jsonify({
                'success': True,
                'record': updated_record
            })
        else:
            return jsonify({
                'success': False,
                'error': '无法找到更新后的记录'
            }), 500
    else:
        return jsonify({
            'success': False,
            'error': '保存记录失败'
        }), 500

@app.route('/api/records/<record_id>', methods=['DELETE'])
def delete_record(record_id):
    """删除记录"""
    # 查找记录
    all_records = TimeRecorderUtils.load_all_records()
    target_record = None
    for record in all_records:
        if record['id'] == record_id:
            target_record = record
            break
    
    if not target_record:
        return jsonify({
            'success': False,
            'error': '记录不存在'
        }), 404
    
    # 加载记录
    records = TimeRecorderUtils.load_records()
    
    # 查找并删除记录
    original_length = len(records)
    records = [record for record in records if record['id'] != record_id]
    
    if len(records) == original_length:
        return jsonify({
            'success': False,
            'error': '记录不存在'
        }), 404
    
    # 保存记录
    if TimeRecorderUtils.save_records(records):
        return jsonify({
            'success': True,
            'message': '记录删除成功'
        })
    else:
        return jsonify({
            'success': False,
            'error': '保存记录失败'
        }), 500

@app.route('/api/all-records', methods=['GET'])
def get_all_records():
    """获取所有记录，支持筛选和分页"""
    # 获取查询参数
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    search = request.args.get('search', '')
    date_from = request.args.get('date_from', '')
    date_to = request.args.get('date_to', '')
    activity = request.args.get('activity', '')
    emotion = request.args.get('emotion', '')
    
    # 加载所有记录
    all_records = TimeRecorderUtils.load_all_records()
    
    # 应用筛选条件
    filtered_records = all_records
    
    # 搜索关键字
    if search:
        filtered_records = [r for r in filtered_records if 
                           search.lower() in r['activity'].lower() or 
                           (r['remark'] and search.lower() in r['remark'].lower())]
    
    # 日期范围筛选（从startTime提取日期）
    if date_from:
        filtered_records = [r for r in filtered_records if r['startTime'][:10] >= date_from]
    if date_to:
        filtered_records = [r for r in filtered_records if r['startTime'][:10] <= date_to]
    
    # 活动类型筛选
    if activity:
        filtered_records = [r for r in filtered_records if r['activity'] == activity]
    
    # 情绪筛选
    if emotion:
        filtered_records = [r for r in filtered_records if emotion in r['emotion']]
    
    # 分页
    total = len(filtered_records)
    start = (page - 1) * per_page
    end = start + per_page
    paginated_records = filtered_records[start:end]
    
    return jsonify({
        'success': True,
        'records': paginated_records,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'pages': (total + per_page - 1) // per_page
        }
    })

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """获取统计信息"""
    all_records = TimeRecorderUtils.load_records()
    
    # 获取今天的日期（使用北京时间）
    today = datetime.now(BEIJING_TZ).strftime('%Y/%m/%d')
    
    # 筛选今天的记录
    records = [record for record in all_records if record.get('date', '') == today]
    
    # 计算总时长和活动次数
    # 加载活动类别配置
    categories = TimeRecorderUtils.load_activity_categories()
    
    # 创建创作类活动集合
    creation_activities = set()
    for category in categories:
        if category['name'] == '输出创作':
            creation_activities.update(category.get('activities', []))
    
    # 计算总时长和活动次数
    total_duration = 0
    creation_total_duration = 0
    
    for record in records:
        # 根据规范，duration记录所有segments累计的时间
        # 所以总时长就是所有记录的duration之和
        duration = record.get('duration', 0)
        total_duration += duration
        
        # 如果活动属于创作类活动，累加到创作总时间
        # 使用宽松匹配方式
        activity = record.get('activity', '')
        is_creation_activity = False
        for creation_activity in creation_activities:
            if creation_activity in activity:
                is_creation_activity = True
                break
        
        if is_creation_activity:
            creation_total_duration += duration
    
    activity_count = len(records)
    
    # 转换为小时和分钟
    hours = total_duration // 3600000
    minutes = (total_duration % 3600000) // 60000
    
    # 转换创作为时间小时和分钟
    creation_hours = creation_total_duration // 3600000
    creation_minutes = (creation_total_duration % 3600000) // 60000
    
    return jsonify({
        'success': True,
        'stats': {
            'totalTime': total_duration,
            'totalHours': hours,
            'totalMinutes': minutes,
            'toyTotalTime': creation_total_duration,
            'toyTotalHours': creation_hours,
            'toyTotalMinutes': creation_minutes,
            'activityCount': activity_count
        }
    })

@app.route('/api/set-username', methods=['POST'])
def set_username():
    """设置用户名（已去除用户名逻辑，此端点仅用于兼容性）"""
    return jsonify({
        'success': True,
        'message': '用户名功能已去除'
    })

@app.route('/api/import-records', methods=['POST'])
def import_records():
    """导入记录"""
    # 获取上传的文件
    file = request.files.get('file')
    if not file:
        return jsonify({
            'success': False,
            'error': '没有上传文件'
        }), 400
    
    # 检查文件类型
    if not file.filename or not file.filename.endswith('.json'):
        return jsonify({
            'success': False,
            'error': '文件格式不正确，只支持JSON文件'
        }), 400
    
    try:
        # 读取文件内容
        content = file.read().decode('utf-8')
        imported_records = json.loads(content)
        
        # 验证记录格式
        if not isinstance(imported_records, list):
            return jsonify({
                'success': False,
                'error': '文件格式不正确，记录应该是一个数组'
            }), 400
        
        # 加载现有记录
        existing_records = TimeRecorderUtils.load_records()
        
        # 合并记录（避免重复）
        existing_ids = {record['id'] for record in existing_records}
        new_records = []
        
        for record in imported_records:
            # 验证必要字段
            if 'id' not in record or 'activity' not in record:
                continue
            
            # 如果记录ID已存在，跳过
            if record['id'] in existing_ids:
                continue
            
            # 添加记录
            new_records.append(record)
            existing_ids.add(record['id'])
        
        # 保存记录
        all_records = existing_records + new_records
        if TimeRecorderUtils.save_records(all_records):
            return jsonify({
                'success': True,
                'imported_count': len(new_records),
                'message': f'成功导入 {len(new_records)} 条记录'
            })
        else:
            return jsonify({
                'success': False,
                'error': '保存记录失败'
            }), 500
    except Exception as e:
        print(f"导入记录出错: {e}")
        return jsonify({
            'success': False,
            'error': f'导入记录失败: {str(e)}'
        }), 500

@app.route('/api/export-records', methods=['GET'])
def export_records():
    """导出记录"""
    # 加载所有记录
    records = TimeRecorderUtils.load_records()
    
    # 返回JSON格式的记录
    return jsonify({
        'success': True,
        'records': records
    })

@app.route('/api/activity-categories', methods=['GET'])
def api_get_activity_categories():
    """获取活动类别配置的API端点"""
    categories_data = get_activity_categories()
    return jsonify({
        'success': True,
        'data': {
            'categories': categories_data
        }
    })


@app.route('/api/activity-categories', methods=['PUT'])
def api_update_activity_categories():
    """更新活动类别配置的API端点"""
    data = request.get_json()
    if not data or 'categories' not in data:
        return jsonify({
            'success': False,
            'error': '缺少必要的categories字段'
        }), 400
    
    if save_activity_categories(data):
        return jsonify({
            'success': True,
            'message': '活动类别配置更新成功'
        })
    else:
        return jsonify({
            'success': False,
            'error': '保存活动类别配置失败'
        }), 500

@app.route('/mood-wall')
def mood_wall():
    """情绪墙页面"""
    return render_template('mood_wall.html')

@app.route('/logs')
def logs():
    """日志查看页面"""
    return render_template('logs.html')

@app.route('/api/mood-wall', methods=['GET'])
def api_get_mood_wall_data():
    """获取情绪墙和活动类型墙数据的API"""
    year = int(request.args.get('year', datetime.now().year))
    month = int(request.args.get('month', datetime.now().month))
    
    # 获取情绪墙数据
    mood_data = TimeRecorderUtils.get_mood_wall_data(year, month)
    
    # 获取活动类型墙数据
    activity_data = TimeRecorderUtils.get_activity_wall_data(year, month)
    
    # 准备图例数据
    mood_legend = []
    emotion_colors = {
        '开心': '#4CAF50',
        '专注': '#2196F3',
        '疲惫': '#9E9E9E',
        '焦虑': '#FF9800',
        '兴奋': '#E91E63',
        '平静': '#00BCD4',
        '沮丧': '#F44336',
        '满足': '#8BC34A',
        '无聊': '#795548'
    }
    for emotion in emotion_colors:
        mood_legend.append({
            'name': emotion,
            'color': emotion_colors[emotion]
        })
    
    # 准备活动图例数据（按活动类别）
    activity_legend = []
    categories = TimeRecorderUtils.load_activity_categories()
    category_colors = {
        'blue': '#2196F3',
        'green': '#4CAF50',
        'purple': '#9C27B0',
        'orange': '#FF9800',
        'cyan': '#00BCD4',
        'gray': '#795548'
    }
    
    # 创建类别名称集合以避免重复
    added_categories = set()
    for category in categories:
        category_name = category['name']
        if category_name not in added_categories:
            added_categories.add(category_name)
            color = category['color']
            hex_color = category_colors.get(color, '#607D8B')
            activity_legend.append({
                'name': category_name,
                'color': hex_color
            })
    
    # 获取关键词词云数据（默认近7天）
    keyword_data = TimeRecorderUtils.get_keyword_cloud_data(7)
    
    return jsonify({
        'success': True,
        'moodData': mood_data,
        'activityData': activity_data,
        'keywordData': keyword_data,
        'moodLegend': mood_legend,
        'activityLegend': activity_legend
    })


def get_activity_category(activity):
    """获取活动类别"""
    # 加载活动类别配置
    categories = TimeRecorderUtils.load_activity_categories()
    
    # 创建活动到类别的映射
    activity_to_category = {}
    for category in categories:
        for activity_name in category.get('activities', []):
            activity_to_category[activity_name] = category['name']
    
    # 使用宽松匹配方式获取活动类别
    return TimeRecorderUtils.get_activity_category_loose_match(activity, activity_to_category)

def get_activity_categories():
    """获取活动类别配置"""
    return TimeRecorderUtils.load_activity_categories()

def save_activity_categories(data):
    """保存活动类别配置"""
    config_file = os.path.join(app.config['DATA_FOLDER'], 'activity_categories.json')
    try:
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"保存活动类别配置文件出错: {e}")
        return False


# ==================== 初始化配置功能 ====================

class InitUtils:
    """初始化工具类"""
    
    @staticmethod
    def is_initialized():
        """检查是否已完成初始化"""
        # 检查初始化状态文件
        if os.path.exists(INIT_STATUS_FILE):
            try:
                with open(INIT_STATUS_FILE, 'r', encoding='utf-8') as f:
                    status = json.load(f)
                    return status.get('initialized', False)
            except Exception as e:
                print(f"读取初始化状态文件出错: {e}")
                return False
        
        # 检查飞书配置是否存在且有效
        feishu_config_file = os.path.join('config', 'feishu_config.json')
        if os.path.exists(feishu_config_file):
            try:
                with open(feishu_config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    app_id = config.get('app_id', '')
                    app_secret = config.get('app_secret', '')
                    # 如果存在有效的app_id和app_secret，认为已初始化
                    if app_id and app_secret:
                        # 创建初始化状态文件
                        InitUtils.mark_as_initialized()
                        return True
            except Exception as e:
                print(f"读取飞书配置文件出错: {e}")
        
        return False
    
    @staticmethod
    def mark_as_initialized():
        """标记为已初始化"""
        try:
            # 确保config目录存在
            os.makedirs('config', exist_ok=True)
            
            # 创建或更新初始化状态文件
            status = {
                'initialized': True,
                'initialized_at': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
            }
            
            with open(INIT_STATUS_FILE, 'w', encoding='utf-8') as f:
                json.dump(status, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"标记初始化状态出错: {e}")


@app.route('/api/init/skip', methods=['POST'])
def skip_init():
    """跳过初始化"""
    try:
        # 标记为已初始化
        InitUtils.mark_as_initialized()
        
        return jsonify({
            'success': True,
            'message': '初始化已跳过'
        })
    except Exception as e:
        print(f"跳过初始化出错: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/init/sync-records', methods=['POST'])
def init_sync_records_from_feishu():
    """初始化时从飞书同步活动记录"""
    try:
        # 检查飞书配置
        if not feishu_api.app_id or not feishu_api.app_secret:
            return jsonify({
                'success': False,
                'error': '飞书配置不完整，请先配置App ID和App Secret'
            }), 400
        
        # 从飞书多维表格获取记录
        result = feishu_api.get_records_from_bitable()
        
        if not result.get('success'):
            return jsonify({
                'success': False,
                'error': result.get('error', '从飞书获取记录失败')
            }), 500
        
        # 转换飞书记录为本地格式
        feishu_records = result.get('records', [])
        local_records = []
        
        for feishu_record in feishu_records:
            fields = feishu_record.get('fields', {})
            
            # 提取字段
            activity = fields.get('activity(活动名称)', '')
            activity_category = fields.get('activityCategory(活动类型)', '')
            start_time = fields.get('startTime(开始时间)', '')
            end_time = fields.get('endTime(结束时间)', '')
            duration = fields.get('duration(专注时长)', 0)
            time_span = fields.get('timeSpan(时间跨度)', 0)
            pause_count = fields.get('pauseCount(暂停次数)', 0)
            remark = fields.get('remark(备注信息)', '')
            emotion = fields.get('emotion(情绪)', '')
            
            # 处理时间字段
            start_time_iso = ''
            end_time_iso = ''
            if start_time:
                # 假设飞书时间格式为 "YYYY-MM-DD HH:MM:SS"
                try:
                    dt = datetime.strptime(start_time, '%Y-%m-%d %H:%M:%S')
                    # 转换为UTC时间
                    utc_dt = dt.replace(tzinfo=BEIJING_TZ).astimezone(timezone.utc)
                    start_time_iso = utc_dt.isoformat().replace('+00:00', 'Z')
                except Exception as e:
                    print(f"处理开始时间出错: {e}")
            
            if end_time:
                try:
                    dt = datetime.strptime(end_time, '%Y-%m-%d %H:%M:%S')
                    # 转换为UTC时间
                    utc_dt = dt.replace(tzinfo=BEIJING_TZ).astimezone(timezone.utc)
                    end_time_iso = utc_dt.isoformat().replace('+00:00', 'Z')
                except Exception as e:
                    print(f"处理结束时间出错: {e}")
            
            # 处理情绪字段
            emotion_str = ''
            if isinstance(emotion, list):
                emotion_str = ', '.join(emotion)
            elif isinstance(emotion, str):
                emotion_str = emotion
            
            # 创建本地记录
            local_record = {
                'id': str(uuid.uuid4()),
                'username': '',  # 已废弃字段
                'date': '',  # 将在保存时根据startTime计算
                'activity': activity,
                'activityCategory': activity_category,
                'startTime': start_time_iso,
                'endTime': end_time_iso,
                'duration': duration,
                'timeSpan': time_span,
                'pauseCount': pause_count,
                'remark': remark,
                'emotion': emotion_str,
                'segments': []  # 简化处理，不处理段落信息
            }
            
            # 根据startTime计算date字段
            if start_time_iso:
                try:
                    utc_time = datetime.fromisoformat(start_time_iso.replace('Z', '+00:00'))
                    beijing_time = utc_time.replace(tzinfo=timezone.utc).astimezone(BEIJING_TZ)
                    local_record['date'] = beijing_time.strftime('%Y/%m/%d')
                except Exception as e:
                    print(f"计算日期字段出错: {e}")
            
            local_records.append(local_record)
        
        # 保存记录到本地文件
        if TimeRecorderUtils.save_records(local_records):
            return jsonify({
                'success': True,
                'message': f'成功同步 {len(local_records)} 条活动记录',
                'count': len(local_records)
            })
        else:
            return jsonify({
                'success': False,
                'error': '保存记录到本地文件失败'
            }), 500
            
    except Exception as e:
        print(f"从飞书同步活动记录出错: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/init/sync-plans', methods=['POST'])
def init_sync_plans_from_feishu():
    """初始化时从飞书同步今日计划"""
    try:
        # 检查飞书配置
        if not feishu_api.app_id or not feishu_api.app_secret:
            return jsonify({
                'success': False,
                'error': '飞书配置不完整，请先配置App ID和App Secret'
            }), 400
        
        # TODO: 实现从飞书同步今日计划的逻辑
        # 这里需要根据实际的飞书多维表格结构来实现
        
        # 暂时返回成功，实际实现时需要替换
        return jsonify({
            'success': True,
            'message': '今日计划同步功能待实现',
            'count': 0
        })
            
    except Exception as e:
        print(f"从飞书同步今日计划出错: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/init/complete', methods=['POST'])
def complete_init():
    """完成初始化"""
    try:
        # 标记为已初始化
        InitUtils.mark_as_initialized()
        
        return jsonify({
            'success': True,
            'message': '初始化完成'
        })
    except Exception as e:
        print(f"完成初始化出错: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== 飞书多维表格集成 ====================
import requests
import time

class FeishuBitableAPI:
    """飞书多维表格API封装类"""
    
    def __init__(self):
        self.app_id = ""
        self.app_secret = ""
        self.app_type = "internal"  # 默认为internal类型
        self.tenant_access_token = ""
        self.token_expire_time = 0
        self.load_config()
    
    def load_config(self):
        """加载飞书配置"""
        config_file = os.path.join('config', 'feishu_config.json')
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    self.app_id = config.get('app_id', '')
                    self.app_secret = config.get('app_secret', '')
                    self.app_type = config.get('app_type', 'internal')  # 加载应用类型
                    self.tenant_access_token = config.get('tenant_access_token', '')
            except Exception as e:
                print(f"读取飞书配置文件出错: {e}")
    
    def get_tenant_access_token(self):
        """获取租户访问令牌"""
        # 检查令牌是否有效且未过期
        current_time = time.time()
        if self.tenant_access_token and self.token_expire_time > current_time:
            return self.tenant_access_token
        
        # 检查App ID和App Secret是否配置
        if not self.app_id or not self.app_secret:
            raise Exception("飞书配置不完整: 请先配置App ID和App Secret")
        
        try:
            # 根据应用类型选择不同的端点
            if self.app_type == "internal":
                url = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal"
            else:
                url = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token"
            
            headers = {
                'Content-Type': 'application/json; charset=utf-8'
            }
            payload = {
                "app_id": self.app_id,
                "app_secret": self.app_secret
            }
            
            print(f"[调试] 使用端点: {url}")
            print(f"[调试] App类型: {self.app_type}")
            print(f"[调试] App ID: {self.app_id}")
            print(f"[调试] App Secret: {self.app_secret[:5]}...{self.app_secret[-5:] if len(self.app_secret) > 10 else self.app_secret}")
            
            response = requests.post(url, json=payload, headers=headers)
            result = response.json()
            
            print(f"[调试] 响应结果: {result}")
            
            if result.get('code') == 0:
                self.tenant_access_token = result.get('tenant_access_token', '')
                # 设置过期时间（提前5分钟过期）
                self.token_expire_time = current_time + result.get('expire', 0) - 300
                return self.tenant_access_token
            else:
                error_msg = result.get('msg', '未知错误')
                # 提供更明确的错误信息
                if 'app id not exists' in error_msg.lower():
                    raise Exception(f"飞书配置错误: App ID在飞书系统中不存在，请检查App ID是否正确并在飞书开放平台创建了对应的应用")
                elif 'invalid param' in error_msg.lower():
                    raise Exception(f"飞书配置错误: App ID或App Secret不正确，请检查配置")
                else:
                    raise Exception(f"获取访问令牌失败: {error_msg}")
        except Exception as e:
            print(f"获取租户访问令牌出错: {e}")
            raise e
    
    def get_records_from_bitable(self, app_token="BKCLblwCmajwm9sFmo4cyJxJnON", table_id="tblfFpqZNNqGshC3", page_size=100):
        """从飞书多维表格获取记录"""
        try:
            token = self.get_tenant_access_token()
            
            # 获取记录
            url = f"https://open.feishu.cn/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records"
            headers = {
                'Authorization': f'Bearer {token}'
            }
            
            # 添加查询参数
            params = {
                'page_size': page_size
            }
            
            records = []
            has_more = True
            page_token = None
            
            while has_more:
                if page_token:
                    params['page_token'] = page_token
                
                response = requests.get(url, headers=headers, params=params)
                result = response.json()
                
                if result.get('code') != 0:
                    raise Exception(f"获取记录失败: {result.get('msg', '未知错误')}")
                
                data = result.get('data', {})
                records.extend(data.get('items', []))
                
                has_more = data.get('has_more', False)
                page_token = data.get('page_token')
            
            return {
                'success': True,
                'records': records
            }
        except Exception as e:
            print(f"从飞书多维表格获取记录出错: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def import_records_to_bitable(self, records, app_token="BKCLblwCmajwm9sFmo4cyJxJnON", table_id="tblfFpqZNNqGshC3"):
        """导出记录到飞书多维表格"""
        try:
            token = self.get_tenant_access_token()
            print(f"获取到的访问令牌: {token[:20]}...")  # 只显示部分令牌用于调试
            
            # 准备数据格式
            feishu_records = []
            for record in records:
                # 检查记录格式，如果是前端传来的格式（包含fields字段），则直接使用
                if 'fields' in record:
                    feishu_records.append(record)
                    continue
                    
                # 格式化时间
                start_time = ""
                end_time = ""
                if record.get('startTime'):
                    start_time = datetime.fromisoformat(record['startTime'].replace('Z', '+00:00')).astimezone(BEIJING_TZ).strftime('%Y-%m-%d %H:%M:%S')
                if record.get('endTime'):
                    end_time = datetime.fromisoformat(record['endTime'].replace('Z', '+00:00')).astimezone(BEIJING_TZ).strftime('%Y-%m-%d %H:%M:%S')
                
                # 计算时长
                duration_str = ""
                if record.get('duration'):
                    total_seconds = int(record['duration'] / 1000)
                    hours = total_seconds // 3600
                    minutes = (total_seconds % 3600) // 60
                    seconds = total_seconds % 60
                    
                    if hours > 0:
                        duration_str = f"{hours}小时{minutes}分钟{seconds}秒"
                    elif minutes > 0:
                        duration_str = f"{minutes}分钟{seconds}秒"
                    else:
                        duration_str = f"{seconds}秒"
                
                # 时间跨度
                time_span_str = ""
                if record.get('timeSpan'):
                    time_span_str = f"{int(record['timeSpan'] / 1000)}秒"
                
                # 处理情绪字段，确保是列表格式
                emotion_value = record.get('emotion', '')
                if emotion_value:
                    # 如果情绪是以逗号分隔的字符串，转换为列表
                    if isinstance(emotion_value, str):
                        emotion_list = [e.strip() for e in emotion_value.split(',') if e.strip()]
                    else:
                        emotion_list = emotion_value if isinstance(emotion_value, list) else [str(emotion_value)]
                else:
                    emotion_list = []
                
                # 处理日期字段，转换为时间戳
                date_value = record.get('date', '')
                timestamp_value = 0
                if date_value:
                    try:
                        # 将日期字符串转换为时间戳
                        date_obj = datetime.strptime(date_value, '%Y/%m/%d')
                        timestamp_value = int(date_obj.timestamp() * 1000)
                    except ValueError:
                        # 如果日期格式不正确，使用当前日期
                        timestamp_value = int(datetime.now().timestamp() * 1000)
                
                # 将segments转换为JSON格式的文本
                segments_json = ''
                if 'segments' in record and isinstance(record['segments'], list):
                    segments_json = json.dumps(record['segments'], ensure_ascii=False, indent=2)
                
                feishu_record = {
                    "fields": {
                        "activity(活动名称)": record.get('activity', ''),
                        "activityCategory(活动类型)": record.get('activityCategory', ''),
                        "startTime(开始时间)": start_time,
                        "endTime(结束时间)": end_time,
                        "duration(总计专注时长)": duration_str,
                        "timeSpan(时间跨度)": time_span_str,
                        "remark(感想&记录)": record.get('remark', ''),
                        "emotion(情绪记录)": emotion_list,
                        "pauseCount(暂停次数)": int(record.get('pauseCount', 0)),  # 确保是整数类型
                        "活动日期": timestamp_value,
                        "id(活动唯一标识)": record.get('id', ''),  # 添加ID字段
                        "segments(专注段落)": segments_json  # 添加segments JSON文本
                    }
                }
                feishu_records.append(feishu_record)
            
            print(f"准备导入 {len(feishu_records)} 条记录")  # 调试信息
            
            # 准备请求头
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json; charset=utf-8'
            }
            
            # 第一步：查询所有记录是否已存在
            print("[飞书导出] 第一步：查询已存在的记录...")
            records_to_create = []  # 需要创建的记录
            records_to_update = []  # 需要更新的记录（包含record_id和fields）
            
            for feishu_record in feishu_records:
                record_id_value = feishu_record['fields'].get('id(活动唯一标识)', '')
                
                if not record_id_value:
                    # 如果没有ID，直接创建
                    records_to_create.append(feishu_record)
                    continue
                
                # 查询飞书表格中是否已存在该ID的记录
                try:
                    search_url = f"https://open.feishu.cn/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/search"
                    search_payload = {
                        "filter": {
                            "conjunction": "and",
                            "conditions": [
                                {
                                    "field_name": "id(活动唯一标识)",
                                    "operator": "is",
                                    "value": [record_id_value]
                                }
                            ]
                        }
                    }
                    
                    search_response = requests.post(search_url, json=search_payload, headers=headers)
                    
                    if search_response.status_code == 200:
                        search_result = search_response.json()
                        if search_result.get('code') == 0:
                            items = search_result.get('data', {}).get('items', [])
                            if items:
                                # 记录已存在，添加到更新列表
                                existing_record_id = items[0].get('record_id')
                                records_to_update.append({
                                    'record_id': existing_record_id,
                                    'fields': feishu_record['fields']
                                })
                                print(f"  - 找到已存在记录: {record_id_value}，将更新")
                            else:
                                # 记录不存在，添加到创建列表
                                records_to_create.append(feishu_record)
                                print(f"  - 未找到记录: {record_id_value}，将创建")
                        else:
                            # 查询失败，默认创建
                            print(f"  - 查询记录失败: {search_result.get('msg')}，默认创建")
                            records_to_create.append(feishu_record)
                    else:
                        # 查询请求失败，默认创建
                        print(f"  - 查询请求失败: {search_response.status_code}，默认创建")
                        records_to_create.append(feishu_record)
                except Exception as e:
                    # 查询出错，默认创建
                    print(f"  - 查询记录时出错: {e}，默认创建")
                    records_to_create.append(feishu_record)
            
            print(f"[飞书导出] 查询完成: {len(records_to_create)} 条需要创建，{len(records_to_update)} 条需要更新")
            
            # 第二步：批量创建新记录
            created_count = 0
            if records_to_create:
                print(f"[飞书导出] 第二步：批量创建 {len(records_to_create)} 条新记录...")
                batch_size = 100
                
                for i in range(0, len(records_to_create), batch_size):
                    batch = records_to_create[i:i + batch_size]
                    url = f"https://open.feishu.cn/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_create"
                    payload = {"records": batch}
                    
                    response = requests.post(url, json=payload, headers=headers)
                    print(f"  批次 {i//batch_size + 1}: 状态码 {response.status_code}")
                    
                    if response.status_code == 403:
                        print("权限错误：应用可能没有写入多维表格的权限")
                        return {
                            'success': False,
                            'error': '权限错误：应用可能没有写入多维表格的权限，请检查飞书应用权限配置'
                        }
                    
                    result = response.json()
                    if result.get('code') != 0:
                        raise Exception(f"创建记录失败 (批次 {i//batch_size + 1}): {result.get('msg', '未知错误')}")
                    
                    created_count += len(batch)
            
            # 第三步：逐条更新已存在的记录
            updated_count = 0
            if records_to_update:
                print(f"[飞书导出] 第三步：更新 {len(records_to_update)} 条已存在的记录...")
                
                for record_info in records_to_update:
                    update_url = f"https://open.feishu.cn/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_info['record_id']}"
                    update_response = requests.put(
                        update_url,
                        json={"fields": record_info['fields']},
                        headers=headers
                    )
                    
                    if update_response.status_code == 200:
                        update_result = update_response.json()
                        if update_result.get('code') == 0:
                            updated_count += 1
                        else:
                            print(f"  更新记录失败: {update_result.get('msg')}")
                    else:
                        print(f"  更新请求失败: {update_response.status_code}")
            
            # 构建返回消息
            messages = []
            if created_count > 0:
                messages.append(f"新建 {created_count} 条")
            if updated_count > 0:
                messages.append(f"更新 {updated_count} 条")
            
            final_message = f"成功导入记录到飞书多维表格（{', '.join(messages)}）" if messages else '导入完成'
            
            return {
                'success': True,
                'imported_count': len(feishu_records),
                'created_count': created_count,
                'updated_count': updated_count,
                'message': final_message
            }
        except Exception as e:
            print(f"导入记录到飞书多维表格出错: {e}")
            return {
                'success': False,
                'error': str(e)
            }


# 初始化飞书API实例
feishu_api = FeishuBitableAPI()


@app.route('/api/feishu/config', methods=['GET'])
def get_feishu_config():
    """获取飞书配置信息（不包含密钥）"""
    return jsonify({
        'success': True,
        'config': {
            'app_id': feishu_api.app_id
        }
    })


@app.route('/api/feishu/config', methods=['POST'])
def update_feishu_config():
    """更新飞书配置信息"""
    try:
        # 获取请求数据
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': '没有提供配置数据'
            }), 400
        
        # 更新飞书API实例的配置
        if 'app_id' in data:
            feishu_api.app_id = data['app_id']
        if 'app_secret' in data:
            feishu_api.app_secret = data['app_secret']
        
        # 保存配置到文件
        config_file = os.path.join('config', 'feishu_config.json')
        os.makedirs(os.path.dirname(config_file), exist_ok=True)
        
        # 读取现有配置
        existing_config = {}
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    existing_config = json.load(f)
            except Exception as e:
                print(f"读取飞书配置文件出错: {e}")
        
        # 更新配置
        existing_config['app_id'] = feishu_api.app_id
        existing_config['app_secret'] = feishu_api.app_secret
        
        # 保存配置到文件
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(existing_config, f, ensure_ascii=False, indent=2)
        
        # 重新加载飞书API实例的配置，确保新配置生效
        feishu_api.load_config()
        
        return jsonify({
            'success': True,
            'message': '飞书配置更新成功'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/feishu/token', methods=['POST'])
def get_feishu_token():
    """获取飞书租户访问令牌"""
    try:
        token = feishu_api.get_tenant_access_token()
        # 返回令牌和过期时间
        return jsonify({
            'success': True,
            'token': token,
            'expire': int(feishu_api.token_expire_time - time.time())
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500



@app.route('/api/feishu/import-records', methods=['POST'])
def import_records_to_feishu():
    """导出记录到飞书多维表格"""
    try:
        # 获取请求数据
        data = request.get_json()
        records = data.get('records', [])
        
        if not records:
            return jsonify({
                'success': False,
                'error': '没有提供记录数据'
            }), 400
        
        # 导出记录
        result = feishu_api.import_records_to_bitable(records)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/feishu/sync-records', methods=['POST'])
def sync_records_from_feishu():
    """从飞书多维表格同步记录到本地"""
    try:
        # 从飞书多维表格获取记录
        result = feishu_api.get_records_from_bitable()
        
        if not result.get('success'):
            return jsonify({
                'success': False,
                'error': result.get('error', '获取飞书记录失败')
            }), 500
        
        feishu_records = result.get('records', [])
        
        # 转换飞书记录为本地记录格式
        local_records = []
        for record in feishu_records:
            fields = record.get('fields', {})
            
            # 生成唯一的ID（如果飞书记录中没有ID，则生成一个新的）
            record_id = fields.get('id(活动唯一标识)', str(uuid.uuid4()))
            
            # 转换日期格式
            date_value = ''
            activity_date = fields.get('活动日期')
            if activity_date:
                try:
                    # 飞书日期字段是时间戳（毫秒）
                    if isinstance(activity_date, (int, float)):
                        date_obj = datetime.fromtimestamp(activity_date / 1000)
                        date_value = date_obj.strftime('%Y/%m/%d')
                    else:
                        # 如果是字符串格式，直接使用
                        date_value = str(activity_date)
                except Exception as e:
                    print(f"转换日期时出错: {e}")
            
            # 转换情绪字段
            emotion_value = ''
            emotion_field = fields.get('emotion(情绪记录)')
            if emotion_field:
                if isinstance(emotion_field, list):
                    emotion_value = ', '.join(emotion_field)
                else:
                    emotion_value = str(emotion_field)
            
            # 转换时间为UTC格式
            start_time = ''
            end_time = ''
            start_time_field = fields.get('startTime(开始时间)')
            end_time_field = fields.get('endTime(结束时间)')
            
            if start_time_field:
                try:
                    # 将北京时间转换为UTC时间
                    beijing_time = datetime.strptime(start_time_field, '%Y-%m-%d %H:%M:%S')
                    # 使用replace方法设置时区
                    beijing_time = beijing_time.replace(tzinfo=BEIJING_TZ)
                    utc_time = beijing_time.astimezone(timezone.utc)
                    start_time = utc_time.isoformat().replace('+00:00', 'Z')
                except Exception as e:
                    print(f"转换开始时间时出错: {e}")
                
                if end_time_field:
                    try:
                        # 将北京时间转换为UTC时间
                        beijing_time = datetime.strptime(end_time_field, '%Y-%m-%d %H:%M:%S')
                        # 使用replace方法设置时区
                        beijing_time = beijing_time.replace(tzinfo=BEIJING_TZ)
                        utc_time = beijing_time.astimezone(timezone.utc)
                        end_time = utc_time.isoformat().replace('+00:00', 'Z')
                    except Exception as e:
                        print(f"转换结束时间时出错: {e}")
            
            # 计算时长（从字符串转换为毫秒）
            duration = 0
            duration_field = fields.get('duration(总计专注时长)')
            if duration_field:
                try:
                    # 解析时长字符串，例如"27分钟1秒"
                    duration_str = str(duration_field)
                    total_seconds = 0
                    
                    # 提取小时
                    hour_match = re.search(r'(\d+)小时', duration_str)
                    if hour_match:
                        total_seconds += int(hour_match.group(1)) * 3600
                    
                    # 提取分钟
                    minute_match = re.search(r'(\d+)分钟', duration_str)
                    if minute_match:
                        total_seconds += int(minute_match.group(1)) * 60
                    
                    # 提取秒
                    second_match = re.search(r'(\d+)秒', duration_str)
                    if second_match:
                        total_seconds += int(second_match.group(1))
                    
                    duration = total_seconds * 1000
                except Exception as e:
                    print(f"转换时长时出错: {e}")
            
            # 计算时间跨度
            time_span = 0
            time_span_field = fields.get('timeSpan(时间跨度)')
            if time_span_field and start_time and end_time:
                try:
                    # 解析时间跨度字符串，例如"3290秒"
                    time_span_str = str(time_span_field)
                    second_match = re.search(r'(\d+)秒', time_span_str)
                    if second_match:
                        time_span = int(second_match.group(1)) * 1000
                except Exception as e:
                    print(f"转换时间跨度时出错: {e}")
            
            # 处理segments字段，从JSON格式的文本转换为Python对象
            segments = []
            segments_field = fields.get('segments(专注段落)')
            if segments_field:
                try:
                    # 如果segments字段是字符串格式的JSON，解析它
                    if isinstance(segments_field, str) and segments_field.strip():
                        segments = json.loads(segments_field)
                    # 如果已经是列表格式，直接使用
                    elif isinstance(segments_field, list):
                        segments = segments_field
                except Exception as e:
                    print(f"解析segments字段时出错: {e}")
            
            local_record = {
                'id': record_id,
                'activity': fields.get('activity(活动名称)', ''),
                'activityCategory': fields.get('activityCategory(活动类型)', ''),
                'date': date_value,
                'startTime': start_time,
                'endTime': end_time,
                'duration': duration,
                'remark': fields.get('remark(感想&记录)', ''),
                'emotion': emotion_value,
                'pauseCount': fields.get('pauseCount(暂停次数)', 0),
                'timeSpan': time_span,
                'segments': segments  # 添加segments字段
            }
            
            local_records.append(local_record)
        
        # 加载现有记录
        existing_records = TimeRecorderUtils.load_records()
        
        # 合并记录（避免重复）
        existing_ids = {record['id'] for record in existing_records}
        new_records = []
        
        for record in local_records:
            # 如果记录ID已存在，跳过
            if record['id'] in existing_ids:
                continue
            
            # 添加记录
            new_records.append(record)
            existing_ids.add(record['id'])
        
        # 保存记录
        all_records = existing_records + new_records
        if TimeRecorderUtils.save_records(all_records):
            return jsonify({
                'success': True,
                'imported_count': len(new_records),
                'message': f'成功从飞书同步 {len(new_records)} 条记录'
            })
        else:
            return jsonify({
                'success': False,
                'error': '保存记录失败'
            }), 500
    except Exception as e:
        print(f"从飞书同步记录出错: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ==================== 今日计划功能 ====================

class DailyPlanUtils:
    """今日计划工具类"""
    
    @staticmethod
    def get_daily_plan_file_path(date_str):
        """获取今日计划文件路径（已废弃，仅保留兼容性）"""
        daily_plans_folder = os.path.join(app.config['DATA_FOLDER'], 'daily_plans')
        os.makedirs(daily_plans_folder, exist_ok=True)
        return os.path.join(daily_plans_folder, f'plan_{date_str}.json')
    
    @staticmethod
    def get_plans_index_file_path():
        """获取计划索引文件路径"""
        daily_plans_folder = os.path.join(app.config['DATA_FOLDER'], 'daily_plans')
        os.makedirs(daily_plans_folder, exist_ok=True)
        return os.path.join(daily_plans_folder, 'plans.json')
    
    @staticmethod
    def load_daily_plan(date_str=None):
        """加载指定日期的今日计划（使用北京时间）"""
        # 如果没有提供日期，使用当前北京时间
        if date_str is None:
            date_str = datetime.now(BEIJING_TZ).strftime('%Y-%m-%d')
        
        # 从统一的plans.json文件中加载计划
        index_file = DailyPlanUtils.get_plans_index_file_path()
        
        if os.path.exists(index_file):
            try:
                with open(index_file, 'r', encoding='utf-8') as f:
                    plans_index = json.load(f)
                    # 查找指定日期的计划
                    for plan_id, plan in plans_index.items():
                        if plan.get('date') == date_str:
                            return plan
            except Exception as e:
                print(f"读取今日计划索引文件出错: {e}")
        
        # 如果计划不存在，创建新的计划
        new_plan = DailyPlanUtils.create_new_daily_plan(date_str)
        # 保存新创建的计划
        DailyPlanUtils.save_daily_plan(new_plan)
        return new_plan
    
    @staticmethod
    def create_new_daily_plan(date_str):
        """创建新的今日计划（使用北京时间日期）"""
        new_plan = {
            'id': str(uuid.uuid4()),
            'date': date_str,
            'importantThings': ['', '', ''],
            'tryThings': ['', '', ''],
            'otherMatters': '',
            'reading': '',
            'score': '',
            'scoreReason': '',
            'activities': [],
            'emotions': [],
            'activityCategories': [],  # 新增：今日的活动类型集合
            'totalDuration': 0,
            'creationDuration': 0,
            'createdAt': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            'updatedAt': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            'syncedToFeishu': False,
            'lastFeishuSyncAt': None,
            'feishuRecordId': None  # 新增：飞书多维表格的记录ID
        }
        return new_plan
    
    @staticmethod
    def save_daily_plan(plan):
        """保存今日计划到统一的索引文件"""
        date_str = plan.get('date')
        if not date_str:
            return False
        
        plan['updatedAt'] = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        
        # 确保计划有ID
        if 'id' not in plan:
            plan['id'] = str(uuid.uuid4())
        
        try:
            # 更新计划索引文件
            DailyPlanUtils.update_plans_index(plan)
            return True
        except Exception as e:
            print(f"保存今日计划文件出错: {e}")
            return False
    
    @staticmethod
    def update_plans_index(plan):
        """更新计划索引文件，存储完整的计划数据"""
        try:
            index_file = DailyPlanUtils.get_plans_index_file_path()
            plans_index = {}
            
            # 如果索引文件存在，先读取现有内容
            if os.path.exists(index_file):
                with open(index_file, 'r', encoding='utf-8') as f:
                    plans_index = json.load(f)
            
            # 更新索引，存储完整的计划数据
            plan_id = plan.get('id')
            plan_date = plan.get('date')
            if plan_id and plan_date:
                plans_index[plan_id] = plan
                
                # 保存索引文件
                with open(index_file, 'w', encoding='utf-8') as f:
                    json.dump(plans_index, f, ensure_ascii=False, indent=2)
                print(f"[调试] 更新计划索引文件成功: {index_file}")
            else:
                print(f"[调试] 计划缺少ID或日期，无法更新索引")
        except Exception as e:
            print(f"更新计划索引文件出错: {e}")
    
    @staticmethod
    def update_plan_from_records(plan):
        """根据活动记录更新今日计划的统计数据"""
        date_str = plan.get('date')
        if not date_str:
            return plan
        
        # 加载当天的记录
        all_records = TimeRecorderUtils.load_records()
        today_records = [r for r in all_records if r.get('date', '').replace('/', '-') == date_str]
        
        # 更新活动列表
        activities = []
        emotions = set()
        activity_categories = set()  # 新增：收集活动类型
        total_duration = 0
        creation_duration = 0
        
        for record in today_records:
            # 计算准确的段落总时间
            accurate_duration = TimeRecorderUtils.calculate_segments_total_time(record.get('segments', []))
            print(f"[调试] 记录ID: {record.get('id', 'N/A')}, 活动: {record.get('activity', '')}")
            print(f"[调试] 记录duration字段: {record.get('duration', 0)}ms, 准确计算时长: {accurate_duration}ms")
            
            # 添加活动
            activity_info = {
                'activity': record.get('activity', ''),
                'category': record.get('activityCategory', ''),
                'duration': accurate_duration,
                'startTime': record.get('startTime', ''),
                'segments': record.get('segments', [])
            }
            activities.append(activity_info)
            
            # 收集活动类型
            category = record.get('activityCategory', '')
            # 过滤掉"其他"类别，确保只显示明确的活动类别
            if category and category != '其他':
                activity_categories.add(category)
            
            # 收集情绪
            emotion_str = record.get('emotion', '')
            if emotion_str:
                for emotion in emotion_str.split(', '):
                    if emotion.strip():
                        emotions.add(emotion.strip())
            
            # 累计时长（使用准确计算的时长）
            total_duration += accurate_duration
            
            # 判断是否是创作类活动
            category = record.get('activityCategory', '')
            is_creation = category == '输出创作'
            if is_creation:
                creation_duration += accurate_duration
        
        # 更新计划
        plan['activities'] = activities
        plan['emotions'] = list(emotions)
        plan['activityCategories'] = list(activity_categories)  # 新增：更新活动类型集合
        plan['totalDuration'] = total_duration
        plan['creationDuration'] = creation_duration
        
        print(f"[调试] 今日计划统计数据更新:")
        print(f"[调试]   总专注时长: {total_duration}ms ({total_duration/1000/60:.1f}分钟)")
        print(f"[调试]   创作时长: {creation_duration}ms ({creation_duration/1000/60:.1f}分钟)")
        print(f"[调试]   活动数量: {len(activities)}")
        
        return plan


@app.route('/api/daily-plan', methods=['GET'])
def get_daily_plan():
    """获取今日计划"""
    date_str = request.args.get('date', datetime.now(BEIJING_TZ).strftime('%Y-%m-%d'))
    
    try:
        plan = DailyPlanUtils.load_daily_plan(date_str)
        # 更新统计数据
        plan = DailyPlanUtils.update_plan_from_records(plan)
        
        return jsonify({
            'success': True,
            'plan': plan
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/daily-plan', methods=['POST'])
def save_daily_plan():
    """保存今日计划"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': '没有提供计划数据'
            }), 400
        
        # 确保有日期字段
        if 'date' not in data:
            data['date'] = datetime.now(BEIJING_TZ).strftime('%Y-%m-%d')
        
        # 加载现有计划（如果存在）
        existing_plan = DailyPlanUtils.load_daily_plan(data['date'])
        
        # 合并数据
        for key, value in data.items():
            if key not in ['id', 'createdAt']:  # 不覆盖这些字段
                existing_plan[key] = value
        
        # 更新统计数据
        existing_plan = DailyPlanUtils.update_plan_from_records(existing_plan)
        
        # 保存计划
        if DailyPlanUtils.save_daily_plan(existing_plan):
            return jsonify({
                'success': True,
                'plan': existing_plan
            })
        else:
            return jsonify({
                'success': False,
                'error': '保存计划失败'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/daily-plan/sync-feishu', methods=['POST'])
def sync_daily_plan_to_feishu():
    """同步今日计划到飞书"""
    try:
        data = request.get_json()
        date_str = data.get('date', datetime.now(BEIJING_TZ).strftime('%Y-%m-%d'))
        
        print(f"[飞书同步] 开始同步今日计划: {date_str}")
        
        # 首先获取表格字段信息以确定正确的字段名
        app_token = "BKCLblwCmajwm9sFmo4cyJxJnON"
        table_id = "tbl6bujbIMxBHqb3"
        
        # 字段映射字典，用于存储飞书表格的实际字段名
        field_mapping = {}
        
        try:
            token = feishu_api.get_tenant_access_token()
            fields_url = f"https://open.feishu.cn/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/fields"
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json; charset=utf-8'
            }
            
            print(f"[飞书同步] 获取表格字段信息...")
            fields_response = requests.get(fields_url, headers=headers)
            print(f"[飞书同步] 字段API响应状态: {fields_response.status_code}")
            
            if fields_response.status_code == 200:
                fields_data = fields_response.json()
                print(f"[飞书同步] 表格字段信息:")
                print(json.dumps(fields_data, ensure_ascii=False, indent=2))
                
                # 提取字段名称并建立映射
                if fields_data.get('code') == 0 and 'data' in fields_data:
                    field_items = fields_data['data'].get('items', [])
                    print(f"\n[飞书同步] 可用字段列表:")
                    for field in field_items:
                        field_name = field.get('field_name', '')
                        field_type = field.get('type', '')
                        print(f"  - {field_name} (type: {field_type})")
                        # 建立简化名到完整名的映射
                        # 尝试从字段名中提取关键词
                        # 优化：支持更灵活的字段名匹配
                        if '今天是' in field_name or '日期' in field_name or 'date' in field_name.lower():
                            field_mapping['date'] = field_name
                        elif '重要' in field_name or 'important' in field_name.lower():
                            field_mapping['importantThings'] = field_name
                        elif '尝试' in field_name or 'try' in field_name.lower():
                            field_mapping['tryThings'] = field_name
                        elif '其他' in field_name or 'other' in field_name.lower():
                            field_mapping['otherMatters'] = field_name
                        elif '充电' in field_name or '阅读' in field_name or 'reading' in field_name.lower():
                            field_mapping['reading'] = field_name
                        elif ('打分' in field_name or '评分' in field_name or '给今天打个分' in field_name) and '原因' not in field_name and '为什么' not in field_name:
                            field_mapping['score'] = field_name
                        elif '为什么' in field_name or '原因' in field_name or 'reason' in field_name.lower():
                            field_mapping['scoreReason'] = field_name
                        elif '活动' in field_name and ('明细' in field_name or '事项' in field_name):
                            field_mapping['activities'] = field_name
                        elif '情绪' in field_name or 'emotion' in field_name.lower():
                            field_mapping['emotions'] = field_name
                        elif ('专注' in field_name and '总' in field_name) or ('今日专注时长' in field_name):
                            field_mapping['totalDuration'] = field_name
                        elif ('创作' in field_name or 'creation' in field_name.lower()) and '时长' in field_name:
                            field_mapping['creationDuration'] = field_name
                        elif '活动类型' in field_name:
                            field_mapping['activityCategories'] = field_name
                    
                    print(f"\n[飞书同步] 字段映射结果:")
                    print(json.dumps(field_mapping, ensure_ascii=False, indent=2))
            else:
                print(f"[飞书同步] 获取字段信息失败: {fields_response.text}")
                # 如果无法获取字段信息，使用默认字段名
                return jsonify({
                    'success': False,
                    'error': f'无法获取飞书表格字段信息: {fields_response.text}'
                }), 500
        except Exception as e:
            print(f"[飞书同步] 获取字段信息异常: {e}")
            return jsonify({
                'success': False,
                'error': f'获取飞书表格字段信息时出错: {str(e)}'
            }), 500
        
        # 加载计划 - 修复：使用指定日期加载计划，而不是总是加载当日计划
        plan = DailyPlanUtils.load_daily_plan(date_str)
        plan = DailyPlanUtils.update_plan_from_records(plan)
            
        # 确保计划的日期与请求的日期一致
        # 如果不一致，更新计划的日期字段
        if plan.get('date') != date_str:
            print(f"[飞书同步] 计划日期与请求日期不一致，更新计划日期: {date_str}")
            plan['date'] = date_str
        
        print(f"[飞书同步] 计划数据: {json.dumps(plan, ensure_ascii=False, indent=2)[:500]}...")
        
        # 准备飞书数据格式
        # 转换日期为时间戳
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        timestamp_value = int(date_obj.timestamp() * 1000)
        
        # 格式化时长
        def format_duration(ms):
            total_seconds = int(ms / 1000)
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            
            if hours > 0:
                return f"{hours}小时{minutes}分钟{seconds}秒"
            elif minutes > 0:
                return f"{minutes}分钟{seconds}秒"
            else:
                return f"{seconds}秒"
        
        # 格式化活动列表
        activities_text = '\n'.join([
            f"- {a['activity']} ({a['category']}) - {format_duration(a['duration'])}"
            for a in plan.get('activities', [])
        ])
        
        # 获取活动类型列表（去重）
        activity_categories = list(set([a['category'] for a in plan.get('activities', [])]))
        
        # 使用映射后的字段名构建飞书记录
        # 如果字段映射为空，说明无法获取字段信息，已在前面返回错误
        if not field_mapping:
            return jsonify({
                'success': False,
                'error': '无法建立字段映射，请检查飞书表格配置'
            }), 500
        
        feishu_record = {
            "fields": {}
        }
        
        # 根据字段映射填充数据
        if 'date' in field_mapping:
            feishu_record['fields'][field_mapping['date']] = timestamp_value
        if 'importantThings' in field_mapping:
            feishu_record['fields'][field_mapping['importantThings']] = '\n'.join(plan.get('importantThings', []))
        if 'tryThings' in field_mapping:
            feishu_record['fields'][field_mapping['tryThings']] = '\n'.join(plan.get('tryThings', []))
        if 'otherMatters' in field_mapping:
            feishu_record['fields'][field_mapping['otherMatters']] = plan.get('otherMatters', '')
        if 'reading' in field_mapping:
            feishu_record['fields'][field_mapping['reading']] = plan.get('reading', '')
        if 'score' in field_mapping:
            feishu_record['fields'][field_mapping['score']] = plan.get('score', '')
        if 'scoreReason' in field_mapping:
            feishu_record['fields'][field_mapping['scoreReason']] = plan.get('scoreReason', '')
        if 'activities' in field_mapping:
            feishu_record['fields'][field_mapping['activities']] = activities_text
        if 'emotions' in field_mapping:
            feishu_record['fields'][field_mapping['emotions']] = plan.get('emotions', [])
        if 'totalDuration' in field_mapping:
            feishu_record['fields'][field_mapping['totalDuration']] = format_duration(plan.get('totalDuration', 0))
        if 'creationDuration' in field_mapping:
            feishu_record['fields'][field_mapping['creationDuration']] = format_duration(plan.get('creationDuration', 0))
        if 'activityCategories' in field_mapping:
            feishu_record['fields'][field_mapping['activityCategories']] = activity_categories
        
        print(f"[飞书同步] 飞书记录数据: {json.dumps(feishu_record, ensure_ascii=False, indent=2)[:500]}...")
        
        # 1. 先查询是否已存在当天日期的记录
        print(f"[飞书同步] 查询是否已存在日期为 {date_str} 的记录...")
        existing_record_id = None
        
        try:
            # 获取日期字段名（用于筛选）
            date_field_name = field_mapping.get('date', '')
            if date_field_name:
                # 由于飞书DateTime字段对筛选操作符支持有限，我们采用查询所有记录然后本地过滤的方式
                search_url = f"https://open.feishu.cn/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/search"
                
                # 不使用filter，查询所有记录
                search_payload = {
                    "page_size": 500  # 最多获取500条记录
                }
                
                print(f"[飞书同步] 查询参数:")
                print(f"  - 日期字段名: {date_field_name}")
                print(f"  - 日期字符串: {date_str}")
                print(f"  - 目标时间戳: {timestamp_value}")
                print(f"  - 查询策略: 查询所有记录后本地过滤")
                
                search_response = requests.post(
                    search_url,
                    json=search_payload,
                    headers=headers
                )
                
                print(f"[飞书同步] 查询API响应状态: {search_response.status_code}")
                
                if search_response.status_code == 200:
                    search_result = search_response.json()
                    if search_result.get('code') == 0:
                        items = search_result.get('data', {}).get('items', [])
                        print(f"[飞书同步] 查询到 {len(items)} 条记录，开始本地过滤...")
                        
                        # 本地过滤：查找日期字段匹配的记录
                        for item in items:
                            fields = item.get('fields', {})
                            record_date_value = fields.get(date_field_name)
                            
                            print(f"[飞书同步] 检查记录: record_id={item.get('record_id')}, 日期值={record_date_value}")
                            
                            # 比较日期：允许一定的误差范围（同一天内）
                            if record_date_value:
                                # 计算时间差（毫秒）
                                time_diff = abs(record_date_value - timestamp_value)
                                # 如果差异小于24小时，认为是同一天
                                if time_diff < 24 * 60 * 60 * 1000:
                                    existing_record_id = item.get('record_id')
                                    print(f"[飞书同步] 找到匹配记录! record_id={existing_record_id}, 时间差={time_diff}ms")
                                    break
                        
                        if existing_record_id:
                            print(f"[飞书同步] 最终找到已存在的记录，record_id: {existing_record_id}")
                        else:
                            print(f"[飞书同步] 未找到匹配记录，将创建新记录")
                    else:
                        print(f"[飞书同步] 查询失败: {search_result.get('msg')}")
                        print(f"[飞书同步] 失败详情: {json.dumps(search_result, ensure_ascii=False, indent=2)}")
                else:
                    print(f"[飞书同步] 查询请求失败: {search_response.text}")
            else:
                print(f"[飞书同步] 警告：未找到日期字段映射，无法查询已存在记录")
        except Exception as e:
            print(f"[飞书同步] 查询记录时出错: {e}")
            import traceback
            traceback.print_exc()
            # 继续执行，默认创建新记录
        
        # 2. 根据是否存在记录，调用不同的API
        if existing_record_id:
            # 更新已存在的记录
            print(f"[飞书同步] 更新已存在的记录...")
            update_url = f"https://open.feishu.cn/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/{existing_record_id}"
            update_response = requests.put(
                update_url,
                json={"fields": feishu_record['fields']},
                headers=headers
            )
            
            print(f"[飞书同步] 更新API响应状态: {update_response.status_code}")
            print(f"[飞书同步] 更新API响应: {update_response.text[:200]}...")
            
            if update_response.status_code == 200:
                update_result = update_response.json()
                if update_result.get('code') == 0:
                    result = {
                        'success': True,
                        'updated': True,
                        'record_id': existing_record_id,
                        'message': '成功更新飞书多维表格中的记录'
                    }
                else:
                    result = {
                        'success': False,
                        'error': f"更新记录失败: {update_result.get('msg', '未知错误')}"
                    }
            else:
                result = {
                    'success': False,
                    'error': f"更新记录请求失败，状态码: {update_response.status_code}"
                }
        else:
            # 创建新记录
            print(f"[飞书同步] 创建新记录...")
            # 直接调用飞书API创建，避免调用import_records_to_bitable导致重复查询
            create_url = f"https://open.feishu.cn/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_create"
            create_response = requests.post(
                create_url,
                json={"records": [feishu_record]},
                headers=headers
            )
            
            print(f"[飞书同步] 创建API响应状态: {create_response.status_code}")
            print(f"[飞书同步] 创建API响应: {create_response.text[:200]}...")
            
            if create_response.status_code == 200:
                create_result = create_response.json()
                if create_result.get('code') == 0:
                    result = {
                        'success': True,
                        'created': True,
                        'message': '成功创建飞书多维表格中的记录'
                    }
                else:
                    result = {
                        'success': False,
                        'error': f"创建记录失败: {create_result.get('msg', '未知错误')}"
                    }
            else:
                result = {
                    'success': False,
                    'error': f"创建记录请求失败，状态码: {create_response.status_code}"
                }
        
        print(f"[飞书同步] 飞书API返回结果: {json.dumps(result, ensure_ascii=False, indent=2)}")
        
        if result.get('success'):
            # 更新同步状态
            plan['syncedToFeishu'] = True
            plan['lastFeishuSyncAt'] = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
            DailyPlanUtils.save_daily_plan(plan)
            
            # 根据是更新还是创建返回不同的消息
            if result.get('updated'):
                print(f"[飞书同步] 更新成功")
                message = f'同步到飞书成功（已更新日期 {date_str} 的记录）'
            elif result.get('created'):
                print(f"[飞书同步] 创建成功")
                message = f'同步到飞书成功（已创建日期 {date_str} 的新记录）'
            else:
                print(f"[飞书同步] 同步成功")
                message = '同步到飞书成功'
            
            return jsonify({
                'success': True,
                'message': message,
                'updated': result.get('updated', False),
                'created': result.get('created', False)
            })
        else:
            error_msg = result.get('error', '同步失败')
            print(f"[飞书同步] 同步失败: {error_msg}")
            return jsonify({
                'success': False,
                'error': error_msg
            }), 500
    except Exception as e:
        error_msg = str(e)
        print(f"[飞书同步] 异常错误: {error_msg}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': error_msg
        }), 500


@app.route('/api/logs', methods=['GET'])
def get_logs():
    """获取日志数据的API端点"""
    try:
        logs = TimeRecorderLogger.get_logs()
        return jsonify({
            'success': True,
            'logs': logs
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/logs/clear', methods=['POST'])
def clear_logs():
    """清空日志数据的API端点"""
    try:
        TimeRecorderLogger.clear_logs()
        return jsonify({
            'success': True,
            'message': '日志已清空'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)
