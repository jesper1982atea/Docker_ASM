import sys
import os
# Add the project root to sys.path so asmapp can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from flask import Blueprint, jsonify
import os as _os
import json
from asmapp.asmapi import AppleSchoolManagerAPI

asm_bp = Blueprint("asm", __name__)

CUSTOMERS_DIR = os.path.join(os.path.dirname(__file__), "customers")

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
            key_id=meta["key_id"]
        )
        return asm, None, None
    except Exception as e:
        return None, {"error": str(e)}, 500

@asm_bp.route("/api/<customer_id>/devices")
def devices(customer_id):
    asm, err, code = get_asm_instance(customer_id)
    if err: return jsonify(err), code
    return jsonify(asm.get_all_devices())

@asm_bp.route("/api/<customer_id>/mdmServers")
def mdm_servers(customer_id):
    asm, err, code = get_asm_instance(customer_id)
    if err: return jsonify(err), code
    return jsonify(asm.get_mdm_servers())

@asm_bp.route("/api/<customer_id>/device/<device_id>")
def device_detail(customer_id, device_id):
    asm, err, code = get_asm_instance(customer_id)
    if err: return jsonify(err), code
    return jsonify(asm.get_device_by_id(device_id))

@asm_bp.route("/api/<customer_id>/device/<device_id>/assignedServer")
def assigned_server(customer_id, device_id):
    asm, err, code = get_asm_instance(customer_id)
    if err: return jsonify(err), code
    return jsonify(asm.get_assigned_server(device_id))
