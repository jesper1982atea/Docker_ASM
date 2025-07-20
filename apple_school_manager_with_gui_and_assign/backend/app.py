from flask import Flask, send_from_directory, jsonify
from flask_restx import Api
from flask_cors import CORS
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.DEBUG, # Changed to DEBUG for more detailed logs
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

REACT_BUILD_DIR = os.path.join(os.path.dirname(__file__), "react-frontend", "build")

app = Flask(__name__, static_folder=REACT_BUILD_DIR, template_folder=REACT_BUILD_DIR)
CORS(app)
api = Api(app, version='1.0', title='Apple API', description='API för Apple-prislistor och rabatter', doc='/swagger')

# Importera och registrera namespaces från routes

from routes.discounts import discounts_ns
from routes.price import price_ns
from routes.gsx import gsx_ns
from routes.asm import asm_ns
from routes.sales import sales_ns


api.add_namespace(price_ns, path='/api/price')
api.add_namespace(discounts_ns, path='/api/discounts')
api.add_namespace(gsx_ns, path='/api/gsx')
# Lägg till direkt endpoint för GSX API-nyckel
api.add_namespace(gsx_ns, path='/gsx-api-key')
api.add_namespace(asm_ns, path='/api/asm')


api.add_namespace(sales_ns, path='/api/sales')


@app.route('/<path:path>')
def static_proxy(path):
    # API, swagger, health handled by Flask
    if path.startswith('api/') or path.startswith('swagger') or path.startswith('health'):
        return ("Not Found", 404)
    # Serve static files from React build
    file_path = os.path.join(REACT_BUILD_DIR, path)
    if os.path.exists(file_path):
        return send_from_directory(REACT_BUILD_DIR, path)
    # Fallback to index.html for SPA routes
    return send_from_directory(REACT_BUILD_DIR, 'index.html')

# @app.route('/')
# def static_root():
#     return send_from_directory(REACT_BUILD_DIR, 'index.html')

@app.route('/')
def serve_index():
    return send_from_directory('react-frontend/dist', 'index.html')

# Serve static files from React build
@app.route('/<path:path>')
def serve_static(path):
    file_path = os.path.join('react-frontend/dist', path)
    if os.path.isfile(file_path):
        return send_from_directory('react-frontend/dist', path)
    return send_from_directory('react-frontend/dist', 'index.html')

@app.route('/health')
def health_check():
    return {"status": "up"}, 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=6000)