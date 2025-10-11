import os
import json
from datetime import datetime, date
import uuid
import glob
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# 配置文件路径
DATA_FOLDER = 'data'
app.config['DATA_FOLDER'] = DATA_FOLDER

# 确保目录存在
os.makedirs(DATA_FOLDER, exist_ok=True)

def get_data_file_path(date_str=None):
    """获取指定日期的数据文件路径"""
    if date_str is None:
        date_str = date.today().strftime("%Y-%m-%d")
    return os.path.join(app.config['DATA_FOLDER'], f"records_{date_str}.json")

def load_records_by_date(date_str):
    """加载指定日期的记录"""
    data_file = get_data_file_path(date_str)
    if os.path.exists(data_file):
        try:
            with open(data_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"读取记录文件出错: {e}")
            return []
    return []

def load_all_records():
    """加载所有记录"""
    all_records = []
    # 查找所有记录文件
    pattern = os.path.join(app.config['DATA_FOLDER'], "records_*.json")
    files = glob.glob(pattern)
    
    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                records = json.load(f)
                # 为每条记录添加日期字段
                filename = os.path.basename(file_path)
                date_str = filename.replace("records_", "").replace(".json", "")
                for record in records:
                    record['date'] = date_str
                all_records.extend(records)
        except Exception as e:
            print(f"读取记录文件出错 {file_path}: {e}")
    
    # 按开始时间倒序排列
    all_records.sort(key=lambda x: x['startTime'], reverse=True)
    return all_records

def save_records(records, date_str=None):
    """保存记录到指定日期的文件"""
    if date_str is None:
        date_str = date.today().strftime("%Y-%m-%d")
    data_file = get_data_file_path(date_str)
    try:
        with open(data_file, 'w', encoding='utf-8') as f:
            json.dump(records, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"保存记录文件出错: {e}")
        return False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/records')
def records_page():
    return render_template('records.html')

@app.route('/api/records', methods=['GET'])
def get_records():
    """获取今日记录"""
    today = date.today().strftime("%Y-%m-%d")
    records = load_records_by_date(today)
    # 按开始时间倒序排列
    records.sort(key=lambda x: x['startTime'], reverse=True)
    return jsonify({
        'success': True,
        'records': records
    })

@app.route('/api/records/<record_id>', methods=['GET'])
def get_record(record_id):
    """获取单个记录的详细信息"""
    # 查找记录所属的日期文件
    all_records = load_all_records()
    record_date = None
    target_record = None
    
    for record in all_records:
        if record['id'] == record_id:
            record_date = record['date']
            target_record = record
            break
    
    if not record_date or not target_record:
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
    required_fields = ['activity', 'startTime', 'endTime', 'duration']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'error': f'缺少必要字段: {field}'
            }), 400
    
    # 获取活动类别
    activity_category = data.get('activityCategory', get_activity_category(data['activity']))
    
    # 创建新记录
    record = {
        'id': str(uuid.uuid4()),
        'activity': data['activity'],
        'activityCategory': activity_category,  # 添加活动类别字段
        'startTime': data['startTime'],
        'endTime': data['endTime'],
        'duration': data['duration'],
        'remark': data.get('remark', ''),  # 备注信息
        'emotion': data.get('emotion', ''),  # 记录情绪
        'pauseCount': data.get('pauseCount', 0),  # 暂停次数
        'timeSpan': data.get('timeSpan', 0),  # 时间跨度
        'segments': data.get('segments', [])  # 段落记录
    }
    
    # 获取记录日期
    start_date = datetime.fromisoformat(data['startTime'].replace('Z', '+00:00')).date().strftime("%Y-%m-%d")
    
    # 加载现有记录
    records = load_records_by_date(start_date)
    records.append(record)
    
    # 保存记录
    if save_records(records, start_date):
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
    
    # 查找记录所属的日期文件
    all_records = load_all_records()
    record_date = None
    for record in all_records:
        if record['id'] == record_id:
            record_date = record['date']
            break
    
    if not record_date:
        return jsonify({
            'success': False,
            'error': '记录不存在'
        }), 404
    
    # 加载该日期的记录
    records = load_records_by_date(record_date)
    
    # 查找并更新记录
    updated = False
    for record in records:
        if record['id'] == record_id:
            # 特殊处理segments字段，支持追加
            if 'segments' in data and isinstance(data['segments'], dict):
                # 如果是字典，表示添加新的段落
                if 'segments' not in record:
                    record['segments'] = []
                record['segments'].append(data['segments'])
            else:
                # 更新记录字段
                for key, value in data.items():
                    if key != 'id':  # 不允许更新ID
                        record[key] = value
            updated = True
            break
    
    if not updated:
        return jsonify({
            'success': False,
            'error': '记录不存在'
        }), 404
    
    # 保存记录
    if save_records(records, record_date):
        # 返回更新后的记录，包含日期字段
        record['date'] = record_date
        return jsonify({
            'success': True,
            'record': record
        })
    else:
        return jsonify({
            'success': False,
            'error': '保存记录失败'
        }), 500

