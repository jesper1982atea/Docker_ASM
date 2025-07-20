
from flask_restx import Namespace, Resource, fields, reqparse
from flask import request, jsonify
from gsxapp.applegsx import AppleGSXAPI
import os


gsx_ns = Namespace('gsx', description='Apple GSX Endpoints')

# Modell för Swagger-dokumentation av POST-body
gsx_api_key_model = gsx_ns.model('GSXApiKey', {
    'api_key': fields.String(required=True, description='GSX API-nyckel')
})

# Filväg för att spara GSX API-nyckeln i en persistent Docker-volym
GSX_KEY_FILE = '/data/gsx_api_key.txt'


# Definiera header-param för Swagger
api_key_header = gsx_ns.parser()
api_key_header.add_argument('X-GSX-API-KEY', location='headers', required=True, help='GSX API-nyckel')

@gsx_ns.route('/device-details/<string:device_id>')
class GSXDeviceDetails(Resource):
    @gsx_ns.expect(api_key_header)
    @gsx_ns.response(200, 'Success')
    @gsx_ns.response(401, 'No API key provided')
    def get(self, device_id):
        api_key = request.headers.get('X-GSX-API-KEY')
        if not api_key:
            return {"error": "No API key provided"}, 401
        gsx = AppleGSXAPI(api_key=api_key)
        data, status = gsx.get_device_details(device_id)
        return data, status


# Endpoint för att hämta och spara GSX API-nyckel
@gsx_ns.route('/gsx-api-key')
class GSXApiKey(Resource):
    @gsx_ns.response(200, 'Success', model=gsx_api_key_model)
    def get(self):
        # Läs nyckeln från fil
        if os.path.exists(GSX_KEY_FILE):
            with open(GSX_KEY_FILE, 'r') as f:
                api_key = f.read().strip()
            return {"api_key": api_key}
        return {"api_key": None}

    @gsx_ns.expect(gsx_api_key_model, validate=True)
    @gsx_ns.response(200, 'Success')
    @gsx_ns.response(400, 'Ingen nyckel angiven')
    def post(self):
        # Endast JSON via Swagger
        data = request.get_json()
        api_key = data.get('api_key')
        if not api_key:
            return {"success": False, "error": "Ingen nyckel angiven"}, 400
        # Spara nyckeln till fil
        with open(GSX_KEY_FILE, 'w') as f:
            f.write(api_key)
        return {"success": True}
