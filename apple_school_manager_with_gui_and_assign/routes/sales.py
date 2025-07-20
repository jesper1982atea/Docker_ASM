from flask import Blueprint, request, jsonify
from asmapp import sales_parser

sales_api = Blueprint('sales_api', __name__)

@sales_api.route('/api/sales/upload', methods=['POST'])
def upload_sales():
    if 'file' not in request.files:
        return jsonify({'error': 'Ingen fil uppladdad.'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Ingen fil vald.'}), 400
    data, error = sales_parser.parse_sales_excel(file)
    if error:
        return jsonify({'error': error}), 400
    return jsonify(data)