@app.route('/api/records/<record_id>', methods=['DELETE'])
def delete_record(record_id):
    """删除记录"""
    # 查找记录所属的日期文件
    all_records = load_all_records()
    record_date = None
    for record in all_records:
        if record['id'] == record_id:
            record_date = record['date']
            break
    
    if not record_date:
        return jsonify({
            'success': False,
            'error': '记录不存在'
        }), 404
    
    # 加载该日期的记录
    records = load_records_by_date(record_date)
    
    # 查找并删除记录
    original_length = len(records)
    records = [record for record in records if record['id'] != record_id]
    
    if len(records) == original_length:
        return jsonify({
            'success': False,
            'error': '记录不存在'
        }), 404
    
    # 保存记录
    if save_records(records, record_date):
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
    all_records = load_all_records()
    
    # 应用筛选条件
    filtered_records = all_records
    
    # 搜索关键字
    if search:
        filtered_records = [r for r in filtered_records if 
                           search.lower() in r['activity'].lower() or 
                           (r['remark'] and search.lower() in r['remark'].lower())]
    
    # 日期范围筛选
    if date_from:
        filtered_records = [r for r in filtered_records if r['date'] >= date_from]
    if date_to:
        filtered_records = [r for r in filtered_records if r['date'] <= date_to]
    
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
    today = date.today().strftime("%Y-%m-%d")
    records = load_records_by_date(today)
    
    # 计算总时长和活动次数
    total_duration = sum(record['duration'] for record in records)
    activity_count = len(records)
    
    # 转换为小时和分钟
    hours = total_duration // 3600000
    minutes = (total_duration % 3600000) // 60000
    
    return jsonify({
        'success': True,
        'stats': {
            'totalTime': total_duration,
            'totalHours': hours,
            'totalMinutes': minutes,
            'activityCount': activity_count
        }
    })


def get_activity_category(activity):
    """根据活动名称获取活动类别"""
    # 活动类别映射
    category_map = {
        # 工作输出类
        '梳理方案': '工作输出',
        '执行工作': '工作输出',
        '开会': '工作输出',
        '复盘': '工作输出',
        '探索新方法': '工作输出',
        '进入工作状态': '工作输出',
        
        # 大脑充电类
        '和智者对话': '大脑充电',
        '做调研': '大脑充电',
        
        # 修养生息类
        '睡觉仪式': '修养生息',
        '处理日常': '修养生息',
        
        # 身体改善类
        '健身': '身体改善',
        '创作/写作': '身体改善',
        
        # 沟通交流类
        '交流心得': '沟通交流',
        '散步': '沟通交流',
        '记录|反思|计划': '沟通交流',
        
        # 纯属娱乐类
        '玩玩具': '纯属娱乐',
        
        # 保持学习类
        '学习': '保持学习',
        
        # 生活计划类
        '生活计划': '生活计划',
        
        # 规律作息类
        '规律作息': '规律作息'
    }
    
    # 如果找不到匹配的类别，返回活动名称本身作为类别
    return category_map.get(activity, activity)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)