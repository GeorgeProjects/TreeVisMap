from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import math, json
from config import DATA_PATH, SVG_PATH
from data_process import load_json_obj, save_svg_file
import os

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADER'] = 'Content-Type'

@app.route('/template/query', methods=['GET'])
@cross_origin()
def queryTemplate():
    dsl_name = request.args.get('dslName') # optional
    dsl_file_index = int(dsl_name)
    folder_name = math.floor(dsl_file_index / 10000)
    result_path = os.path.join(DATA_PATH, str(folder_name), str(dsl_name) + '.json')
    result_obj = load_json_obj(result_path)
    return json.dumps(result_obj)

@app.route('/results/save', methods=['POST'])
@cross_origin()
def saveSVG():
    data = request.json
    svg_data = data['svg']
    svg_folder_name = math.floor(int(data['name']) / 10000)
    svg_folder_path = os.path.join(SVG_PATH, str(svg_folder_name))
    svg_file_name = str(data['name']) + '.svg'
    save_svg_file(svg_folder_path, svg_file_name, svg_data)
    return jsonify(data)
    # print(request.headers)
    # svg_data = request.args.get('data') # optional
    # return 'save svg'

if __name__ == "__main__":
    print('run 0.0.0.0:14453')
    # app.run(threaded=True, host='0.0.0.0', port=14453)
    app.run(host='0.0.0.0', port=14453)