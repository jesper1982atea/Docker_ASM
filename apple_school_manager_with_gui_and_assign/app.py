from flask import Flask, jsonify, send_from_directory, redirect, request
from flask_restx import Api, Resource, Namespace, fields
from flask_cors import CORS
import os
import json
from asmapp.asmapi import AppleSchoolManagerAPI
import copy
import shutil
import logging
import time
import requests
import threading

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)
api = Api(app, title="Apple School Manager API", version="1.0", description="API för Apple School Manager-data", doc=False)

CUSTOMERS_DIR = os.path.join(os.path.dirname(__file__), "admin_api", "customers")
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "frontend")

# Cache for ASM instances to avoid recreating them
_asm_instance_cache = {}
_cache_lock = threading.Lock()

def get_asm_instance(customer_id):
    """Get ASM instance with caching to avoid multiple token requests"""
    with _cache_lock:
        # Check if we have a cached instance
        if customer_id in _asm_instance_cache:
            return _asm_instance_cache[customer_id], None, None
    
    path = os.path.join(CUSTOMERS_DIR, customer_id)
    if not os.path.exists(path):
        return None, {"error": "Customer not found"}, 404
    try:
        with open(os.path.join(path, "meta.json")) as f:
            meta = json.load(f)
        asm = AppleSchoolManagerAPI(
            pem_path=os.path.join(path, "private.pem"),
            client_id=meta["client_id"],
            team_id=meta["team_id"],
            key_id=meta["key_id"],
            manager_type=meta.get("manager_type", "school")
        )
        
        # Cache the instance
        with _cache_lock:
            _asm_instance_cache[customer_id] = asm
        
        return asm, None, None
    except Exception as e:
        logger.error(f"Failed to create ASM instance for customer {customer_id}: {e}")
        return None, {"error": str(e)}, 500

# Namespace for customer-specific API
customer_ns = Namespace('api', description='Kundspecifika endpoints')

@customer_ns.route('/<string:customer_id>/devices')
class Devices(Resource):
    def get(self, customer_id):
        try:
            asm, err, code = get_asm_instance(customer_id)
            if err: return jsonify(err), code
            return asm.get_all_devices()
        except Exception as e:
            logger.error(f"Error fetching devices for customer {customer_id}: {e}")
            return {"error": "Failed to fetch devices"}, 500

@customer_ns.route('/<string:customer_id>/devices/<string:device_id>')
class DeviceById(Resource):
    def get(self, customer_id, device_id):
        asm, err, code = get_asm_instance(customer_id)
        if err: return jsonify(err), code
        return asm.get_device_by_id(device_id)

@customer_ns.route('/<string:customer_id>/devices/<string:device_id>/assignedServer')
class DeviceAssignedServer(Resource):
    def get(self, customer_id, device_id):
        """Get the MDM server assigned to a specific device"""
        try:
            asm, err, code = get_asm_instance(customer_id)
            if err: 
                return jsonify(err), code
            
            result = asm.get_assigned_server(device_id)
            return result
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                # Device might not be assigned to any server
                return {"data": None, "message": "Device not assigned to any MDM server"}, 200
            else:
                logger.error(f"HTTP error {e.response.status_code} when fetching assigned server for device {device_id}")
                return {"error": f"HTTP {e.response.status_code}"}, e.response.status_code
                
        except Exception as e:
            logger.error(f"Error fetching assigned server for device {device_id}: {e}")
            return {"error": "Failed to fetch assigned server"}, 500

@customer_ns.route('/<string:customer_id>/orgs')
class Orgs(Resource):
    def get(self, customer_id):
        """This endpoint might not exist in Apple School Manager API"""
        asm, err, code = get_asm_instance(customer_id)
        if err: return jsonify(err), code
        
        # Since /orgs doesn't seem to exist, let's return MDM servers instead
        # or create a custom response
        try:
            return {"message": "Organizations endpoint not available in Apple School Manager API. Use /mdmServers instead."}
        except Exception as e:
            logger.error(f"Error in orgs endpoint for customer {customer_id}: {e}")
            return {"error": "Organizations endpoint not supported"}, 404

