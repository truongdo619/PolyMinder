import json

def read_json_file_utf8(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data