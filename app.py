import os
import json
from datetime import datetime, date, timezone, timedelta
import uuid
import glob
from flask import Flask, render_template, request, jsonify

# 设置北京时区
BEIJING_TZ = timezone(timedelta(hours=8))

app = Flask(__name__)

# 配置文件路径
DATA_FOLDER = 'data'
app.config['DATA_FOLDER'] = DATA_FOLDER

# 确保目录存在
os.makedirs(DATA_FOLDER, exist_ok=True)


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
        for category in categories:
            category_name = category['name']
            color = category['color']
            # 将颜色名称转换为十六进制颜色值
            color_map = {
                'blue': '#2196F3',
                'green': '#4CAF50',
                'purple': '#9C27B0',
                'orange': '#FF9800',
                'cyan': '#00BCD4',
                'gray': '#795548'
            }
            hex_color = color_map.get(color, '#607D8B')
            category_colors[category_name] = hex_color
            
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
                # 获取活动对应的类别（使用更宽松的匹配方式）
                category = TimeRecorderUtils.get_activity_category_loose_match(activity, activity_to_category)
                
                # 获取记录中的活动类别字段
                record_activity_category = record.get('activityCategory', category)
                
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
                
                activity_data[date_str].append({
                    'name': category,
                    'color': category_colors.get(category, '#607D8B'),
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
            category_info = {
                'name': category,
                'color': category_colors.get(category, '#607D8B'),
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
        
        # 如果所有匹配都失败，返回"其他"
        return '其他'
    
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
    return render_template('index.html')

@app.route('/records')
def records_page():
    return render_template('records.html')

@app.route('/project-description')
def project_description():
    return render_template('project_description.html')

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
    
    # 获取活动类别
    activity_category = data.get('activityCategory', get_activity_category(data['activity']))
    
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


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)