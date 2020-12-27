import json, os

def load_json_obj(filename):
    with open(filename) as json_file:
        data = json.load(json_file)
        return data

def save_json_obj(json_obj, filename):
    with open(filename, 'w') as json_file:
        json.dump(json_obj, json_file)

def save_svg_file(svg_folder_path, svg_file_name, svg_data):
    svg_file_path_name = os.path.join(svg_folder_path, svg_file_name)
    print('svg_file_path_name', svg_file_path_name)
    print('svg_folder_path', svg_folder_path)
    if not os.path.exists(svg_folder_path):
        os.mkdir(svg_folder_path)
    text_file = open(svg_file_path_name, "wt")
    svg_source_data = svg_data['source'][0]
    n = text_file.write(svg_source_data)
    text_file.close()
