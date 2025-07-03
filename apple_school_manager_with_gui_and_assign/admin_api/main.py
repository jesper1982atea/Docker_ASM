
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from asm_router import asm_bp
import os
import uuid

app = Flask(__name__)
app.register_blueprint(asm_bp)
CORS(app)

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
CUSTOMERS_DIR = os.path.join(BASE_PATH, "customers")
os.makedirs(CUSTOMERS_DIR, exist_ok=True)

@app.route("/api/customers", methods=["GET"])
def list_customers():
    customers = []
    for customer_id in os.listdir(CUSTOMERS_DIR):
        meta_path = os.path.join(CUSTOMERS_DIR, customer_id, "meta.json")
        if os.path.exists(meta_path):
            with open(meta_path) as f:
                import json
                data = json.load(f)
                data["id"] = customer_id
                customers.append(data)
    return jsonify(customers)

@app.route("/api/customers", methods=["POST"])
def add_customer():
    name = request.form.get("name")
    client_id = request.form.get("client_id")
    team_id = request.form.get("team_id")
    key_id = request.form.get("key_id")
    pem_file = request.files.get("pem")

    if not all([name, client_id, team_id, key_id, pem_file]):
        return jsonify({"error": "Missing fields"}), 400

    customer_id = str(uuid.uuid4())
    customer_path = os.path.join(CUSTOMERS_DIR, customer_id)
    os.makedirs(customer_path, exist_ok=True)

    pem_path = os.path.join(customer_path, "private.pem")
    pem_file.save(pem_path)

    import json
    with open(os.path.join(customer_path, "meta.json"), "w") as f:
        json.dump({
            "name": name,
            "client_id": client_id,
            "team_id": team_id,
            "key_id": key_id
        }, f)

    return jsonify({"status": "added", "id": customer_id}), 201

@app.route("/api/customers/<customer_id>", methods=["DELETE"])
def delete_customer(customer_id):
    path = os.path.join(CUSTOMERS_DIR, customer_id)
    if os.path.exists(path):
        shutil.rmtree(path)
        return jsonify({"status": "deleted"})
    return jsonify({"error": "not found"}), 404

@app.route("/")
def index():
    return send_from_directory("../frontend", "index.html")

@app.route("/frontend/<path:path>")
def static_files(path):
    return send_from_directory("../frontend", path)

if __name__ == "__main__":
    app.run(port=5001)
