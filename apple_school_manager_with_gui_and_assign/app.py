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

def get_asm_instance(customer_id):
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
        asm, err, code = get_asm_instance(customer_id)
        if err: return jsonify(err), code
        return asm.get_assigned_server(device_id)

@customer_ns.route('/<string:customer_id>/orgs')
class Orgs(Resource):
    def get(self, customer_id):
        asm, err, code = get_asm_instance(customer_id)
        if err: return jsonify(err), code
        return asm.get_orgs()

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
            result = asm.get_orgs()
            return {
                "status": "valid", 
                "message": "Token is active",
                "token_expires_in": max(0, asm.token_expiry - int(time.time())) if asm.token_expiry else None
            }
        except Exception as e:
            logger.error(f"Token validation failed for customer {customer_id}: {e}")
            return {"status": "invalid", "message": str(e)}, 401

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

if __name__ == "__main__":
    # Use environment variables for Docker compatibility
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 6000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host=host, port=port, debug=debug)