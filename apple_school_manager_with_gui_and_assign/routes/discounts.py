from routes.price import PriceListLookup

from flask_restx import Namespace, Resource
from flask import request
import os, json

print("discounts.py loaded")

discounts_ns = Namespace('Apple discounts', description='Apple Discount Program Endpoints')



DISCOUNTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'admin_api', 'discounts')

@discounts_ns.route('/')
class DiscountList(Resource):
    def get(self):
        files = [f for f in os.listdir(DISCOUNTS_DIR) if f.endswith('.json')]
        return [f.replace('.json', '') for f in files]

#@discounts_ns.route('/lookup/<path:program_name>/<string:part_number>')
@discounts_ns.route('/lookup')
@discounts_ns.doc(params={
    'program_name': 'Rabattprogram (valfri, lämna tom för endast funktionell rabatt)',
    'part_number': 'Part Number (kräver exakt, t.ex. MC654KS/A)',
    'price_list': 'Prislista (filnamn, t.ex. Price_List_Sweden_L597287A-en_GB-9_2025-07-09.json)'
})
class DiscountProgramLookup(Resource):
    def get(self):
        program_name = request.args.get('program_name', None)
        part_number = request.args.get('part_number', None)
        price_list = request.args.get('price_list', None)
        if not part_number or not price_list:
            return {"error": "part_number och price_list krävs"}, 400

        price_list_filename = os.path.basename(price_list)
        price_lookup_resource = PriceListLookup()
        price_lookup_result = price_lookup_resource.get(price_list_filename, part_number)
        if isinstance(price_lookup_result, tuple):
            product, status = price_lookup_result
            if status != 200:
                return product, status
        else:
            product = price_lookup_result
        if not isinstance(product, dict) or "error" in product:
            return product, 404

        # 2. Hämta rabatt från programfilen (prefix-match) om program_name finns och inte är tomt/null
        main_discount = None
        main_discount_source = None
        if program_name and str(program_name).lower() not in ('', 'null', 'none'):
            filename = program_name if program_name.endswith('.json') else program_name + '.json'
            path = os.path.join(DISCOUNTS_DIR, filename)
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                pn_variants = [part_number[:n] for n in range(7, 3, -1)]
                for prefix in pn_variants:
                    found = [
                        row for row in data
                        if isinstance(row, dict)
                        and isinstance(row.get('Product Nr./cid Nr.'), str)
                        and row.get('Product Nr./cid Nr.','').upper().startswith(prefix.upper())
                    ]
                    if found:
                        for key in ["Rebate Rate (%)", "discount", "rabatt"]:
                            if key in found[0]:
                                main_discount = found[0][key]
                                main_discount_source = key
                                break
                        break

        # 3. Hämta funktionell rabatt (kategori från produkt, rabatt från functional_discounts.json)
        func_discount = None
        func_category = None
        if 'Category' in product:
            func_category = product['Category']
            func_path = os.path.join(DISCOUNTS_DIR, 'functional_discounts.json')
            if os.path.exists(func_path):
                with open(func_path, 'r', encoding='utf-8') as f:
                    func_data = json.load(f)
                for row in func_data:
                    if isinstance(row, dict) and row.get('category') == func_category:
                        func_discount = row.get('discount')
                        break

        # 4. Summera rabatter
        total_discount = 0
        sources = []
        if main_discount:
            try:
                total_discount += float(main_discount)
            except Exception:
                pass
            sources.append({"source": main_discount_source or "main", "value": main_discount})
        if func_discount:
            try:
                total_discount += float(func_discount)
            except Exception:
                pass
            sources.append({"source": f"functional ({func_category})", "value": func_discount})

        # 5. Räkna ut nytt pris baserat på ALP Ex VAT
        list_price = 0
        if 'ALP Ex VAT' in product:
            try:
                list_price = float(str(product['ALP Ex VAT']).replace(' ', '').replace(',', '.'))
            except Exception:
                list_price = 0
        new_price = list_price * (1 - total_discount)
        discount_amount = list_price - new_price

        return {
            "product": product,
            "program_name": program_name,
            "part_number": part_number,
            "discounts": sources,
            "total_discount": total_discount,
            "list_price": list_price,
            "new_price": new_price,
            "discount_amount": discount_amount
        }

@discounts_ns.route('/<string:program_name>')
class DiscountProgram(Resource):
    def get(self, program_name):
        filename = program_name if program_name.endswith('.json') else program_name + '.json'
        path = os.path.join(DISCOUNTS_DIR, filename)
        if not os.path.exists(path):
            return {"error": "Not found"}, 404
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data

# Endpoint för att slå upp funktionell rabatt baserat på partnummer
@discounts_ns.route('/functional-discount/<path:part_number>')
class FunctionalDiscount(Resource):
    def get(self, part_number):
        # 1. Hitta rätt prislista (json-fil) där partnumret finns
        # 2. Hämta category från raden
        # 3. Hämta rabatt från functional_discounts.json
        price_dir = DISCOUNTS_DIR  # Samma katalog som övriga prislistor
        price_files = [f for f in os.listdir(price_dir) if f.endswith('.json') and f != 'functional_discounts.json']
        category = None
        for price_file in price_files:
            path = os.path.join(price_dir, price_file)
            with open(path, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                except Exception:
                    continue
                for row in data:
                    if isinstance(row, dict) and 'Product Nr./cid Nr.' in row and row['Product Nr./cid Nr.'] and part_number.upper().startswith(row['Product Nr./cid Nr.'].upper()):
                        category = row.get('Product Class') or row.get('category')
                        break
                if category:
                    break
        if not category:
            return {"error": "Partnumber not found in any price list"}, 404
        # Hämta rabatt från functional_discounts.json
        func_path = os.path.join(price_dir, 'functional_discounts.json')
        with open(func_path, 'r', encoding='utf-8') as f:
            func_data = json.load(f)
        discount = None
        for row in func_data:
            if isinstance(row, dict) and row.get('category') == category:
                discount = row.get('discount')
                break
        if discount is None:
            return {"error": f"No functional discount found for category '{category}'"}, 404
        return {"category": category, "discount": discount}
