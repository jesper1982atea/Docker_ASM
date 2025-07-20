
from flask_restx import Namespace, Resource, reqparse
from flask import request
from werkzeug.datastructures import FileStorage
from asmapp import sales_parser

sales_ns = Namespace('Atea Sales API', description='API för försäljningsuppladdning')

upload_parser = reqparse.RequestParser()
upload_parser.add_argument('file', location='files', type=FileStorage, required=True, help='Excel-fil med försäljningsdata')

@sales_ns.route('/upload')
@sales_ns.doc(description='Ladda upp en Excel-fil med försäljningsdata')
class SalesUpload(Resource):
    @sales_ns.expect(upload_parser)
    @sales_ns.response(200, 'Success')
    @sales_ns.response(400, 'Fel vid uppladdning')
    def post(self):
        args = upload_parser.parse_args()
        file = args.get('file')
        if not file:
            return {'error': 'Ingen fil uppladdad.'}, 400
        if file.filename == '':
            return {'error': 'Ingen fil vald.'}, 400
        data, error = sales_parser.parse_sales_excel(file)
        if error:
            return {'error': error}, 400
        return data, 200