@customer_ns.route('/<string:customer_id>/mdmServers')
class MdmServers(Resource):
    def get(self, customer_id):
        asm, err, code = get_asm_instance(customer_id)
        if err: return jsonify(err), code
        # Hämta limit från query-param, default till 100
        limit = request.args.get("limit", default=100, type=int)
        return asm.get_mdm_servers(limit=limit)

@customer_ns.route('/<string:customer_id>/orgDeviceActivities/<string:activity_id>')
class OrgDeviceActivity(Resource):
    def get(self, customer_id, activity_id):
        asm, err, code = get_asm_instance(customer_id)
        if err: return jsonify(err), code
        return asm.get_org_device_activity(activity_id)

org_device_activity_model = api.model('OrgDeviceActivity', {
    "data": fields.Nested(api.model('OrgDeviceActivityData', {
        "type": fields.String(example="orgDeviceActivities"),
        "attributes": fields.Nested(api.model('OrgDeviceActivityAttributes', {
            "activityType": fields.String(example="ASSIGN_DEVICES")
        })),
        "relationships": fields.Nested(api.model('OrgDeviceActivityRelationships', {
            "mdmServer": fields.Nested(api.model('OrgDeviceActivityMdmServer', {
                "data": fields.Nested(api.model('OrgDeviceActivityMdmServerData', {
                    "type": fields.String(example="mdmServers"),
                    "id": fields.String(example="1F97349736CF4614A94F624E705841AD")
                }))
            })),
            "devices": fields.Nested(api.model('OrgDeviceActivityDevices', {
                "data": fields.List(fields.Nested(api.model('OrgDeviceActivityDevice', {
                    "type": fields.String(example="orgDevices"),
                    "id": fields.String(example="XABC123X0ABC123X0")
                })))
            }))
        }))
    }))
})

@customer_ns.route('/<string:customer_id>/orgDeviceActivities')
class OrgDeviceActivities(Resource):
    @api.expect(org_device_activity_model, validate=True)
    @api.response(201, "Activity created")
    def post(self, customer_id):
        """
        Skapa en orgDeviceActivity (t.ex. ASSIGN_DEVICES).

        Exempel på body:
        {
          "data": {
            "type": "orgDeviceActivities",
            "attributes": {
              "activityType": "ASSIGN_DEVICES"
            },
            "relationships": {
              "mdmServer": {
                "data": {
                  "type": "mdmServers",
                  "id": "1F97349736CF4614A94F624E705841AD"
                }
              },
              "devices": {
                "data": [
                  {
                    "type": "orgDevices",
                    "id": "XABC123X0ABC123X0"
                  }
                ]
              }
            }
          }
        }
        """
        asm, err, code = get_asm_instance(customer_id)
        if err: return jsonify(err), code
        payload = request.get_json()
        return asm.create_org_device_activity(payload), 201

@customer_ns.route('/<string:customer_id>/devices/unassigned')
class UnassignedDevices(Resource):
    def get(self, customer_id):
        asm, err, code = get_asm_instance(customer_id)
        if err: return jsonify(err), code
        return asm.get_unassigned_devices()

@customer_ns.route('/<string:customer_id>/devices/assigned')
class AssignedDevices(Resource):
    def get(self, customer_id):
        asm, err, code = get_asm_instance(customer_id)
        if err: return jsonify(err), code
        return asm.get_assigned_devices()

@customer_ns.route('/<string:customer_id>/devices/manually_added')
class ManuallyAddedDevices(Resource):
    def get(self, customer_id):
        asm, err, code = get_asm_instance(customer_id)
        if err: return jsonify(err), code
        return asm.get_manually_added_devices()

