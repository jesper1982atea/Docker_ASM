from flask_restx import Namespace, Resource
from flask import request
import os
import json

asm_ns = Namespace('Ade', description='Apple Device Manager Endpoints')

CUSTOMERS_DIR = os.path.join(os.path.dirname(__file__), '..', 'admin_api', 'customers')

def get_customer_meta(customer_id):
    meta_path = os.path.join(CUSTOMERS_DIR, customer_id, 'meta.json')
    if not os.path.exists(meta_path):
        return None
    with open(meta_path, 'r', encoding='utf-8') as f:
        return json.load(f)

@asm_ns.route('/customers')
class Customers(Resource):
    def get(self):
        # List all customer folders
        if not os.path.exists(CUSTOMERS_DIR):
            return []
        return [d for d in os.listdir(CUSTOMERS_DIR) if os.path.isdir(os.path.join(CUSTOMERS_DIR, d))]

@asm_ns.route('/customers/<string:customer_id>/meta')
class CustomerMeta(Resource):
    def get(self, customer_id):
        meta = get_customer_meta(customer_id)
        if not meta:
            return {"error": "meta.json not found"}, 404
        return meta

@asm_ns.route('/customers/<string:customer_id>/devices')
class CustomerDevices(Resource):
    def get(self, customer_id):
        # Dummy: List all devices for a customer (replace with real logic)
        devices_path = os.path.join(CUSTOMERS_DIR, customer_id, 'devices.json')
        if not os.path.exists(devices_path):
            return []
        with open(devices_path, 'r', encoding='utf-8') as f:
            return json.load(f)

@asm_ns.route('/customers/<string:customer_id>/devices/<string:device_id>')
class CustomerDeviceById(Resource):
    def get(self, customer_id, device_id):
        # Dummy: Get device by id (replace with real logic)
        devices_path = os.path.join(CUSTOMERS_DIR, customer_id, 'devices.json')
        if not os.path.exists(devices_path):
            return {"error": "No devices found"}, 404
        with open(devices_path, 'r', encoding='utf-8') as f:
            devices = json.load(f)
        device = next((d for d in devices if d.get('id') == device_id), None)
        if not device:
            return {"error": "Device not found"}, 404
        return device

@asm_ns.route('/customers/<string:customer_id>/orgs')
class CustomerOrgs(Resource):
    def get(self, customer_id):
        # Dummy: List orgs for a customer (replace with real logic)
        orgs_path = os.path.join(CUSTOMERS_DIR, customer_id, 'orgs.json')
        if not os.path.exists(orgs_path):
            return []
        with open(orgs_path, 'r', encoding='utf-8') as f:
            return json.load(f)

@asm_ns.route('/customers/<string:customer_id>/mdmServers')
class CustomerMdmServers(Resource):
    def get(self, customer_id):
        # Dummy: List MDM servers for a customer (replace with real logic)
        mdm_path = os.path.join(CUSTOMERS_DIR, customer_id, 'mdm_servers.json')
        if not os.path.exists(mdm_path):
            return []
        with open(mdm_path, 'r', encoding='utf-8') as f:
            return json.load(f)

# ...existing code...
