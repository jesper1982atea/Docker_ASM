

from flask_restx import Namespace, Resource
from flask import request
from asmapp import sales_parser

sales_ns = Namespace('Atea Sales API', description='API för försäljningsuppladdning')

@sales_ns.route('/upload')
@sales_ns.doc(description='Ladda upp en Excel-fil med försäljningsdata',
              params={
                  'file': {
                      'description': 'Excel-fil med försäljningsdata (.xlsx)',
                      'in': 'formData',
                      'type': 'file',
                      'required': True
                  }
              })
@sales_ns.response(200, 'Success')
@sales_ns.response(400, 'Fel vid uppladdning')
@sales_ns.produces(['application/json'])
class SalesUpload(Resource):
    def post(self):
        import logging
        logger = logging.getLogger(__name__)
        if 'file' not in request.files:
            logger.error('Ingen fil uppladdad.')
            return {'error': 'Ingen fil uppladdad.'}, 400
        file = request.files['file']
        if file.filename == '':
            logger.error('Ingen fil vald.')
            return {'error': 'Ingen fil vald.'}, 400
        try:
            file_bytes = file.read()
            import io
            excel_stream = io.BytesIO(file_bytes)
            data, error = sales_parser.parse_sales_excel(excel_stream)
            if error:
                logger.error(f'Fel vid parsing: {error}')
                return {'error': error}, 400
            return data, 200
        except Exception as e:
            logger.error(f'Exception vid uppladdning: {e}')
            return {'error': str(e)}, 500