@customer_ns.route('/<string:customer_id>/devices/reseller')
class ResellerDevices(Resource):
    def get(self, customer_id):
        asm, err, code = get_asm_instance(customer_id)
        if err: return jsonify(err), code
        return asm.get_reseller_devices()

@customer_ns.route('/<string:customer_id>/token-status')
class TokenStatus(Resource):
    def get(self, customer_id):
        """Check if the customer's token is valid by making a simple API call"""
        try:
            asm, err, code = get_asm_instance(customer_id)
            if err: 
                return {"status": "error", "message": err["error"]}, code
            
            # Try to make a simple API call to test the token
            logger.info(f"Testing token for customer {customer_id}")
            
            # Use mdmServers endpoint instead of orgs (which doesn't exist)
            # This is a lightweight endpoint that should work for both school and business
            result = asm.get_mdm_servers(limit=1)
            
            expires_in = None
            if asm.token_expiry:
                expires_in = max(0, asm.token_expiry - int(time.time()))
            
            return {
                "status": "valid", 
                "message": "Token is active",
                "token_expires_in": expires_in,
                "last_api_call": "successful"
            }
            
        except requests.exceptions.Timeout:
            logger.error(f"Timeout when testing token for customer {customer_id}")
            return {"status": "error", "message": "Request timeout"}, 408
            
        except requests.exceptions.ConnectionError:
            logger.error(f"Connection error when testing token for customer {customer_id}")
            return {"status": "error", "message": "Connection error to Apple API"}, 503
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 401:
                logger.warning(f"Invalid token for customer {customer_id}")
                return {"status": "invalid", "message": "Token is expired or invalid"}, 401
            elif e.response.status_code == 429:
                logger.warning(f"Rate limited for customer {customer_id}")
                return {"status": "rate_limited", "message": "Rate limited by Apple"}, 429
            elif e.response.status_code == 404:
                logger.error(f"404 error for customer {customer_id} - possibly wrong API endpoint or customer configuration")
                return {"status": "configuration_error", "message": "API endpoint not found - check customer configuration"}, 404
            else:
                logger.error(f"HTTP error {e.response.status_code} for customer {customer_id}")
                return {"status": "error", "message": f"HTTP {e.response.status_code}"}, 500
                
        except Exception as e:
            logger.error(f"Token validation failed for customer {customer_id}: {e}")
            return {"status": "error", "message": str(e)}, 500

api.add_namespace(customer_ns)

@api.route("/customers")
@api.route("/api/customers")
class Customers(Resource):
    def get(self):
        customers = []
        if not os.path.exists(CUSTOMERS_DIR):
            return customers
        for customer_id in os.listdir(CUSTOMERS_DIR):
            customer_path = os.path.join(CUSTOMERS_DIR, customer_id)
            meta_path = os.path.join(customer_path, "meta.json")
            if os.path.isdir(customer_path) and os.path.exists(meta_path):
                try:
                    with open(meta_path) as f:
                        data = json.load(f)
                        data["id"] = customer_id
                        customers.append(data)
                except Exception:
                    continue
        return customers

    def post(self):
        # Hantera uppladdning av ny kund
        from werkzeug.utils import secure_filename
        import uuid

        name = request.form.get("name")
        client_id = request.form.get("client_id")
        team_id = request.form.get("team_id")
        key_id = request.form.get("key_id")
        manager_type = request.form.get("manager_type", "school")  # school or business
        pem_file = request.files.get("pem")

        if not all([name, client_id, team_id, key_id, pem_file]):
            return {"error": "Missing fields"}, 400

        if manager_type not in ["school", "business"]:
            return {"error": "Invalid manager_type. Must be 'school' or 'business'"}, 400

        customer_id = str(uuid.uuid4())
        customer_path = os.path.join(CUSTOMERS_DIR, customer_id)
        os.makedirs(customer_path, exist_ok=True)

        pem_path = os.path.join(customer_path, "private.pem")
        pem_file.save(pem_path)

        with open(os.path.join(customer_path, "meta.json"), "w") as f:
            json.dump({
                "name": name,
                "client_id": client_id,
                "team_id": team_id,
                "key_id": key_id,
                "manager_type": manager_type
            }, f)

        return {"status": "added", "id": customer_id}, 201

