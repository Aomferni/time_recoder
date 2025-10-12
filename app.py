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

def get_data_file_path(username=None):
    """获取指定用户的數據文件路径"""
    if username is None:
        username = 'default'
    user_folder = os.path.join(app.config['DATA_FOLDER'], username)
    os.makedirs(user_folder, exist_ok=True)
    return os.path.join(user_folder, f"records_{username}.json")

def load_records_by_username(username):
    """加载指定用户的所有记录"""
    data_file = get_data_file_path(username)
    if os.path.exists(data_file):
        try:
            with open(data_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"读取记录文件出错: {e}")
            return []
    return []

def load_all_records(username=None):
    """加载指定用户的所有记录，如果不指定用户则加载所有用户的记录"""
    all_records = []
    
    if username:
        # 查找指定用户的记录文件
        user_folder = os.path.join(app.config['DATA_FOLDER'], username)
        if os.path.exists(user_folder):
            data_file = os.path.join(user_folder, f"records_{username}.json")
            if os.path.exists(data_file):
                try:
                    with open(data_file, 'r', encoding='utf-8') as f:
                        records = json.load(f)
                        for record in records:
                            record['username'] = username
                            # 确保记录包含date字段
                            if 'date' not in record and 'startTime' in record:
                                record['date'] = record['startTime'][:10].replace('-', '/')
                        all_records.extend(records)
                except Exception as e:
                    print(f"读取记录文件出错 {data_file}: {e}")
    else:
        # 查找所有用户的记录文件
        user_folders = [f.path for f in os.scandir(app.config['DATA_FOLDER']) if f.is_dir()]
        for user_folder in user_folders:
            username = os.path.basename(user_folder)
            data_file = os.path.join(user_folder, f"records_{username}.json")
            if os.path.exists(data_file):
                try:
                    with open(data_file, 'r', encoding='utf-8') as f:
                        records = json.load(f)
                        for record in records:
                            record['username'] = username
                            # 确保记录包含date字段
                            if 'date' not in record and 'startTime' in record:
                                record['date'] = record['startTime'][:10].replace('-', '/')
                        all_records.extend(records)
                except Exception as e:
                    print(f"读取记录文件出错 {data_file}: {e}")
    
    # 按开始时间倒序排列
    all_records.sort(key=lambda x: x['startTime'], reverse=True)
    return all_records

def save_records(records, username=None):
    """保存记录到指定用户的文件"""
    if username is None:
        username = 'default'
    data_file = get_data_file_path(username)
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

@app.route('/project-description')
def project_description():
    return render_template('project_description.html')

@app.route('/manage-categories')
def manage_categories():
    return render_template('manage_categories.html')

@app.route('/api/set-username', methods=['POST'])
def set_username():
    """设置用户名并迁移记录"""
    data = request.get_json()
    new_username = data.get('username')
    old_username = data.get('oldUsername', 'default')
    
    if not new_username:
        return jsonify({
            'success': False,
            'error': '用户名不能为空'
        }), 400
    
    # 迁移记录
    if old_username != new_username:
        if not migrate_user_records(old_username, new_username):
            return jsonify({
                'success': False,
                'error': '迁移记录失败'
            }), 500
    
    return jsonify({
        'success': True,
        'message': '用户名设置成功'
    })

@app.route('/api/records', methods=['GET'])
def get_records():
    """获取今日记录"""
    username = request.args.get('username', 'default')
    all_records = load_records_by_username(username)
    
    # 获取今天的日期
    today = datetime.now().strftime('%Y/%m/%d')
    
    # 筛选今天的记录
    today_records = [record for record in all_records if record.get('date', '') == today]
    
    # 按开始时间倒序排列
    today_records.sort(key=lambda x: x['startTime'], reverse=True)
    
    return jsonify({
        'success': True,
        'records': today_records
    })