@api.route("/api/customers/<string:customer_id>")
class CustomerEdit(Resource):
    def get(self, customer_id):
        customer_path = os.path.join(CUSTOMERS_DIR, customer_id)
        meta_path = os.path.join(customer_path, "meta.json")
        
        if not os.path.exists(meta_path):
            return {"error": "Customer not found"}, 404
            
        try:
            with open(meta_path) as f:
                data = json.load(f)
                data["id"] = customer_id
                return data
        except Exception as e:
            return {"error": str(e)}, 500
    
    def put(self, customer_id):
        customer_path = os.path.join(CUSTOMERS_DIR, customer_id)
        meta_path = os.path.join(customer_path, "meta.json")
        
        if not os.path.exists(meta_path):
            return {"error": "Customer not found"}, 404
            
        try:
            # Läs befintlig data
            with open(meta_path) as f:
                existing_data = json.load(f)
            
            # Uppdatera med nya värden
            name = request.form.get("name")
            client_id = request.form.get("client_id")
            team_id = request.form.get("team_id")
            key_id = request.form.get("key_id")
            manager_type = request.form.get("manager_type")
            pem_file = request.files.get("pem")
            
            if name:
                existing_data["name"] = name
            if client_id:
                existing_data["client_id"] = client_id
            if team_id:
                existing_data["team_id"] = team_id
            if key_id:
                existing_data["key_id"] = key_id
            if manager_type and manager_type in ["school", "business"]:
                existing_data["manager_type"] = manager_type
            
            # Uppdatera PEM-fil om en ny laddas upp
            if pem_file:
                pem_path = os.path.join(customer_path, "private.pem")
                pem_file.save(pem_path)
            
            # Spara uppdaterad data
            with open(meta_path, "w") as f:
                json.dump(existing_data, f)
            
            return {"status": "updated", "id": customer_id}
            
        except Exception as e:
            return {"error": str(e)}, 500

    def delete(self, customer_id):
        customer_path = os.path.join(CUSTOMERS_DIR, customer_id)
        if os.path.exists(customer_path):
            shutil.rmtree(customer_path)
            return {"status": "deleted"}
        return {"error": "not found"}, 404

@app.route("/")
def root_redirect():
    return redirect("/frontend/")

@app.route("/frontend/")
def serve_index():
    try:
        return send_from_directory(FRONTEND_DIR, "index.html")
    except FileNotFoundError:
        # If index.html doesn't exist, show a simple frontend page
        return """
        <!DOCTYPE html>
        <html>
        <head><title>Apple School Manager</title></head>
        <body>
            <h1>Apple School Manager Frontend</h1>
            <p>Welcome to the Apple School Manager interface.</p>
            <p><a href="/docs">View API Documentation</a></p>
            <p><a href="/api/customers">View Customers API</a></p>
        </body>
        </html>
        """

@app.route("/frontend/index")
@app.route("/frontend/index.html")
def serve_index_alt():
    try:
        return send_from_directory(FRONTEND_DIR, "index.html")
    except FileNotFoundError:
        return redirect("/frontend/")

@app.route("/health")
def health_check():
    return {"status": "healthy"}, 200

@app.route("/frontend/<path:path>")
def serve_static(path):
    return send_from_directory(FRONTEND_DIR, path)

@app.route("/swagger/<customer_id>")
def swagger_customer(customer_id):
    # Servera en unik swagger.html för kunden (kan vara samma fil, men kunden skickas som query-param)
    return send_from_directory(FRONTEND_DIR, "swagger.html")

def generate_customer_swagger_spec(customer_id):
    orig_spec = api.__schema__
    spec = copy.deepcopy(orig_spec)
    new_paths = {}
    for path, path_item in spec["paths"].items():
        # Ersätt path-parametern med hårdkodat customer_id
        if "{customer_id}" in path:
            new_path = path.replace("{customer_id}", customer_id)
            # Ta bort parameter customer_id från parameters för varje metod (get, post, etc)
            for method, op in path_item.items():
                if isinstance(op, dict) and "parameters" in op:
                    op["parameters"] = [
                        p for p in op["parameters"]
                        if not (p.get("in") == "path" and p.get("name") == "customer_id")
                    ]
            # Ta bort customer_id från root-level parameters för pathen
            if "parameters" in path_item:
                path_item["parameters"] = [
                    p for p in path_item["parameters"]
                    if not (p.get("in") == "path" and p.get("name") == "customer_id")
                ]
            new_paths[new_path] = path_item
        else:
            # Ta bort customer_id från root-level parameters även för paths utan {customer_id}
            if "parameters" in path_item:
                path_item["parameters"] = [
                    p for p in path_item["parameters"]
                    if not (p.get("in") == "path" and p.get("name") == "customer_id")
                ]
            new_paths[path] = path_item
    spec["paths"] = new_paths

    # Ta även bort customer_id från global parameters om det finns
    if "parameters" in spec:
        spec["parameters"] = [
            p for p in spec["parameters"]
            if not (p.get("in") == "path" and p.get("name") == "customer_id")
        ]

    # Lägg till info om vilken kund det gäller
    spec['info']['description'] += f"\n\nDenna Swagger UI är för kund: {customer_id}"
    return spec

@app.route("/swagger-spec/<customer_id>.json")
def swagger_spec_customer(customer_id):
    return generate_customer_swagger_spec(customer_id)

@app.route("/customer/<customer_id>/devices")
def customer_devices_page(customer_id):
    """Serve the customer-specific devices page"""
    return send_from_directory(FRONTEND_DIR, "customer-devices.html")

@customer_ns.route('/<string:customer_id>/devices/unassign')
class UnassignDevices(Resource):
    @api.expect(api.model('UnassignDevices', {
        "device_ids": fields.List(fields.String, required=True, description="List of device IDs to unassign")
    }), validate=True)
    @api.response(201, "Devices unassigned")
    def post(self, customer_id):
        """
        Unassign devices from their current MDM servers.
        
        Exempel på body:
        {
          "device_ids": ["XABC123X0ABC123X0", "XDEF456X0DEF456X0"]
        }
        """
        try:
            asm, err, code = get_asm_instance(customer_id)
            if err: return jsonify(err), code
            
            payload = request.get_json()
            device_ids = payload.get('device_ids', [])
            
            if not device_ids:
                return {"error": "device_ids is required and cannot be empty"}, 400
            
            result = asm.unassign_devices(device_ids)
            return result, 201
            
        except Exception as e:
            logger.error(f"Error unassigning devices for customer {customer_id}: {e}")
            return {"error": "Failed to unassign devices"}, 500

@customer_ns.route('/<string:customer_id>/devices/<string:device_id>/unassign')
class UnassignSingleDevice(Resource):
    @api.response(201, "Device unassigned")
    def post(self, customer_id, device_id):
        """
        Unassign a single device from its current MDM server.
        """
        try:
            asm, err, code = get_asm_instance(customer_id)
            if err: return jsonify(err), code
            
            result = asm.unassign_devices([device_id])
            return result, 201
            
        except Exception as e:
            logger.error(f"Error unassigning device {device_id} for customer {customer_id}: {e}")
            return {"error": "Failed to unassign device"}, 500

if __name__ == "__main__":
    # Use environment variables for Docker compatibility
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 6000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host=host, port=port, debug=debug)