@app.route('/api/records/<record_id>', methods=['GET'])
def get_record(record_id):
    """获取单个记录的详细信息"""
    # 查找记录
    username = request.args.get('username', 'default')
    all_records = load_all_records(username)
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
        'date': data['startTime'][:10].replace('-', '/'),  # 添加日期字段
        'startTime': data['startTime'],
        'endTime': data['endTime'],
        'duration': data['duration'],
        'remark': data.get('remark', ''),  # 备注信息
        'emotion': data.get('emotion', ''),  # 记录情绪
        'pauseCount': data.get('pauseCount', 0),  # 暂停次数
        'timeSpan': data.get('timeSpan', 0),  # 时间跨度
        'segments': data.get('segments', [])  # 段落记录
    }
    
    username = data.get('username', 'default')
    
    # 加载现有记录
    records = load_records_by_username(username)
    records.append(record)
    
    # 保存记录
    if save_records(records, username):
        # 添加username字段到返回的记录中
        record['username'] = username
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
    username = request.args.get('username', 'default')
    all_records = load_all_records(username)
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
    
    # 加载该用户的记录
    records = load_records_by_username(username)
    
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
            
            # 更新记录字段
            for key, value in data.items():
                if key != 'id' and key != 'segments':  # 不允许更新ID和segments（已特殊处理）
                    # 特殊处理date字段，确保格式正确
                    if key == 'startTime' and 'date' not in data:
                        record['date'] = value[:10].replace('-', '/')
                    record[key] = value
            updated = True
            break
    
    if not updated:
        return jsonify({
            'success': False,
            'error': '记录不存在'
        }), 404
    
    # 保存记录
    if save_records(records, username):
        # 查找更新后的记录并返回
        updated_record = None
        for record in records:
            if record['id'] == record_id:
                updated_record = record
                # 确保返回的记录包含username和date字段
                if 'username' not in updated_record:
                    updated_record['username'] = username
                if 'date' not in updated_record and 'startTime' in updated_record:
                    updated_record['date'] = updated_record['startTime'][:10].replace('-', '/')
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
    username = request.args.get('username', 'default')
    all_records = load_all_records(username)
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
    
    # 加载该用户的记录
    records = load_records_by_username(username)
    
    # 查找并删除记录
    original_length = len(records)
    records = [record for record in records if record['id'] != record_id]
    
    if len(records) == original_length:
        return jsonify({
            'success': False,
            'error': '记录不存在'
        }), 404
    
    # 保存记录
    if save_records(records, username):
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
    username = request.args.get('username', None)  # 如果没有指定用户，则加载所有用户的记录
    all_records = load_all_records(username)
    
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
    username = request.args.get('username', 'default')
    records = load_records_by_username(username)
    
    # 计算总时长和活动次数
    total_duration = 0
    for record in records:
        # 添加记录本身的时长
        total_duration += record.get('duration', 0)
        # 添加所有段落的时长
        if 'segments' in record and record['segments']:
            for segment in record['segments']:
                segment_start = datetime.fromisoformat(segment['start'].replace('Z', '+00:00')).timestamp() * 1000
                segment_end = datetime.fromisoformat(segment['end'].replace('Z', '+00:00')).timestamp() * 1000
                total_duration += (segment_end - segment_start)
    
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


def migrate_user_records(old_username, new_username):
    """将旧用户名的记录迁移到新用户名"""
    try:
        # 加载旧用户的记录
        old_records = load_records_by_username(old_username)
        
        # 如果旧用户没有记录，直接返回成功
        if not old_records:
            return True
        
        # 加载新用户的记录
        new_records = load_records_by_username(new_username)
        
        # 合并记录
        all_records = new_records + old_records
        
        # 保存到新用户
        if save_records(all_records, new_username):
            # 删除旧用户的记录文件
            old_data_file = get_data_file_path(old_username)
            if os.path.exists(old_data_file):
                os.remove(old_data_file)
                
                # 如果旧用户文件夹为空，删除文件夹
                old_user_folder = os.path.dirname(old_data_file)
                try:
                    os.rmdir(old_user_folder)
                except OSError:
                    # 文件夹不为空，忽略错误
                    pass
            
            return True
        
        return False
    except Exception as e:
        print(f"迁移用户记录出错: {e}")
        return False


def get_activity_category(activity):
    """根据活动名称获取活动类别"""
    # 读取活动类别配置文件
    categories_file = os.path.join(app.config['DATA_FOLDER'], 'activity_categories.json')
    if os.path.exists(categories_file):
        try:
            with open(categories_file, 'r', encoding='utf-8') as f:
                categories_data = json.load(f)
                for category in categories_data.get('categories', []):
                    if activity in category.get('activities', []):
                        return category['name']
        except Exception as e:
            print(f"读取活动类别配置文件出错: {e}")
    
    # 如果找不到匹配的类别，返回活动名称本身作为类别
    return activity


def get_activity_categories():
    """获取所有活动类别配置"""
    categories_file = os.path.join(app.config['DATA_FOLDER'], 'activity_categories.json')
    if os.path.exists(categories_file):
        try:
            with open(categories_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"读取活动类别配置文件出错: {e}")
            return {"categories": []}
    return {"categories": []}


def save_activity_categories(categories_data):
    """保存活动类别配置"""
    categories_file = os.path.join(app.config['DATA_FOLDER'], 'activity_categories.json')
    try:
        with open(categories_file, 'w', encoding='utf-8') as f:
            json.dump(categories_data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"保存活动类别配置文件出错: {e}")
        return False


@app.route('/api/activity-categories', methods=['GET'])
def api_get_activity_categories():
    """获取活动类别配置的API端点"""
    categories_data = get_activity_categories()
    return jsonify({
        'success': True,
        'data': categories_data
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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)